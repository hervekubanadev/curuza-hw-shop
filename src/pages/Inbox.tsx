import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, AlertTriangle, PackageX, Clock } from "lucide-react";
import { formatRWF, formatDate } from "@/lib/format";

type Alert = { kind: string; title: string; subtitle: string; severity: "warn"|"error"|"info" };

export function InboxPage() {
  const { active } = useBusiness();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) return;
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0,10);
      const [items, debts] = await Promise.all([
        supabase.from("inventory_items").select("item_name,quantity,low_stock_limit").eq("business_id", active.id),
        supabase.from("debts").select("debt_id,remaining_amount,due_date,status,customer_id").eq("business_id", active.id).neq("status","paid"),
      ]);
      const a: Alert[] = [];
      (items.data ?? []).forEach(i => {
        if (Number(i.quantity) === 0) a.push({ kind:"out", title:`${i.item_name} is out of stock`, subtitle:"Restock soon", severity:"error" });
        else if (Number(i.quantity) <= Number(i.low_stock_limit)) a.push({ kind:"low", title:`${i.item_name} is low`, subtitle:`Only ${i.quantity} left`, severity:"warn" });
      });
      (debts.data ?? []).forEach(d => {
        if (d.due_date && d.due_date < today) a.push({ kind:"overdue", title:`Overdue debt ${d.debt_id}`, subtitle:`${formatRWF(d.remaining_amount)} due ${formatDate(d.due_date)}`, severity:"error" });
        else if (d.due_date === today) a.push({ kind:"due", title:`Debt due today: ${d.debt_id}`, subtitle: formatRWF(d.remaining_amount), severity:"warn" });
      });
      setAlerts(a); setLoading(false);
    })();
  }, [active]);

  return (
    <div>
      <PageHeader title="Inbox" subtitle="Important alerts & reminders"/>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        alerts.length === 0 ? <EmptyState icon={<Inbox className="h-10 w-10"/>} title="All clear" description="No alerts right now."/> :
        <div className="space-y-2">{alerts.map((a,i) => <Card key={i}><CardContent className="p-4 flex items-center gap-3">
          {a.kind === "out" ? <PackageX className="h-5 w-5 text-destructive"/> : a.severity === "error" ? <Clock className="h-5 w-5 text-destructive"/> : <AlertTriangle className="h-5 w-5 text-amber-500"/>}
          <div className="flex-1 min-w-0"><p className="font-medium text-sm">{a.title}</p><p className="text-xs text-muted-foreground">{a.subtitle}</p></div>
          <Badge variant={a.severity === "error" ? "destructive" : "secondary"}>{a.kind}</Badge>
        </CardContent></Card>)}</div>}
    </div>
  );
}