import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Truck, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { nextReadableId } from "@/lib/queries";
import { CustomerPicker, type Customer } from "@/components/common/CustomerPicker";
import { ItemPicker, type InvItem } from "@/components/common/ItemPicker";
import { generateDeliveryNotePDF } from "@/lib/pdf";

type DN = { id: string; delivery_note_id: string; customer_name: string | null; delivery_address: string | null; delivery_date: string | null; delivered_by: string | null; received_by: string | null; notes: string | null; status: string; created_at: string };
type Line = { item: InvItem; quantity: number };

export function DeliveryNotesPage() {
  const { active, isOwner } = useBusiness();
  const [list, setList] = useState<DN[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!active) return; setLoading(true);
    const { data } = await supabase.from("delivery_notes").select("*").eq("business_id", active.id).order("created_at", { ascending: false });
    setList((data ?? []) as DN[]); setLoading(false);
  };
  useEffect(() => { load(); }, [active]);

  const download = async (d: DN) => {
    if (!active) return;
    const { data: items } = await supabase.from("delivery_note_items").select("*").eq("delivery_note_id", d.id);
    generateDeliveryNotePDF(active, d, (items ?? []) as never);
  };
  const del = async (d: DN) => { if (!confirm("Delete?")) return; await supabase.from("delivery_notes").delete().eq("id", d.id); load(); };

  return (
    <div>
      <PageHeader title="Delivery notes" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>New delivery note</Button></DialogTrigger>
          <NewDNDialog onClose={() => { setOpen(false); load(); }}/>
        </Dialog>}/>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        list.length === 0 ? <EmptyState icon={<Truck className="h-10 w-10"/>} title="No delivery notes"/> :
        <div className="space-y-2">{list.map(d => <Card key={d.id}><CardContent className="p-4 flex justify-between items-center">
          <div><p className="text-xs text-muted-foreground">{d.delivery_note_id} · {formatDate(d.created_at)}</p><p className="font-semibold">{d.customer_name ?? "—"}</p></div>
          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => download(d)}><Download className="h-4 w-4"/></Button>
          {isOwner && <Button size="icon" variant="ghost" onClick={() => del(d)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}</div>
        </CardContent></Card>)}</div>}
    </div>
  );
}

function NewDNDialog({ onClose }: { onClose: () => void }) {
  const { active } = useBusiness();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [address, setAddress] = useState(""); const [delDate, setDelDate] = useState(""); const [delBy, setDelBy] = useState(""); const [recBy, setRecBy] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!active) return;
    if (!active.business_phone) return toast.error("Complete business profile in Settings");
    if (lines.length === 0) return toast.error("Add items");
    setSaving(true);
    try {
      const did = await nextReadableId(active.id, "delivery_notes", "DN");
      const { data: u } = await supabase.auth.getUser();
      const { data: dn, error } = await supabase.from("delivery_notes").insert({
        business_id: active.id, delivery_note_id: did, customer_id: customer?.id ?? null,
        customer_name: customer?.name ?? null, customer_phone: customer?.phone ?? null,
        delivery_address: address || null, delivery_date: delDate || null,
        delivered_by: delBy || null, received_by: recBy || null,
        status: "pending", created_by: u.user?.id ?? null,
      }).select().single();
      if (error) throw error;
      for (const l of lines) {
        await supabase.from("delivery_note_items").insert({
          business_id: active.id, delivery_note_id: dn.id, inventory_item_id: l.item.id,
          item_name: l.item.item_name, quantity: l.quantity, unit_type: l.item.unit_type,
        });
      }
      generateDeliveryNotePDF(active, dn as never, lines.map(l => ({ item_name: l.item.item_name, quantity: l.quantity, unit_type: l.item.unit_type })));
      toast.success("Delivery note created"); onClose();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>New delivery note</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Customer</Label><CustomerPicker value={customer} onChange={setCustomer}/></div>
        <div><Label>Items</Label><ItemPicker onPick={i => setLines([...lines, { item: i, quantity: 1 }])} exclude={lines.map(l=>l.item.id)}/></div>
        {lines.map((l,idx) => (
          <div key={l.item.id} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-7 text-sm truncate">{l.item.item_name}</div>
            <Input className="col-span-4" type="number" min={1} value={l.quantity} onChange={e => { const n=Number(e.target.value); setLines(lines.map((x,i)=>i===idx?{...x,quantity:n}:x));}}/>
            <Button className="col-span-1" size="icon" variant="ghost" onClick={() => setLines(lines.filter((_,i)=>i!==idx))}><Trash2 className="h-3 w-3"/></Button>
          </div>
        ))}
        <div><Label>Delivery address</Label><Input value={address} onChange={e => setAddress(e.target.value)}/></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Date</Label><Input type="date" value={delDate} onChange={e => setDelDate(e.target.value)}/></div>
          <div><Label>Delivered by</Label><Input value={delBy} onChange={e => setDelBy(e.target.value)}/></div>
        </div>
        <div><Label>Received by</Label><Input value={recBy} onChange={e => setRecBy(e.target.value)}/></div>
        <Button onClick={submit} disabled={saving} className="w-full">{saving ? "Saving…" : "Create & download PDF"}</Button>
      </div>
    </DialogContent>
  );
}