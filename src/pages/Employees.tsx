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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, UserCog } from "lucide-react";
import { toast } from "sonner";

type E = { id: string; name: string; phone: string | null; email: string | null; role: string; is_active: boolean };

export function EmployeesPage() {
  const { active, isOwner } = useBusiness();
  const [list, setList] = useState<E[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [role, setRole] = useState<"manager"|"employee">("employee");

  const load = async () => {
    if (!active) return;
    const { data } = await supabase.from("employees").select("id,name,phone,email,role,is_active").eq("business_id", active.id).order("created_at");
    setList((data ?? []) as E[]);
  };
  useEffect(() => { load(); }, [active]);

  const create = async () => {
    if (!active || !name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("employees").insert({ business_id: active.id, name: name.trim(), phone: phone || null, email: email || null, role });
    if (error) return toast.error(error.message);
    toast.success("Employee added"); setOpen(false); setName(""); setPhone(""); setEmail(""); load();
  };

  const toggle = async (e: E) => { await supabase.from("employees").update({ is_active: !e.is_active }).eq("id", e.id); load(); };

  if (!isOwner) return <div className="p-6 text-muted-foreground">Owner only.</div>;

  return (
    <div>
      <PageHeader title="Employees" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Add employee</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>New employee</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)}/></div>
              <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)}/></div>
              <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)}/></div>
              <div><Label>Role</Label>
                <Select value={role} onValueChange={v => setRole(v as never)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="manager">Manager</SelectItem><SelectItem value="employee">Employee</SelectItem></SelectContent>
                </Select>
              </div>
              <Button onClick={create} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>}/>
      {list.length === 0 ? <EmptyState icon={<UserCog className="h-10 w-10"/>} title="No employees yet"/> :
        <div className="space-y-2">{list.map(e => <Card key={e.id}><CardContent className="p-4 flex justify-between items-center">
          <div><p className="font-semibold">{e.name}</p><p className="text-xs text-muted-foreground">{e.phone ?? e.email ?? "—"}</p></div>
          <div className="flex items-center gap-2"><Badge>{e.role}</Badge>
          <Button size="sm" variant="outline" onClick={() => toggle(e)}>{e.is_active ? "Deactivate" : "Activate"}</Button></div>
        </CardContent></Card>)}</div>}
    </div>
  );
}