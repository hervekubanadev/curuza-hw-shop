import { createFileRoute, redirect, Outlet, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { useBusiness } from "@/contexts/BusinessContext";
import { useEffect } from "react";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

function AppLayout() {
  const { loading, businesses } = useBusiness();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && businesses.length === 0) navigate({ to: "/onboarding" });
  }, [loading, businesses, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (businesses.length === 0) return null;
  return <AppShell />;
}

// Re-export Outlet usage: AppShell already renders <Outlet/>
export { Outlet };