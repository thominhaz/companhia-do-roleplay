import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { ShopItem } from "./useShops";

export interface ShopTransaction {
  id: string;
  shop_id: string;
  shop_item_id: string;
  campaign_id: string;
  seller_user_id: string;
  buyer_user_id: string;
  buyer_character_id: string;
  quantity: number;
  price_gold: number;
  price_silver: number;
  price_copper: number;
  item_data: {
    name: string;
    description?: string;
    category?: string;
    rarity?: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  responded_at: string | null;
  shop?: {
    name: string;
  };
  character?: {
    name: string;
  };
}

export interface CreateTransactionData {
  shop_id: string;
  shop_item_id: string;
  campaign_id: string;
  buyer_user_id: string;
  buyer_character_id: string;
  quantity: number;
  price_gold: number;
  price_silver: number;
  price_copper: number;
  item_data: {
    name: string;
    description?: string;
    category?: string;
    rarity?: string;
  };
}

// Hook for master to manage transactions in a campaign
export function useCampaignTransactions(campaignId: string, shopId?: string) {
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ["shop-transactions", campaignId, shopId],
    queryFn: async () => {
      let query = supabase
        .from("shop_transactions")
        .select(`
          *,
          shop:campaign_shops(name),
          character:characters(name)
        `)
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ShopTransaction[];
    },
    enabled: !!campaignId,
  });

  const createTransaction = useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Não autenticado");

      const { data: result, error } = await supabase
        .from("shop_transactions")
        .insert({
          ...data,
          seller_user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-transactions", campaignId] });
      toast.success("Oferta enviada ao jogador!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao enviar oferta: " + error.message);
    },
  });

  const cancelTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from("shop_transactions")
        .update({ status: 'cancelled', responded_at: new Date().toISOString() })
        .eq("id", transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-transactions", campaignId] });
      toast.success("Oferta cancelada");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cancelar oferta: " + error.message);
    },
  });

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    createTransaction,
    cancelTransaction,
  };
}

// Hook for player to see pending offers on their character
export function useCharacterPendingOffers(characterId: string) {
  const queryClient = useQueryClient();

  const offersQuery = useQuery({
    queryKey: ["character-offers", characterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_transactions")
        .select(`
          *,
          shop:campaign_shops(name)
        `)
        .eq("buyer_character_id", characterId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ShopTransaction[];
    },
    enabled: !!characterId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!characterId) return;

    const channel = supabase
      .channel(`character-offers-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shop_transactions',
          filter: `buyer_character_id=eq.${characterId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["character-offers", characterId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, queryClient]);

  const respondToOffer = useMutation({
    mutationFn: async ({ transactionId, accept, characterCurrency, newCurrency }: {
      transactionId: string;
      accept: boolean;
      characterCurrency?: any;
      newCurrency?: any;
    }) => {
      if (accept && characterCurrency && newCurrency) {
        // Update character currency and add item to inventory
        const { data: transaction, error: fetchError } = await supabase
          .from("shop_transactions")
          .select("*, character:characters(*)")
          .eq("id", transactionId)
          .single();

        if (fetchError) throw fetchError;

        const character = (transaction as any).character;
        if (!character) throw new Error("Personagem não encontrado");

        // Add item to inventory
        const currentInventory = (character.inventory as any[]) || [];
        const itemData = transaction.item_data as { name?: string; description?: string; category?: string };
        const newItem = {
          id: crypto.randomUUID(),
          name: itemData.name || "Item",
          description: itemData.description || "",
          quantity: transaction.quantity,
          category: itemData.category || "Outros",
          isEquipped: false,
        };

        const { error: updateError } = await supabase
          .from("characters")
          .update({
            currency: newCurrency,
            inventory: [...currentInventory, newItem],
          })
          .eq("id", character.id);

        if (updateError) throw updateError;

        // Update shop item quantity if not unlimited
        const { data: shopItem, error: itemError } = await supabase
          .from("campaign_shop_items")
          .select("quantity")
          .eq("id", transaction.shop_item_id)
          .single();

        if (!itemError && shopItem && shopItem.quantity !== null) {
          const newQuantity = Math.max(0, shopItem.quantity - transaction.quantity);
          await supabase
            .from("campaign_shop_items")
            .update({ 
              quantity: newQuantity,
              is_available: newQuantity > 0,
            })
            .eq("id", transaction.shop_item_id);
        }
      }

      // Update transaction status
      const { error } = await supabase
        .from("shop_transactions")
        .update({ 
          status: accept ? 'accepted' : 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq("id", transactionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["character-offers", characterId] });
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      if (variables.accept) {
        toast.success("Item adquirido com sucesso!");
      } else {
        toast.info("Oferta recusada");
      }
    },
    onError: (error: Error) => {
      toast.error("Erro ao responder oferta: " + error.message);
    },
  });

  return {
    offers: offersQuery.data || [],
    isLoading: offersQuery.isLoading,
    respondToOffer,
    hasOffers: (offersQuery.data?.length || 0) > 0,
  };
}
