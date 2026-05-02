import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type InvItem = { id: string; item_name: string; quantity: number; cost_price: number; selling_price: number; unit_type: string };

export function ItemPicker({ onPick, exclude = [] }: { onPick: (i: InvItem) => void; exclude?: string[] }) {
  const { active } = useBusiness();
  const [items, setItems] = useState<InvItem[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    if (!active) return;
    supabase.from("inventory_items").select("id,item_name,quantity,cost_price,selling_price,unit_type").eq("business_id", active.id).order("item_name").then(({data}) => setItems((data ?? []) as InvItem[]));
  }, [active]);

  const filtered = items.filter(i => !exclude.includes(i.id) && (!q || i.item_name.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-2">
      <Input placeholder="Search item..." value={q} onChange={e => setQ(e.target.value)} />
      <div className="max-h-44 overflow-y-auto border rounded-md">
        {filtered.slice(0, 8).map(i => (
          <button key={i.id} type="button" className="w-full text-left p-2 hover:bg-accent text-sm flex justify-between items-center" onClick={() => onPick(i)}>
            <span>{i.item_name}</span>
            <Badge variant={i.quantity === 0 ? "destructive" : "secondary"}>{i.quantity} {i.unit_type}</Badge>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground p-3">No items</p>}
      </div>
    </div>
  );
}