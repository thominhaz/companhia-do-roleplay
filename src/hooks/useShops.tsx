import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Shop {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  location: string | null;
  npc_id: string | null;
  tags: string[];
  is_hidden: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  npc?: {
    id: string;
    name: string;
  } | null;
}

export interface ShopItem {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  price_gold: number;
  price_silver: number;
  price_copper: number;
  quantity: number | null;
  category: string | null;
  rarity: string;
  is_available: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopFormData {
  name: string;
  description?: string;
  location?: string;
  npc_id?: string | null;
  tags?: string[];
  is_hidden?: boolean;
  image_url?: string;
}

export interface ShopItemFormData {
  name: string;
  description?: string;
  price_gold?: number;
  price_silver?: number;
  price_copper?: number;
  quantity?: number | null;
  category?: string;
  rarity?: string;
  is_available?: boolean;
  notes?: string;
}

export function useShops(campaignId: string) {
  const queryClient = useQueryClient();

  const shopsQuery = useQuery({
    queryKey: ["shops", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_shops")
        .select(`
          *,
          npc:campaign_npcs(id, name)
        `)
        .eq("campaign_id", campaignId)
        .order("name");

      if (error) throw error;
      return data as Shop[];
    },
    enabled: !!campaignId,
  });

  const createShop = useMutation({
    mutationFn: async (formData: ShopFormData) => {
      const { data, error } = await supabase
        .from("campaign_shops")
        .insert({
          campaign_id: campaignId,
          name: formData.name,
          description: formData.description || null,
          location: formData.location || null,
          npc_id: formData.npc_id || null,
          tags: formData.tags || [],
          is_hidden: formData.is_hidden || false,
          image_url: formData.image_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops", campaignId] });
      toast.success("Loja criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar loja: " + error.message);
    },
  });

  const updateShop = useMutation({
    mutationFn: async ({ id, ...formData }: ShopFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("campaign_shops")
        .update({
          name: formData.name,
          description: formData.description || null,
          location: formData.location || null,
          npc_id: formData.npc_id || null,
          tags: formData.tags || [],
          is_hidden: formData.is_hidden || false,
          image_url: formData.image_url || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops", campaignId] });
      toast.success("Loja atualizada!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar loja: " + error.message);
    },
  });

  const deleteShop = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("campaign_shops")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops", campaignId] });
      toast.success("Loja removida!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover loja: " + error.message);
    },
  });

  return {
    shops: shopsQuery.data || [],
    isLoading: shopsQuery.isLoading,
    createShop,
    updateShop,
    deleteShop,
  };
}

export function useShopItems(shopId: string) {
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ["shop-items", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_shop_items")
        .select("*")
        .eq("shop_id", shopId)
        .order("category")
        .order("name");

      if (error) throw error;
      return data as ShopItem[];
    },
    enabled: !!shopId,
  });

  const createItem = useMutation({
    mutationFn: async (formData: ShopItemFormData) => {
      const { data, error } = await supabase
        .from("campaign_shop_items")
        .insert({
          shop_id: shopId,
          name: formData.name,
          description: formData.description || null,
          price_gold: formData.price_gold || 0,
          price_silver: formData.price_silver || 0,
          price_copper: formData.price_copper || 0,
          quantity: formData.quantity ?? null,
          category: formData.category || null,
          rarity: formData.rarity || "comum",
          is_available: formData.is_available ?? true,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-items", shopId] });
      toast.success("Item adicionado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao adicionar item: " + error.message);
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...formData }: ShopItemFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("campaign_shop_items")
        .update({
          name: formData.name,
          description: formData.description || null,
          price_gold: formData.price_gold || 0,
          price_silver: formData.price_silver || 0,
          price_copper: formData.price_copper || 0,
          quantity: formData.quantity ?? null,
          category: formData.category || null,
          rarity: formData.rarity || "comum",
          is_available: formData.is_available ?? true,
          notes: formData.notes || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-items", shopId] });
      toast.success("Item atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar item: " + error.message);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("campaign_shop_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-items", shopId] });
      toast.success("Item removido!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover item: " + error.message);
    },
  });

  return {
    items: itemsQuery.data || [],
    isLoading: itemsQuery.isLoading,
    createItem,
    updateItem,
    deleteItem,
  };
}
