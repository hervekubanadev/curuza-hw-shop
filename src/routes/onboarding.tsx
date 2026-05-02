import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useBusiness } from "@/contexts/BusinessContext";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: Onboarding,
});

function Onboarding() {
  const { refresh } = useBusiness();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", owner_name: "", business_phone: "", whatsapp_number: "",
    province_city: "", full_address: "", email: "", tin_number: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Shop name required");
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const { error } = await supabase.from("businesses").insert({
      ...form,
      owner_user_id: u.user.id,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Shop created");
    await refresh();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create your shop</CardTitle>
          <CardDescription>Set up your hardware business profile to start managing stock, sales and debts.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Shop name *" v={form.name} onChange={v => setForm({ ...form, name: v })} />
            <Field label="Owner name" v={form.owner_name} onChange={v => setForm({ ...form, owner_name: v })} />
            <Field label="Business phone" v={form.business_phone} onChange={v => setForm({ ...form, business_phone: v })} />
            <Field label="WhatsApp number" v={form.whatsapp_number} onChange={v => setForm({ ...form, whatsapp_number: v })} />
            <Field label="Province / City" v={form.province_city} onChange={v => setForm({ ...form, province_city: v })} />
            <Field label="Full address" v={form.full_address} onChange={v => setForm({ ...form, full_address: v })} />
            <Field label="Email (optional)" v={form.email} onChange={v => setForm({ ...form, email: v })} />
            <Field label="TIN / VAT (optional)" v={form.tin_number} onChange={v => setForm({ ...form, tin_number: v })} />
            <div className="md:col-span-2">
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create shop"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, v, onChange }: { label: string; v: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={v} onChange={e => onChange(e.target.value)} />
    </div>
  );
}