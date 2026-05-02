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
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { nextReadableId } from "@/lib/queries";

type C = { id: string; customer_id: string; name: string; phone: string | null; address: string | null };

export function CustomersPage() {
  const { active } = useBusiness();
  const [list, setList] = useState<C[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [address, setAddress] = useState("");

  const load = async () => {
    if (!active) return; setLoading(true);
    const { data } = await supabase.from("customers").select("*").eq("business_id", active.id).order("name");
    setList((data ?? []) as C[]); setLoading(false);
  };
  useEffect(() => { load(); }, [active]);

  const create = async () => {
    if (!active || !name.trim()) return toast.error("Name required");
    const cid = await nextReadableId(active.id, "customers", "CUST");
    const { error } = await supabase.from("customers").insert({ business_id: active.id, customer_id: cid, name: name.trim(), phone: phone || null, address: address || null });
    if (error) return toast.error(error.message);
    toast.success("Customer added"); setOpen(false); setName(""); setPhone(""); setAddress(""); load();
  };

  return (
    <div>
      <PageHeader title="Customers" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Add customer</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>New customer</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)}/></div>
              <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)}/></div>
              <div><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)}/></div>
              <Button onClick={create} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>}/>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        list.length === 0 ? <EmptyState icon={<Users className="h-10 w-10"/>} title="No customers" /> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map(c => <Card key={c.id}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{c.customer_id}</p>
            <p className="font-semibold">{c.name}</p>
            <p className="text-sm text-muted-foreground">{c.phone ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.address ?? ""}</p>
          </CardContent></Card>)}
        </div>}
    </div>
  );
}