import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatRWF, formatDate } from "@/lib/format";
import { nextReadableId } from "@/lib/queries";
import { CustomerPicker, type Customer } from "@/components/common/CustomerPicker";
import { ItemPicker, type InvItem } from "@/components/common/ItemPicker";
import { generateProformaPDF } from "@/lib/pdf";

type P = { id: string; proforma_id: string; customer_name: string | null; customer_phone: string | null; subtotal: number; vat_enabled: boolean; vat_percentage: number; vat_amount: number; grand_total: number; notes: string | null; status: string; created_at: string };
type Line = { item: InvItem; quantity: number; unit_price: number };

export function ProformasPage() {
  const { active, isOwner } = useBusiness();
  const [list, setList] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!active) return; setLoading(true);
    const { data } = await supabase.from("proformas").select("*").eq("business_id", active.id).order("created_at", { ascending: false });
    setList((data ?? []) as P[]); setLoading(false);
  };
  useEffect(() => { load(); }, [active]);

  const download = async (p: P) => {
    if (!active) return;
    const { data: items } = await supabase.from("proforma_items").select("*").eq("proforma_id", p.id);
    generateProformaPDF(active, p, (items ?? []) as never);
  };

  const del = async (p: P) => {
    if (!confirm("Delete proforma?")) return;
    await supabase.from("proformas").delete().eq("id", p.id); load();
  };

  return (
    <div>
      <PageHeader title="Proformas" subtitle="Professional quotations" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>New proforma</Button></DialogTrigger>
          <NewProformaDialog onClose={() => { setOpen(false); load(); }}/>
        </Dialog>}/>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        list.length === 0 ? <EmptyState icon={<FileText className="h-10 w-10"/>} title="No proformas yet"/> :
        <div className="space-y-2">
          {list.map(p => <Card key={p.id}><CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{p.proforma_id} · {formatDate(p.created_at)}</p>
              <p className="font-semibold">{p.customer_name ?? "—"}</p>
              <p className="text-sm">{formatRWF(p.grand_total)}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => download(p)}><Download className="h-4 w-4"/></Button>
              {isOwner && <Button size="icon" variant="ghost" onClick={() => del(p)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
            </div>
          </CardContent></Card>)}
        </div>}
    </div>
  );
}

function NewProformaDialog({ onClose }: { onClose: () => void }) {
  const { active } = useBusiness();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [vat, setVat] = useState(false);
  const [vatPct, setVatPct] = useState(18);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const subtotal = lines.reduce((a,l) => a + l.quantity*l.unit_price, 0);
  const vatAmount = vat ? subtotal * vatPct / 100 : 0;
  const total = subtotal + vatAmount;

  const submit = async () => {
    if (!active) return;
    if (!active.business_phone || !active.full_address) return toast.error("Complete business profile in Settings first");
    if (lines.length === 0) return toast.error("Add items");
    setSaving(true);
    try {
      const pid = await nextReadableId(active.id, "proformas", "PRO");
      const { data: u } = await supabase.auth.getUser();
      const { data: pro, error } = await supabase.from("proformas").insert({
        business_id: active.id, proforma_id: pid, customer_id: customer?.id ?? null,
        customer_name: customer?.name ?? null, customer_phone: customer?.phone ?? null,
        subtotal, vat_enabled: vat, vat_percentage: vat ? vatPct : 0, vat_amount: vatAmount, grand_total: total,
        notes, status: "draft", created_by: u.user?.id ?? null,
      }).select().single();
      if (error) throw error;
      for (const l of lines) {
        await supabase.from("proforma_items").insert({
          business_id: active.id, proforma_id: pro.id, inventory_item_id: l.item.id,
          item_name: l.item.item_name, quantity: l.quantity, unit_price: l.unit_price,
          total_price: l.quantity * l.unit_price,
        });
      }
      generateProformaPDF(active, pro as never, lines.map(l => ({ item_name: l.item.item_name, quantity: l.quantity, unit_price: l.unit_price, total_price: l.quantity*l.unit_price })));
      toast.success("Proforma created"); onClose();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>New proforma</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Customer</Label><CustomerPicker value={customer} onChange={setCustomer}/></div>
        <div><Label>Items</Label><ItemPicker onPick={i => setLines([...lines, { item: i, quantity: 1, unit_price: i.selling_price }])} exclude={lines.map(l => l.item.id)}/></div>
        {lines.map((l, idx) => (
          <div key={l.item.id} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5 text-sm truncate">{l.item.item_name}</div>
            <Input className="col-span-3" type="number" min={1} value={l.quantity} onChange={e => { const n=Number(e.target.value); setLines(lines.map((x,i)=>i===idx?{...x,quantity:n}:x));}}/>
            <Input className="col-span-3" type="number" value={l.unit_price} onChange={e => { const n=Number(e.target.value); setLines(lines.map((x,i)=>i===idx?{...x,unit_price:n}:x));}}/>
            <Button className="col-span-1" size="icon" variant="ghost" onClick={() => setLines(lines.filter((_,i)=>i!==idx))}><Trash2 className="h-3 w-3"/></Button>
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-2"><Label>Add VAT</Label><Switch checked={vat} onCheckedChange={setVat}/></div>
        {vat && <div><Label>VAT %</Label><Input type="number" value={vatPct} onChange={e => setVatPct(Number(e.target.value))}/></div>}
        <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)}/></div>
        <div className="border-t pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatRWF(subtotal)}</span></div>
          {vat && <div className="flex justify-between"><span>VAT {vatPct}%</span><span>{formatRWF(vatAmount)}</span></div>}
          <div className="flex justify-between font-bold text-base"><span>Grand total</span><span>{formatRWF(total)}</span></div>
        </div>
        <Button onClick={submit} disabled={saving} className="w-full">{saving ? "Saving…" : "Create & download PDF"}</Button>
      </div>
    </DialogContent>
  );
}