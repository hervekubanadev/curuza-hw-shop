import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Business = {
  id: string;
  owner_user_id: string;
  name: string;
  owner_name: string | null;
  business_phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  province_city: string | null;
  full_address: string | null;
  tin_number: string | null;
  logo_url: string | null;
  company_stamp_url: string | null;
  invoice_footer_note: string | null;
  payment_terms: string | null;
  payment_details: string | null;
  default_signature_name: string | null;
  default_signature_title: string | null;
  currency: string;
  initial_capital: number;
  target_capital: number;
  low_stock_default_limit: number;
  language: string;
};

export type Role = "owner" | "manager" | "employee";

type Ctx = {
  loading: boolean;
  businesses: Business[];
  active: Business | null;
  role: Role | null;
  setActive: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  isOwner: boolean;
  canManage: boolean;
};

const BC = createContext<Ctx | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [active, setActiveBiz] = useState<Business | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setBusinesses([]); setActiveBiz(null); setRole(null); setLoading(false);
      return;
    }
    setLoading(true);
    const { data: profile } = await supabase.from("profiles").select("active_business_id").eq("id", user.id).maybeSingle();
    const { data: biz } = await supabase.from("businesses").select("*").order("created_at", { ascending: true });
    const list = (biz ?? []) as Business[];
    setBusinesses(list);
    let act: Business | null = null;
    if (profile?.active_business_id) act = list.find(b => b.id === profile.active_business_id) ?? null;
    if (!act && list.length) act = list[0];
    setActiveBiz(act);
    if (act) {
      const { data: r } = await supabase.rpc("get_business_role", { _business_id: act.id });
      setRole((r as Role) ?? null);
    } else setRole(null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const setActive = async (id: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ active_business_id: id }).eq("id", user.id);
    await refresh();
  };

  return (
    <BC.Provider value={{
      loading, businesses, active, role, setActive, refresh,
      isOwner: role === "owner",
      canManage: role === "owner" || role === "manager",
    }}>{children}</BC.Provider>
  );
}

export const useBusiness = () => {
  const c = useContext(BC);
  if (!c) throw new Error("useBusiness must be inside BusinessProvider");
  return c;
};