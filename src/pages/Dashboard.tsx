import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { formatRWF } from "@/lib/format";
import { ShoppingCart, TrendingUp, Wallet, Users, Package, AlertTriangle, BadgeDollarSign, PackageX } from "lucide-react";

type Stats = {
  todaySales: number; todayProfit: number; unpaidDebts: number; customers: number;
  stockCost: number; stockSelling: number; expectedProfit: number;
  lowStock: number; outStock: number;
};

export function DashboardPage() {
  const { active } = useBusiness();
  const [s, setS] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) return;
    let ignore = false;
    (async () => {
      setLoading(true);
      const today = new Date(); today.setHours(0,0,0,0);
      const iso = today.toISOString();

      const [sales, debts, custs, items] = await Promise.all([
        supabase.from("sales").select("total_amount,profit,sale_date").eq("business_id", active.id).gte("sale_date", iso),
        supabase.from("debts").select("remaining_amount,status").eq("business_id", active.id).neq("status","paid"),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("business_id", active.id),
        supabase.from("inventory_items").select("quantity,cost_price,selling_price,low_stock_limit").eq("business_id", active.id),
      ]);

      const todaySales = (sales.data ?? []).reduce((a,r) => a + Number(r.total_amount), 0);
      const todayProfit = (sales.data ?? []).reduce((a,r) => a + Number(r.profit), 0);
      const unpaidDebts = (debts.data ?? []).reduce((a,r) => a + Number(r.remaining_amount), 0);
      const it = items.data ?? [];
      const stockCost = it.reduce((a,r) => a + Number(r.quantity)*Number(r.cost_price), 0);
      const stockSelling = it.reduce((a,r) => a + Number(r.quantity)*Number(r.selling_price), 0);
      const expectedProfit = stockSelling - stockCost;
      const lowStock = it.filter(r => Number(r.quantity) > 0 && Number(r.quantity) <= Number(r.low_stock_limit)).length;
      const outStock = it.filter(r => Number(r.quantity) === 0).length;

      if (!ignore) {
        setS({ todaySales, todayProfit, unpaidDebts, customers: custs.count ?? 0, stockCost, stockSelling, expectedProfit, lowStock, outStock });
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [active]);

  return (
    <div>
      <PageHeader title={`Welcome${active ? ", " + active.name : ""}`} subtitle="Live business overview" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Stat label="Today sales" value={formatRWF(s?.todaySales)} icon={<ShoppingCart className="h-4 w-4"/>} loading={loading} />
        <Stat label="Today profit" value={formatRWF(s?.todayProfit)} icon={<TrendingUp className="h-4 w-4"/>} loading={loading} />
        <Stat label="Unpaid debts" value={formatRWF(s?.unpaidDebts)} icon={<Wallet className="h-4 w-4"/>} loading={loading} />
        <Stat label="Customers" value={String(s?.customers ?? 0)} icon={<Users className="h-4 w-4"/>} loading={loading} />
        <Stat label="Stock value (cost)" value={formatRWF(s?.stockCost)} icon={<Package className="h-4 w-4"/>} loading={loading} />
        <Stat label="Stock value (selling)" value={formatRWF(s?.stockSelling)} icon={<BadgeDollarSign className="h-4 w-4"/>} loading={loading} />
        <Stat label="Expected profit" value={formatRWF(s?.expectedProfit)} icon={<TrendingUp className="h-4 w-4"/>} loading={loading} />
        <Stat label="Low / Out stock" value={`${s?.lowStock ?? 0} / ${s?.outStock ?? 0}`} icon={<AlertTriangle className="h-4 w-4"/>} loading={loading} />
      </div>
      <Card className="mt-6">
        <CardContent className="p-6 text-sm text-muted-foreground">
          <p>Use the sidebar to manage stock, sales, debts and documents. All data is isolated per business and updated in real time.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon, loading }: { label: string; value: string; icon: React.ReactNode; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground text-xs">{label}{icon}</div>
        <div className="text-lg md:text-2xl font-bold mt-1 truncate">{loading ? "…" : value}</div>
      </CardContent>
    </Card>
  );
}