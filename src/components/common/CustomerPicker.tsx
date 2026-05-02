import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { nextReadableId } from "@/lib/queries";

export type Customer = { id: string; customer_id: string; name: string; phone: string | null };

export function CustomerPicker({ value, onChange }: { value: Customer | null; onChange: (c: Customer | null) => void }) {
  const { active } = useBusiness();
  const [list, setList] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!active) return;
    supabase.from("customers").select("id,customer_id,name,phone").eq("business_id", active.id).order("name").then(({data}) => setList((data ?? []) as Customer[]));
  }, [active]);

  const filtered = list.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone ?? "").includes(q));

  const create = async () => {
    if (!active || !name.trim()) return toast.error("Name required");
    const cid = await nextReadableId(active.id, "customers", "CUST");
    const { data, error } = await supabase.from("customers").insert({ business_id: active.id, customer_id: cid, name: name.trim(), phone: phone || null }).select().single();
    if (error) return toast.error(error.message);
    setList([...list, data as Customer]); onChange(data as Customer);
    setCreating(false); setName(""); setPhone("");
  };

  if (value) {
    return (
      <div className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
        <div><p className="font-medium text-sm">{value.name}</p><p className="text-xs text-muted-foreground">{value.phone ?? "—"}</p></div>
        <Button variant="ghost" size="sm" onClick={() => onChange(null)}>Change</Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Input placeholder="Search customer..." value={q} onChange={e => setQ(e.target.value)} />
      {filtered.length > 0 && (
        <div className="max-h-40 overflow-y-auto border rounded-md">
          {filtered.slice(0, 6).map(c => (
            <button key={c.id} type="button" className="w-full text-left p-2 hover:bg-accent text-sm" onClick={() => onChange(c)}>
              {c.name} <span className="text-xs text-muted-foreground">{c.phone}</span>
            </button>
          ))}
        </div>
      )}
      {!creating ? <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>+ New customer</Button> :
        <div className="border rounded-md p-3 space-y-2">
          <div><Label className="text-xs">Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label className="text-xs">Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div className="flex gap-2"><Button type="button" size="sm" onClick={create}>Save</Button><Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button></div>
        </div>}
    </div>
  );
}