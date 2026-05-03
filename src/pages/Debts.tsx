import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Wallet, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { formatRWF, formatDate } from "@/lib/format";
import { nextReadableId, logAudit } from "@/lib/queries";
import { CustomerPicker, type Customer } from "@/components/common/CustomerPicker";
import { ItemPicker, type InvItem } from "@/components/common/ItemPicker";
import { whatsappLink } from "@/lib/pdf";

type Debt = { id: string; debt_id: string; total_amount: number; amount_paid: number; remaining_amount: number; status: string; date_taken: string; due_date: string | null; customer_id: string; notes: string | null };
type Line = { item: InvItem; quantity: number; unit_price: number };
type CustomerMini = { id: string; name: string; phone: string | null };

function statusOf(d: Debt): string {
  if (d.remaining_amount <= 0) return "paid";
  if (d.due_date && new Date(d.due_date) < new Date()) return "overdue";
  if (d.amount_paid > 0) return "partial";
  return "unpaid";
}

export function DebtsPage() {
  const { active, isOwner } = useBusiness();
  const [list, setList] = useState<Debt[]>([]);
  const [customers, setCustomers] = useState<Record<string, CustomerMini>>({});
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [payDebt, setPayDebt] = useState<Debt | null>(null);

  const load = async () => {
    if (!active) return; setLoading(true);
    const { data } = await supabase.from("debts").select("*").eq("business_id", active.id).order("created_at", { ascending: false });
    const debts = (data ?? []) as Debt[];
    setList(debts);
    const ids = Array.from(new Set(debts.map(d => d.customer_id)));
    if (ids.length) {
      const { data: cs } = await supabase.from("customers").select("id,name,phone").in("id", ids);
      const map: Record<string, CustomerMini> = {};
      (cs ?? []).forEach(c => { map[c.id] = c as CustomerMini; });
      setCustomers(map);
    } else setCustomers({});
    setLoading(false);
  };
  useEffect(() => { load(); }, [active]);

  const del = async (d: Debt) => {
    if (!confirm("Delete debt?")) return;
    await supabase.from("debts").delete().eq("id", d.id);
    await logAudit(active!.id, "delete", "debt", d.id, d);
    toast.success("Deleted"); load();
  };

  const remind = (d: Debt) => {
    const c = customers[d.customer_id];
    if (!c?.phone) return toast.error("Customer has no phone number");
    const msg = `Hello ${c.name}, this is a friendly reminder from ${active!.name}. Your outstanding balance is ${formatRWF(d.remaining_amount)}` +
      (d.due_date ? ` (due ${formatDate(d.due_date)})` : "") + `. Ref: ${d.debt_id}. Thank you.`;
    window.open(whatsappLink(c.phone, msg), "_blank");
  };

  return (
    <div>
      <PageHeader title="Debts" subtitle="Track customer credits & payments" actions={
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>New debt</Button></DialogTrigger>
          <NewDebtDialog onClose={() => { setOpenNew(false); load(); }}/>
        </Dialog>}/>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        list.length === 0 ? <EmptyState icon={<Wallet className="h-10 w-10"/>} title="No debts" /> :
        <div className="space-y-2">
          {list.map(d => {
            const st = statusOf(d);
            return <Card key={d.id}><CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{d.debt_id} · {formatDate(d.date_taken)}</p>
                <p className="font-semibold">{formatRWF(d.remaining_amount)} <span className="text-xs text-muted-foreground">/ {formatRWF(d.total_amount)}</span></p>
                {d.due_date && <p className="text-xs text-muted-foreground">Due {formatDate(d.due_date)}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={st === "paid" ? "secondary" : st === "overdue" ? "destructive" : "default"}>{st}</Badge>
                {d.remaining_amount > 0 && <Button size="sm" onClick={() => setPayDebt(d)}>Pay</Button>}
                {d.remaining_amount > 0 && customers[d.customer_id]?.phone && (
                  <Button size="icon" variant="outline" title="Send WhatsApp reminder" onClick={() => remind(d)}>
                    <MessageCircle className="h-4 w-4 text-green-600"/>
                  </Button>
                )}
                {isOwner && <Button size="icon" variant="ghost" onClick={() => del(d)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
              </div>
            </CardContent></Card>;
          })}
        </div>}
      {payDebt && <PaymentDialog debt={payDebt} onClose={() => { setPayDebt(null); load(); }}/>}
    </div>
  );
}

function NewDebtDialog({ onClose }: { onClose: () => void }) {
  const { active } = useBusiness();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const total = lines.reduce((a,l) => a + l.quantity * l.unit_price, 0);

  const submit = async () => {
    if (!active || !customer) return toast.error("Select customer");
    if (lines.length === 0) return toast.error("Add items");
    for (const l of lines) if (l.quantity > l.item.quantity) return toast.error(`Not enough stock for ${l.item.item_name}`);
    setSaving(true);
    try {
      const debtId = await nextReadableId(active.id, "debts", "DEBT");
      const { data: u } = await supabase.auth.getUser();
      const { data: debt, error } = await supabase.from("debts").insert({
        business_id: active.id, debt_id: debtId, customer_id: customer.id,
        total_amount: total, remaining_amount: total, status: "unpaid",
        due_date: dueDate || null, created_by: u.user?.id ?? null, notes,
      }).select().single();
      if (error) throw error;
      for (const l of lines) {
        const itemTotal = l.quantity * l.unit_price;
        await supabase.from("debt_items").insert({
          business_id: active.id, debt_id: debt.id, inventory_item_id: l.item.id,
          item_name: l.item.item_name, quantity: l.quantity, unit_price: l.unit_price,
          total_price: itemTotal, cost_price_snapshot: l.item.cost_price,
          profit_snapshot: itemTotal - l.quantity * l.item.cost_price,
        });
        const newQ = Number(l.item.quantity) - l.quantity;
        await supabase.from("inventory_items").update({ quantity: newQ }).eq("id", l.item.id);
        await supabase.from("stock_movements").insert({
          business_id: active.id, inventory_item_id: l.item.id, movement_type: "debt",
          quantity_change: -l.quantity, quantity_before: l.item.quantity, quantity_after: newQ,
        });
      }
      toast.success("Debt recorded"); onClose();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>New debt</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Customer</Label><CustomerPicker value={customer} onChange={setCustomer}/></div>
        <div><Label>Add items</Label><ItemPicker onPick={(i) => setLines([...lines, { item: i, quantity: 1, unit_price: i.selling_price }])} exclude={lines.map(l => l.item.id)}/></div>
        {lines.length > 0 && <div className="border rounded-md p-2 space-y-2">
          {lines.map((l,idx) => (
            <div key={l.item.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5 text-sm truncate">{l.item.item_name}</div>
              <Input className="col-span-3" type="number" min={1} value={l.quantity} onChange={e => { const n=Number(e.target.value); setLines(lines.map((x,i)=>i===idx?{...x,quantity:n}:x));}}/>
              <Input className="col-span-3" type="number" value={l.unit_price} onChange={e => { const n=Number(e.target.value); setLines(lines.map((x,i)=>i===idx?{...x,unit_price:n}:x));}}/>
              <Button className="col-span-1" size="icon" variant="ghost" onClick={() => setLines(lines.filter((_,i)=>i!==idx))}><Trash2 className="h-3 w-3"/></Button>
            </div>
          ))}
        </div>}
        <div><Label>Due date</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}/></div>
        <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)}/></div>
        <div className="flex justify-between border-t pt-3"><span className="text-sm text-muted-foreground">Total</span><span className="font-bold">{formatRWF(total)}</span></div>
        <Button onClick={submit} disabled={saving} className="w-full">{saving ? "Saving…" : "Record debt"}</Button>
      </div>
    </DialogContent>
  );
}

function PaymentDialog({ debt, onClose }: { debt: Debt; onClose: () => void }) {
  const { active } = useBusiness();
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!active) return;
    if (amount <= 0 || amount > debt.remaining_amount) return toast.error("Invalid amount");
    setSaving(true);
    try {
      const payId = await nextReadableId(active.id, "payments", "PAY");
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("debt_payments").insert({
        business_id: active.id, payment_id: payId, debt_id: debt.id, customer_id: debt.customer_id,
        amount_paid: amount, received_by: u.user?.id ?? null, note,
      });
      const newPaid = Number(debt.amount_paid) + amount;
      const newRem = Number(debt.total_amount) - newPaid;
      const status = newRem <= 0 ? "paid" : (newPaid > 0 ? "partial" : "unpaid");
      await supabase.from("debts").update({ amount_paid: newPaid, remaining_amount: newRem, status }).eq("id", debt.id);
      toast.success("Payment recorded"); onClose();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Remaining: <strong>{formatRWF(debt.remaining_amount)}</strong></p>
        <div className="space-y-3 mt-3">
          <div><Label>Amount</Label><Input type="number" min={1} max={debt.remaining_amount} value={amount} onChange={e => setAmount(Number(e.target.value))}/></div>
          <div><Label>Note</Label><Input value={note} onChange={e => setNote(e.target.value)}/></div>
          <Button onClick={submit} disabled={saving} className="w-full">{saving ? "Saving…" : "Confirm payment"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}