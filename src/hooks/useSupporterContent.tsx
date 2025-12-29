import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SupporterNPC {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  appearance: string | null;
  personality: string | null;
  backstory: string | null;
  occupation: string | null;
  location: string | null;
  image_url: string | null;
  creator_name: string;
  creator_tier: string;
  creator_message: string | null;
  is_visible: boolean;
  is_featured: boolean;
  tags: string[] | null;
  created_at: string;
}

export interface SupporterItem {
  id: string;
  name: string;
  description: string | null;
  rarity: string;
  item_type: string;
  requires_attunement: boolean;
  attunement_requirements: string | null;
  properties: string | null;
  damage: string | null;
  damage_type: string | null;
  ac_bonus: number | null;
  image_url: string | null;
  creator_name: string;
  creator_tier: string;
  creator_message: string | null;
  is_visible: boolean;
  is_featured: boolean;
  tags: string[] | null;
  created_at: string;
}

export function useSupporterNPCs() {
  return useQuery({
    queryKey: ["supporter-npcs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supporter_npcs")
        .select("*")
        .eq("is_visible", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SupporterNPC[];
    },
  });
}

export function useSupporterItems() {
  return useQuery({
    queryKey: ["supporter-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supporter_items")
        .select("*")
        .eq("is_visible", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SupporterItem[];
    },
  });
}

export const tierConfig = {
  lendario: {
    label: "Lendário",
    color: "from-amber-500 to-yellow-300",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/50",
    bgColor: "bg-amber-500/10",
    icon: "👑",
  },
  mestre_epico: {
    label: "Mestre Épico",
    color: "from-purple-500 to-pink-500",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/50",
    bgColor: "bg-purple-500/10",
    icon: "⚔️",
  },
} as const;

export const rarityConfig = {
  comum: { label: "Comum", color: "text-gray-400", bgColor: "bg-gray-500/20" },
  incomum: { label: "Incomum", color: "text-green-400", bgColor: "bg-green-500/20" },
  raro: { label: "Raro", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  muito_raro: { label: "Muito Raro", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  lendario: { label: "Lendário", color: "text-amber-400", bgColor: "bg-amber-500/20" },
  artefato: { label: "Artefato", color: "text-red-400", bgColor: "bg-red-500/20" },
} as const;
