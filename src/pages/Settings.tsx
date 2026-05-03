import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";

export function SettingsPage() {
  const { active, refresh, isOwner } = useBusiness();
  const [f, setF] = useState<Record<string,string|number>>({});
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<Array<{ id: string; action: string; entity_type: string | null; created_at: string; user_id: string | null }>>([]);

  useEffect(() => {
    if (active) setF({
      name: active.name, owner_name: active.owner_name ?? "", business_phone: active.business_phone ?? "",
      whatsapp_number: active.whatsapp_number ?? "", email: active.email ?? "", province_city: active.province_city ?? "",
      full_address: active.full_address ?? "", tin_number: active.tin_number ?? "",
      invoice_footer_note: active.invoice_footer_note ?? "", payment_terms: active.payment_terms ?? "",
      payment_details: active.payment_details ?? "", initial_capital: active.initial_capital ?? 0,
      target_capital: active.target_capital ?? 0, low_stock_default_limit: active.low_stock_default_limit ?? 5,
    });
  }, [active]);

  useEffect(() => {
    if (!active || !isOwner) return;
    supabase.from("audit_logs").select("id,action,entity_type,created_at,user_id")
      .eq("business_id", active.id).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setLogs(data ?? []));
  }, [active, isOwner]);

  const save = async () => {
    if (!active) return; setSaving(true);
    const { error } = await supabase.from("businesses").update(f as never).eq("id", active.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved"); refresh();
  };

  const reset = async () => {
    if (!active || !isOwner) return;
    if (!confirm("Factory reset? This deletes all sales, debts, customers, inventory, documents.")) return;
    const tables = ["sale_items","sales","debt_payments","debt_items","debts","proforma_items","proformas","delivery_note_items","delivery_notes","stock_movements","inventory_items","customers","app_settings"];
    for (const t of tables) await supabase.from(t as never).delete().eq("business_id", active.id);
    toast.success("Factory reset complete");
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Business profile & preferences"/>
      <Card>
        <CardHeader><CardTitle>Business profile</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["name","Shop name"],["owner_name","Owner name"],["business_phone","Business phone"],["whatsapp_number","WhatsApp number"],
            ["email","Email"],["province_city","Province / City"],["full_address","Full address"],["tin_number","TIN / VAT number"],
          ].map(([k,l]) => <div key={k} className="space-y-1"><Label>{l}</Label><Input value={String(f[k] ?? "")} onChange={e => setF({...f, [k]: e.target.value})}/></div>)}
          <div className="space-y-1 md:col-span-2"><Label>Payment terms</Label><Textarea value={String(f.payment_terms ?? "")} onChange={e => setF({...f, payment_terms: e.target.value})}/></div>
          <div className="space-y-1 md:col-span-2"><Label>Payment details</Label><Textarea value={String(f.payment_details ?? "")} onChange={e => setF({...f, payment_details: e.target.value})}/></div>
          <div className="space-y-1 md:col-span-2"><Label>Invoice footer note</Label><Textarea value={String(f.invoice_footer_note ?? "")} onChange={e => setF({...f, invoice_footer_note: e.target.value})}/></div>
          <div className="space-y-1"><Label>Initial capital</Label><Input type="number" value={Number(f.initial_capital ?? 0)} onChange={e => setF({...f, initial_capital: Number(e.target.value)})}/></div>
          <div className="space-y-1"><Label>Target capital</Label><Input type="number" value={Number(f.target_capital ?? 0)} onChange={e => setF({...f, target_capital: Number(e.target.value)})}/></div>
          <div className="space-y-1"><Label>Default low stock limit</Label><Input type="number" value={Number(f.low_stock_default_limit ?? 5)} onChange={e => setF({...f, low_stock_default_limit: Number(e.target.value)})}/></div>
          <div className="md:col-span-2"><Button onClick={save} disabled={saving || !isOwner} className="w-full">{saving ? "Saving…" : "Save changes"}</Button></div>
        </CardContent>
      </Card>

      {isOwner && <Card className="mt-6 border-destructive/50">
        <CardHeader><CardTitle className="text-destructive">Danger zone</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={reset}>Factory reset business data</Button>
        </CardContent>
      </Card>}

      {isOwner && <Card className="mt-6">
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? <p className="text-sm text-muted-foreground">No audit entries yet.</p> :
            <div className="space-y-1 text-sm max-h-80 overflow-y-auto">
              {logs.map(l => (
                <div key={l.id} className="flex justify-between border-b py-2">
                  <span><span className="font-medium capitalize">{l.action}</span> <span className="text-muted-foreground">{l.entity_type}</span></span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(l.created_at)}</span>
                </div>
              ))}
            </div>}
        </CardContent>
      </Card>}

      <Card className="mt-6">
        <CardHeader><CardTitle>About</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong className="text-foreground">CURUZA Quincalleries</strong> — multi-tenant management for hardware shops.</p>
          <p>Developed by <strong className="text-foreground">KUBANA Friend Hervé</strong></p>
          <p>Junior Software Developer passionate about building practical business tools for African markets.</p>
        </CardContent>
      </Card>
    </div>
  );
}