import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatRWF, formatDateTime } from "@/lib/format";
import { nextReadableId, logAudit } from "@/lib/queries";
import { CustomerPicker, type Customer } from "@/components/common/CustomerPicker";
import { ItemPicker, type InvItem } from "@/components/common/ItemPicker";

type Sale = { id: string; sale_id: string; total_amount: number; profit: number; sale_date: string; notes: string | null; customer_id: string | null };
type Line = { item: InvItem; quantity: number; unit_price: number };

export function SalesPage() {
  const { active, canManage, isOwner } = useBusiness();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!active) return;
    setLoading(true);
    const { data } = await supabase.from("sales").select("*").eq("business_id", active.id).order("sale_date", { ascending: false }).limit(200);
    setSales((data ?? []) as Sale[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [active]);

  const del = async (s: Sale) => {
    if (!confirm("Delete this sale and restore stock?")) return;
    const { data: items } = await supabase.from("sale_items").select("*").eq("sale_id", s.id);
    for (const it of items ?? []) {
      if (it.inventory_item_id) {
        const { data: inv } = await supabase.from("inventory_items").select("quantity").eq("id", it.inventory_item_id).single();
        if (inv) {
          const newQ = Number(inv.quantity) + Number(it.quantity);
          await supabase.from("inventory_items").update({ quantity: newQ }).eq("id", it.inventory_item_id);
          await supabase.from("stock_movements").insert({
            business_id: active!.id, inventory_item_id: it.inventory_item_id, movement_type: "sale_reversal",
            quantity_change: it.quantity, quantity_before: inv.quantity, quantity_after: newQ,
          });
        }
      }
    }
    await supabase.from("sales").delete().eq("id", s.id);
    await logAudit(active!.id, "delete", "sale", s.id, s);
    toast.success("Sale deleted, stock restored");
    load();
  };

  return (
    <div>
      <PageHeader title="Sales" subtitle="Record and review transactions" actions={
        canManage && <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>New sale</Button></DialogTrigger>
          <NewSaleDialog onClose={() => { setOpen(false); load(); }} />
        </Dialog>
      } />
      {loading ? <p className="text-muted-foreground text-sm">Loading…</p> :
        sales.length === 0 ? <EmptyState icon={<ShoppingCart className="h-10 w-10"/>} title="No sales yet" description="Record your first sale to track revenue." /> :
        <div className="space-y-2">
          {sales.map(s => (
            <Card key={s.id}><CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{s.sale_id} · {formatDateTime(s.sale_date)}</p>
                <p className="font-semibold">{formatRWF(s.total_amount)}</p>
                <p className="text-xs text-muted-foreground">Profit: {formatRWF(s.profit)}</p>
              </div>
              {isOwner && <Button size="icon" variant="ghost" onClick={() => del(s)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
            </CardContent></Card>
          ))}
        </div>}
    </div>
  );
}

function NewSaleDialog({ onClose }: { onClose: () => void }) {
  const { active } = useBusiness();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const total = lines.reduce((a,l) => a + l.quantity * l.unit_price, 0);
  const totalCost = lines.reduce((a,l) => a + l.quantity * l.item.cost_price, 0);
  const profit = total - totalCost;

  const submit = async () => {
    if (!active) return;
    if (lines.length === 0) return toast.error("Add at least one item");
    for (const l of lines) {
      if (l.quantity <= 0) return toast.error("Quantities must be positive");
      if (l.quantity > l.item.quantity) return toast.error(`Not enough stock for ${l.item.item_name}`);
    }
    setSaving(true);
    try {
      const saleId = await nextReadableId(active.id, "sales", "SALE");
      const { data: u } = await supabase.auth.getUser();
      const { data: sale, error } = await supabase.from("sales").insert({
        business_id: active.id, sale_id: saleId, customer_id: customer?.id ?? null,
        total_amount: total, total_cost: totalCost, profit, sold_by: u.user?.id ?? null, notes,
      }).select().single();
      if (error) throw error;
      for (const l of lines) {
        const itemTotal = l.quantity * l.unit_price;
        const itemCost = l.quantity * l.item.cost_price;
        await supabase.from("sale_items").insert({
          business_id: active.id, sale_id: sale.id, inventory_item_id: l.item.id,
          item_name: l.item.item_name, quantity: l.quantity,
          cost_price_snapshot: l.item.cost_price, selling_price_snapshot: l.unit_price,
          total_amount: itemTotal, profit: itemTotal - itemCost,
        });
        const newQ = Number(l.item.quantity) - l.quantity;
        await supabase.from("inventory_items").update({ quantity: newQ }).eq("id", l.item.id);
        await supabase.from("stock_movements").insert({
          business_id: active.id, inventory_item_id: l.item.id, movement_type: "sale",
          quantity_change: -l.quantity, quantity_before: l.item.quantity, quantity_after: newQ,
          cost_price_snapshot: l.item.cost_price, selling_price_snapshot: l.unit_price,
        });
      }
      await logAudit(active.id, "create", "sale", sale.id, null, sale);
      toast.success("Sale recorded");
      onClose();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>New sale</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1"><Label>Customer (optional)</Label><CustomerPicker value={customer} onChange={setCustomer}/></div>
        <div className="space-y-1"><Label>Add items</Label><ItemPicker onPick={(i) => setLines([...lines, { item: i, quantity: 1, unit_price: i.selling_price }])} exclude={lines.map(l => l.item.id)} /></div>
        {lines.length > 0 && <div className="space-y-2 border rounded-md p-2">
          {lines.map((l, idx) => (
            <div key={l.item.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5 text-sm truncate">{l.item.item_name}</div>
              <Input className="col-span-3" type="number" min={1} max={l.item.quantity} value={l.quantity} onChange={e => { const n = Number(e.target.value); setLines(lines.map((x,i) => i===idx ? {...x, quantity: n} : x)); }} />
              <Input className="col-span-3" type="number" value={l.unit_price} onChange={e => { const n = Number(e.target.value); setLines(lines.map((x,i) => i===idx ? {...x, unit_price: n} : x)); }} />
              <Button className="col-span-1" size="icon" variant="ghost" onClick={() => setLines(lines.filter((_,i) => i!==idx))}><Trash2 className="h-3 w-3"/></Button>
            </div>
          ))}
        </div>}
        <div className="space-y-1"><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <div className="flex justify-between border-t pt-3"><span className="text-sm text-muted-foreground">Total</span><span className="text-xl font-bold">{formatRWF(total)}</span></div>
        <Button onClick={submit} disabled={saving} className="w-full">{saving ? "Saving…" : "Record sale"}</Button>
      </div>
    </DialogContent>
  );
}