import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Search, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { formatRWF, normalizeName } from "@/lib/format";
import { nextReadableId, logAudit } from "@/lib/queries";

type Item = {
  id: string; item_id: string; item_name: string; normalized_name: string;
  category: string | null; subcategory: string | null; unit_type: string;
  quantity: number; cost_price: number; selling_price: number;
  supplier_name: string | null; low_stock_limit: number; notes: string | null;
};

const UNITS = ["piece","box","packet","bag","kg","meter","liter","roll","sheet","pair","set"];

export function InventoryPage() {
  const { active, canManage } = useBusiness();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all"|"low"|"out">("all");
  const [openAdd, setOpenAdd] = useState(false);
  const [restockItem, setRestockItem] = useState<Item | null>(null);

  const load = async () => {
    if (!active) return;
    setLoading(true);
    const { data, error } = await supabase.from("inventory_items").select("*").eq("business_id", active.id).order("item_name");
    if (error) toast.error(error.message);
    setItems((data ?? []) as Item[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [active]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (filter === "low" && !(i.quantity > 0 && i.quantity <= i.low_stock_limit)) return false;
      if (filter === "out" && i.quantity > 0) return false;
      if (!q) return true;
      const n = q.toLowerCase();
      return i.item_name.toLowerCase().includes(n) || (i.category ?? "").toLowerCase().includes(n) || i.item_id.toLowerCase().includes(n);
    });
  }, [items, q, filter]);

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Hardware stock & purchase records" actions={
        canManage && <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Add item</Button></DialogTrigger>
          <AddItemDialog onClose={() => { setOpenAdd(false); load(); }} />
        </Dialog>
      } />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, category or ID" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as never)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All items</SelectItem>
            <SelectItem value="low">Low stock</SelectItem>
            <SelectItem value="out">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <p className="text-muted-foreground text-sm">Loading…</p> :
        filtered.length === 0 ? <EmptyState icon={<Package className="h-10 w-10"/>} title="No items" description="Add your first stock item to get started." /> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(i => (
            <Card key={i.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{i.item_id}</p>
                    <h3 className="font-semibold truncate">{i.item_name}</h3>
                    <p className="text-xs text-muted-foreground">{i.category ?? "—"}</p>
                  </div>
                  {i.quantity === 0 ? <Badge variant="destructive">Out</Badge> :
                    i.quantity <= i.low_stock_limit ? <Badge className="bg-amber-500">Low</Badge> :
                    <Badge variant="secondary">{i.quantity} {i.unit_type}</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div><p className="text-muted-foreground">Cost</p><p className="font-medium">{formatRWF(i.cost_price)}</p></div>
                  <div><p className="text-muted-foreground">Selling</p><p className="font-medium">{formatRWF(i.selling_price)}</p></div>
                  <div><p className="text-muted-foreground">Stock value</p><p className="font-medium">{formatRWF(i.quantity * i.cost_price)}</p></div>
                  <div><p className="text-muted-foreground">Expected profit</p><p className="font-medium">{formatRWF(i.quantity * (i.selling_price - i.cost_price))}</p></div>
                </div>
                {canManage && <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => setRestockItem(i)}>
                  <PackagePlus className="h-3 w-3 mr-1"/>Restock
                </Button>}
              </CardContent>
            </Card>
          ))}
        </div>
      }

      {restockItem && <RestockDialog item={restockItem} onClose={() => { setRestockItem(null); load(); }} />}
    </div>
  );
}

