import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { formatRWF } from "@/lib/format";

export function ReportsPage() {
  const { active } = useBusiness();
  const [data, setData] = useState<{ daily: number; weekly: number; monthly: number; profitMonth: number; debtTotal: number; stockCost: number } | null>(null);

  useEffect(() => {
    if (!active) return;
    (async () => {
      const now = new Date();
      const day = new Date(now); day.setHours(0,0,0,0);
      const week = new Date(now); week.setDate(now.getDate() - 7);
      const month = new Date(now); month.setDate(now.getDate() - 30);
      const [s, debts, items] = await Promise.all([
        supabase.from("sales").select("total_amount,profit,sale_date").eq("business_id", active.id).gte("sale_date", month.toISOString()),
        supabase.from("debts").select("remaining_amount").eq("business_id", active.id).neq("status","paid"),
        supabase.from("inventory_items").select("quantity,cost_price").eq("business_id", active.id),
      ]);
      const sales = s.data ?? [];
      setData({
        daily: sales.filter(r => new Date(r.sale_date) >= day).reduce((a,r) => a+Number(r.total_amount), 0),
        weekly: sales.filter(r => new Date(r.sale_date) >= week).reduce((a,r) => a+Number(r.total_amount), 0),
        monthly: sales.reduce((a,r) => a+Number(r.total_amount), 0),
        profitMonth: sales.reduce((a,r) => a+Number(r.profit), 0),
        debtTotal: (debts.data ?? []).reduce((a,r) => a+Number(r.remaining_amount), 0),
        stockCost: (items.data ?? []).reduce((a,r) => a+Number(r.quantity)*Number(r.cost_price), 0),
      });
    })();
  }, [active]);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Live business reports"/>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          ["Today sales", data?.daily], ["Last 7 days", data?.weekly], ["Last 30 days", data?.monthly],
          ["Profit (30d)", data?.profitMonth], ["Outstanding debts", data?.debtTotal], ["Stock value (cost)", data?.stockCost],
        ].map(([l,v],i) => <Card key={i}><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{l as string}</p>
          <p className="font-bold text-lg">{formatRWF(Number(v ?? 0))}</p>
        </CardContent></Card>)}
      </div>
    </div>
  );
}