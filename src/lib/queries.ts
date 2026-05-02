import { supabase } from "@/integrations/supabase/client";

export async function nextReadableId(businessId: string, key: string, prefix: string) {
  const { data, error } = await supabase.rpc("next_readable_id", {
    _business_id: businessId, _key: key, _prefix: prefix,
  });
  if (error) throw error;
  return data as string;
}

export async function logAudit(businessId: string, action: string, entityType: string, entityId: string, oldVal?: unknown, newVal?: unknown) {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("audit_logs").insert({
    business_id: businessId, user_id: u.user?.id ?? null,
    action, entity_type: entityType, entity_id: entityId,
    old_values: (oldVal ?? null) as never, new_values: (newVal ?? null) as never,
  });
}