function AddItemDialog({ onClose }: { onClose: () => void }) {
  const { active } = useBusiness();
  const [f, setF] = useState({ item_name: "", category: "", subcategory: "", unit_type: "piece", quantity: 0, cost_price: 0, selling_price: 0, supplier_name: "", low_stock_limit: 5, notes: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    if (!f.item_name.trim()) return toast.error("Name required");
    setSaving(true);
    try {
      const norm = normalizeName(f.item_name);
      const { data: existing } = await supabase.from("inventory_items").select("id,quantity").eq("business_id", active.id).eq("normalized_name", norm).maybeSingle();
      if (existing) {
        // restock instead
        const newQty = Number(existing.quantity) + Number(f.quantity);
        await supabase.from("inventory_items").update({ quantity: newQty, cost_price: f.cost_price, selling_price: f.selling_price }).eq("id", existing.id);
        await supabase.from("stock_movements").insert({
          business_id: active.id, inventory_item_id: existing.id, movement_type: "restock",
          quantity_change: f.quantity, quantity_before: existing.quantity, quantity_after: newQty,
          cost_price_snapshot: f.cost_price, selling_price_snapshot: f.selling_price, reason: "Restock via add",
        });
        toast.success("Item exists — restocked");
      } else {
        const itemId = await nextReadableId(active.id, "inventory", "ITEM");
        const { data: ins, error } = await supabase.from("inventory_items").insert({
          business_id: active.id, item_id: itemId, item_name: f.item_name.trim(), normalized_name: norm,
          category: f.category || null, subcategory: f.subcategory || null, unit_type: f.unit_type,
          quantity: f.quantity, cost_price: f.cost_price, selling_price: f.selling_price,
          supplier_name: f.supplier_name || null, low_stock_limit: f.low_stock_limit, notes: f.notes || null,
        }).select().single();
        if (error) throw error;
        await supabase.from("stock_movements").insert({
          business_id: active.id, inventory_item_id: ins.id, movement_type: "initial",
          quantity_change: f.quantity, quantity_before: 0, quantity_after: f.quantity,
          cost_price_snapshot: f.cost_price, selling_price_snapshot: f.selling_price,
        });
        await logAudit(active.id, "create", "inventory_item", ins.id, null, ins);
        toast.success("Item added");
      }
      onClose();
    } catch (err) { toast.error((err as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Add stock item</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1"><Label>Item name *</Label><Input value={f.item_name} onChange={e => setF({...f, item_name: e.target.value})} required /></div>
        <div className="space-y-1"><Label>Category</Label><Input value={f.category} onChange={e => setF({...f, category: e.target.value})} /></div>
        <div className="space-y-1"><Label>Subcategory</Label><Input value={f.subcategory} onChange={e => setF({...f, subcategory: e.target.value})} /></div>
        <div className="space-y-1"><Label>Unit</Label>
          <Select value={f.unit_type} onValueChange={v => setF({...f, unit_type: v})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label>Quantity</Label><Input type="number" min={0} value={f.quantity} onChange={e => setF({...f, quantity: Number(e.target.value)})} /></div>
        <div className="space-y-1"><Label>Cost price (RWF)</Label><Input type="number" min={0} value={f.cost_price} onChange={e => setF({...f, cost_price: Number(e.target.value)})} /></div>
        <div className="space-y-1"><Label>Selling price (RWF)</Label><Input type="number" min={0} value={f.selling_price} onChange={e => setF({...f, selling_price: Number(e.target.value)})} /></div>
        <div className="space-y-1"><Label>Supplier</Label><Input value={f.supplier_name} onChange={e => setF({...f, supplier_name: e.target.value})} /></div>
        <div className="space-y-1"><Label>Low stock limit</Label><Input type="number" min={0} value={f.low_stock_limit} onChange={e => setF({...f, low_stock_limit: Number(e.target.value)})} /></div>
        <DialogFooter className="col-span-2"><Button type="submit" disabled={saving} className="w-full">{saving ? "Saving…" : "Save item"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}

function RestockDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const { active } = useBusiness();
  const [qty, setQty] = useState(0);
  const [cost, setCost] = useState(item.cost_price);
  const [sell, setSell] = useState(item.selling_price);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!active || qty <= 0) return toast.error("Enter a positive quantity");
    setSaving(true);
    try {
      const newQty = Number(item.quantity) + Number(qty);
      await supabase.from("inventory_items").update({ quantity: newQty, cost_price: cost, selling_price: sell }).eq("id", item.id);
      await supabase.from("stock_movements").insert({
        business_id: active.id, inventory_item_id: item.id, movement_type: "restock",
        quantity_change: qty, quantity_before: item.quantity, quantity_after: newQty,
        cost_price_snapshot: cost, selling_price_snapshot: sell,
      });
      toast.success("Restocked");
      onClose();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Restock {item.item_name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>Quantity to add</Label><Input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))}/></div>
          <div className="space-y-1"><Label>Cost price</Label><Input type="number" value={cost} onChange={e => setCost(Number(e.target.value))}/></div>
          <div className="space-y-1"><Label>Selling price</Label><Input type="number" value={sell} onChange={e => setSell(Number(e.target.value))}/></div>
          <Button onClick={submit} disabled={saving} className="w-full">{saving ? "Saving…" : "Confirm restock"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}