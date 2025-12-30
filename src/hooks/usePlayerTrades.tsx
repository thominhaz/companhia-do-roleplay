import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { 
  FullCurrency, 
  currencyToCopper, 
  copperToCurrency, 
  hasEnoughCurrency, 
  subtractCurrency, 
  addCurrency,
  normalizeCurrency
} from "@/lib/currencyUtils";
import { isValidUUID } from "@/lib/postgrestUtils";

export interface ItemData {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  rarity?: string;
  quantity?: number;
}

// Re-export FullCurrency as CurrencyData for backward compatibility
export type CurrencyData = FullCurrency;

export interface TradeOffer {
  type: 'item' | 'currency' | 'gift';
  item?: ItemData;
  currency?: CurrencyData;
}

export interface PlayerTrade {
  id: string;
  campaign_id: string;
  trade_type: 'master_gift' | 'player_trade' | 'player_gift';
  initiator_user_id: string;
  initiator_character_id: string | null;
  initiator_item_data: ItemData & { offer_type?: string; currency?: CurrencyData };
  initiator_confirmed: boolean;
  receiver_user_id: string;
  receiver_character_id: string;
  receiver_item_data: (ItemData & { offer_type?: string; currency?: CurrencyData }) | null;
  receiver_confirmed: boolean;
  status: 'pending_receiver' | 'pending_confirmations' | 'completed' | 'cancelled' | 'rejected';
  created_at: string;
  updated_at: string;
  // Joined data
  initiator_character?: { name: string } | null;
  receiver_character?: { name: string } | null;
}

// Hook for masters to manage gifts and view trades
export function useCampaignTrades(campaignId: string) {
  const queryClient = useQueryClient();

  const tradesQuery = useQuery({
    queryKey: ["player-trades", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_trades")
        .select(`
          *,
          initiator_character:characters!player_trades_initiator_character_id_fkey(name),
          receiver_character:characters!player_trades_receiver_character_id_fkey(name)
        `)
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as PlayerTrade[];
    },
    enabled: !!campaignId,
  });

  // Master gift - directly give item to player
  const createMasterGift = useMutation({
    mutationFn: async (data: {
      receiver_user_id: string;
      receiver_character_id: string;
      item_data: ItemData;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Não autenticado");

      const insertData = {
        campaign_id: campaignId,
        trade_type: 'master_gift' as const,
        initiator_user_id: user.user.id,
        initiator_character_id: null,
        initiator_item_data: data.item_data as unknown as Record<string, unknown>,
        initiator_confirmed: true,
        receiver_user_id: data.receiver_user_id,
        receiver_character_id: data.receiver_character_id,
        receiver_item_data: null,
        receiver_confirmed: false,
        status: 'pending_receiver' as const,
      };

      const { data: result, error } = await supabase
        .from("player_trades")
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-trades", campaignId] });
      toast.success("Item enviado ao jogador!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao enviar item: " + error.message);
    },
  });

  return {
    trades: tradesQuery.data || [],
    isLoading: tradesQuery.isLoading,
    createMasterGift,
  };
}

// Hook for players to manage their trades
export function useCharacterTrades(characterId: string) {
  const queryClient = useQueryClient();

  // Fetch pending trades for this character
  const tradesQuery = useQuery({
    queryKey: ["character-trades", characterId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      // Validate characterId is a valid UUID to prevent injection
      if (!isValidUUID(characterId)) {
        console.error('Invalid character ID format');
        return [];
      }

      const { data, error } = await supabase
        .from("player_trades")
        .select(`
          *,
          initiator_character:characters!player_trades_initiator_character_id_fkey(name),
          receiver_character:characters!player_trades_receiver_character_id_fkey(name)
        `)
        .or(`receiver_character_id.eq.${characterId},initiator_character_id.eq.${characterId}`)
        .in("status", ["pending_receiver", "pending_confirmations"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as PlayerTrade[];
    },
    enabled: !!characterId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!characterId) return;

    const channel = supabase
      .channel(`character-trades-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_trades',
        },
        (payload) => {
          const trade = payload.new as PlayerTrade;
          if (trade?.receiver_character_id === characterId || trade?.initiator_character_id === characterId) {
            queryClient.invalidateQueries({ queryKey: ["character-trades", characterId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, queryClient]);

  // Initiate a trade with another player (item for item, item for currency, or gift)
  const initiateTrade = useMutation({
    mutationFn: async (data: {
      campaign_id: string;
      receiver_user_id: string;
      receiver_character_id: string;
      item_data: ItemData;
      offer_type: 'item' | 'currency' | 'gift';
      requested_currency?: CurrencyData;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Não autenticado");

      const isGift = data.offer_type === 'gift';
      const wantsCurrency = data.offer_type === 'currency';

      const initiatorItemData = {
        ...data.item_data,
        offer_type: data.offer_type,
        requested_currency: wantsCurrency ? data.requested_currency : undefined,
      };

      const insertData = {
        campaign_id: data.campaign_id,
        trade_type: isGift ? 'player_gift' : 'player_trade',
        initiator_user_id: user.user.id,
        initiator_character_id: characterId,
        initiator_item_data: initiatorItemData as unknown as Record<string, unknown>,
        initiator_confirmed: isGift, // Gifts are auto-confirmed by initiator
        receiver_user_id: data.receiver_user_id,
        receiver_character_id: data.receiver_character_id,
        receiver_item_data: null,
        receiver_confirmed: false,
        status: 'pending_receiver' as const,
      };

      const { data: result, error } = await supabase
        .from("player_trades")
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["character-trades", characterId] });
      if (variables.offer_type === 'gift') {
        toast.success("Item enviado como presente!");
      } else {
        toast.success("Proposta de troca enviada!");
      }
    },
    onError: (error: Error) => {
      toast.error("Erro ao propor troca: " + error.message);
    },
  });

  // Receiver selects their item for trade
  const selectReceiverItem = useMutation({
    mutationFn: async (data: { tradeId: string; item_data: ItemData }) => {
      const { error } = await supabase
        .from("player_trades")
        .update({
          receiver_item_data: { ...data.item_data, offer_type: 'item' } as any,
          status: 'pending_confirmations',
        })
        .eq("id", data.tradeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character-trades", characterId] });
      toast.success("Item selecionado! Aguardando confirmações.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao selecionar item: " + error.message);
    },
  });

  // Receiver offers currency instead of item
  const selectReceiverCurrency = useMutation({
    mutationFn: async (data: { tradeId: string; currency: CurrencyData }) => {
      const { error } = await supabase
        .from("player_trades")
        .update({
          receiver_item_data: { 
            name: 'Moedas',
            offer_type: 'currency',
            currency: data.currency 
          } as any,
          status: 'pending_confirmations',
        })
        .eq("id", data.tradeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character-trades", characterId] });
      toast.success("Pagamento oferecido! Aguardando confirmações.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao oferecer pagamento: " + error.message);
    },
  });

  // Confirm trade (both parties must confirm)
  const confirmTrade = useMutation({
    mutationFn: async (data: { tradeId: string; isInitiator: boolean }) => {
      const updateField = data.isInitiator ? 'initiator_confirmed' : 'receiver_confirmed';
      
      // First update confirmation
      const { error: updateError } = await supabase
        .from("player_trades")
        .update({ [updateField]: true })
        .eq("id", data.tradeId);

      if (updateError) throw updateError;

      // Check if both confirmed
      const { data: trade, error: fetchError } = await supabase
        .from("player_trades")
        .select("*, initiator_character:characters!player_trades_initiator_character_id_fkey(*), receiver_character:characters!player_trades_receiver_character_id_fkey(*)")
        .eq("id", data.tradeId)
        .single();

      if (fetchError) throw fetchError;

      // If both confirmed, execute the trade
      if (trade.initiator_confirmed && trade.receiver_confirmed) {
        await executeTrade(trade);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character-trades", characterId] });
      queryClient.invalidateQueries({ queryKey: ["character"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao confirmar: " + error.message);
    },
  });

  // Accept master gift or player gift
  const acceptMasterGift = useMutation({
    mutationFn: async (tradeId: string) => {
      // Fetch the trade with both characters
      const { data: trade, error: fetchError } = await supabase
        .from("player_trades")
        .select(`
          *,
          receiver_character:characters!player_trades_receiver_character_id_fkey(*),
          initiator_character:characters!player_trades_initiator_character_id_fkey(*)
        `)
        .eq("id", tradeId)
        .single();

      if (fetchError) throw fetchError;

      const receiverCharacter = (trade as any).receiver_character;
      if (!receiverCharacter) throw new Error("Personagem receptor não encontrado");

      const itemData = trade.initiator_item_data as unknown as ItemData;
      
      // Add item to receiver's inventory
      const currentInventory = (receiverCharacter.inventory as any[]) || [];
      const newItem = {
        id: crypto.randomUUID(),
        name: itemData.name,
        description: itemData.description || "",
        quantity: itemData.quantity || 1,
        category: itemData.category || "Outros",
        rarity: itemData.rarity || "comum",
        isEquipped: false,
      };

      const { error: charError } = await supabase
        .from("characters")
        .update({ inventory: [...currentInventory, newItem] })
        .eq("id", trade.receiver_character_id);

      if (charError) throw charError;

      // If it's a player gift, also remove from initiator's inventory or equipment
      if (trade.trade_type === 'player_gift' && trade.initiator_character_id) {
        const initiatorCharacter = (trade as any).initiator_character;
        
        if (initiatorCharacter) {
          const initiatorInventory = (initiatorCharacter.inventory as any[]) || [];
          const initiatorEquipment = (initiatorCharacter.equipment as any[]) || [];
          
          // Find the item by id first in inventory
          let itemToRemove = initiatorInventory.find(item => item.id === itemData.id);
          let itemSource: 'inventory' | 'equipment' = 'inventory';
          
          if (!itemToRemove) {
            // Try equipment
            itemToRemove = initiatorEquipment.find(item => item.id === itemData.id);
            if (itemToRemove) {
              itemSource = 'equipment';
            }
          }
          
          if (!itemToRemove) {
            // Fallback: find by name in inventory
            itemToRemove = initiatorInventory.find(item => 
              item.name === itemData.name && 
              (itemData.rarity ? item.rarity === itemData.rarity : true)
            );
            if (!itemToRemove) {
              // Fallback: find by name in equipment
              itemToRemove = initiatorEquipment.find(item => 
                item.name === itemData.name && 
                (itemData.rarity ? item.rarity === itemData.rarity : true)
              );
              if (itemToRemove) {
                itemSource = 'equipment';
              }
            }
          }
          
          if (itemToRemove) {
            // Check if item is equipped - should have been caught earlier, but double-check
            if (itemToRemove.isEquipped) {
              throw new Error("Não é possível dar um item equipado como presente. Desequipe-o primeiro.");
            }
            
            if (itemSource === 'inventory') {
              const newInitiatorInventory = initiatorInventory.filter(
                item => item.id !== itemToRemove.id
              );
              
              const { error: initiatorError } = await supabase
                .from("characters")
                .update({ inventory: newInitiatorInventory })
                .eq("id", trade.initiator_character_id);

              if (initiatorError) throw initiatorError;
            } else {
              const newInitiatorEquipment = initiatorEquipment.filter(
                item => item.id !== itemToRemove.id
              );
              
              const { error: initiatorError } = await supabase
                .from("characters")
                .update({ equipment: newInitiatorEquipment })
                .eq("id", trade.initiator_character_id);

              if (initiatorError) throw initiatorError;
            }
          }
        }
      }

      // Mark trade as completed
      const { error: tradeError } = await supabase
        .from("player_trades")
        .update({ status: 'completed', receiver_confirmed: true })
        .eq("id", tradeId);

      if (tradeError) throw tradeError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character-trades", characterId] });
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      queryClient.invalidateQueries({ queryKey: ["character"] });
      toast.success("Item recebido!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao aceitar: " + error.message);
    },
  });

  // Reject trade or gift
  const rejectTrade = useMutation({
    mutationFn: async (tradeId: string) => {
      const { error } = await supabase
        .from("player_trades")
        .update({ status: 'rejected' })
        .eq("id", tradeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character-trades", characterId] });
      toast.info("Troca recusada");
    },
    onError: (error: Error) => {
      toast.error("Erro ao recusar: " + error.message);
    },
  });

  // Cancel trade (initiator only)
  const cancelTrade = useMutation({
    mutationFn: async (tradeId: string) => {
      const { error } = await supabase
        .from("player_trades")
        .update({ status: 'cancelled' })
        .eq("id", tradeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character-trades", characterId] });
      toast.info("Troca cancelada");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cancelar: " + error.message);
    },
  });

  // Get pending trades where this character needs to act
  const pendingTrades = (tradesQuery.data || []).filter(t => {
    // Master gift or player gift waiting for acceptance
    if ((t.trade_type === 'master_gift' || t.trade_type === 'player_gift') && 
        t.receiver_character_id === characterId && 
        t.status === 'pending_receiver') {
      return true;
    }
    if (t.trade_type === 'player_trade') {
      if (t.receiver_character_id === characterId && t.status === 'pending_receiver') {
        return true; // Need to select item or currency
      }
      if (t.status === 'pending_confirmations') {
        const isInitiator = t.initiator_character_id === characterId;
        const needsConfirm = isInitiator ? !t.initiator_confirmed : !t.receiver_confirmed;
        return needsConfirm;
      }
    }
    return false;
  });

  return {
    trades: tradesQuery.data || [],
    pendingTrades,
    hasPendingTrades: pendingTrades.length > 0,
    isLoading: tradesQuery.isLoading,
    initiateTrade,
    selectReceiverItem,
    selectReceiverCurrency,
    confirmTrade,
    acceptMasterGift,
    rejectTrade,
    cancelTrade,
  };
}

// Helper function to execute a completed trade
async function executeTrade(trade: any) {
  const initiatorChar = trade.initiator_character;
  const receiverChar = trade.receiver_character;
  
  if (!initiatorChar || !receiverChar) throw new Error("Personagens não encontrados");

  const initiatorInventory = (initiatorChar.inventory as any[]) || [];
  const receiverInventory = (receiverChar.inventory as any[]) || [];
  const initiatorCurrency = normalizeCurrency(initiatorChar.currency as any);
  const receiverCurrency = normalizeCurrency(receiverChar.currency as any);

  const initiatorItemData = trade.initiator_item_data as ItemData & { offer_type?: string; currency?: CurrencyData; source?: string };
  const receiverItemData = trade.receiver_item_data as (ItemData & { offer_type?: string; currency?: CurrencyData; source?: string }) | null;
  
  const initiatorEquipment = (initiatorChar.equipment as any[]) || [];
  const receiverEquipment = (receiverChar.equipment as any[]) || [];

  // Validate initiator's item still exists - check both inventory and equipment
  let initiatorItemToRemove = initiatorInventory.find(item => item.id === initiatorItemData.id);
  let initiatorItemSource: 'inventory' | 'equipment' = 'inventory';
  
  if (!initiatorItemToRemove) {
    // Try equipment
    initiatorItemToRemove = initiatorEquipment.find(item => item.id === initiatorItemData.id);
    if (initiatorItemToRemove) {
      initiatorItemSource = 'equipment';
    }
  }
  if (!initiatorItemToRemove) {
    // Try fallback by name in inventory
    initiatorItemToRemove = initiatorInventory.find(item => 
      item.name === initiatorItemData.name && 
      (initiatorItemData.rarity ? item.rarity === initiatorItemData.rarity : true)
    );
    if (!initiatorItemToRemove) {
      // Try fallback in equipment
      initiatorItemToRemove = initiatorEquipment.find(item => 
        item.name === initiatorItemData.name && 
        (initiatorItemData.rarity ? item.rarity === initiatorItemData.rarity : true)
      );
      if (initiatorItemToRemove) {
        initiatorItemSource = 'equipment';
      }
    }
  }
  if (!initiatorItemToRemove) {
    throw new Error("O item oferecido não está mais no inventário do vendedor");
  }
  // Check if item is equipped - block trade if so
  if (initiatorItemToRemove.isEquipped) {
    throw new Error("Não é possível trocar um item equipado. Desequipe-o primeiro.");
  }

  // Validate receiver's offer
  let receiverItemToRemove: any = null;
  let receiverItemSource: 'inventory' | 'equipment' = 'inventory';
  
  if (receiverItemData) {
    if (receiverItemData.offer_type === 'currency' && receiverItemData.currency) {
      // Validate receiver has enough currency using automatic conversion
      const requiredCurrency = normalizeCurrency(receiverItemData.currency);
      if (!hasEnoughCurrency(receiverCurrency, requiredCurrency)) {
        const walletTotal = currencyToCopper(receiverCurrency);
        const requiredTotal = currencyToCopper(requiredCurrency);
        throw new Error(`Moedas insuficientes: você tem ${(walletTotal / 100).toFixed(2)} PO equivalente, precisa de ${(requiredTotal / 100).toFixed(2)} PO equivalente`);
      }
    } else if (receiverItemData.offer_type === 'item' || !receiverItemData.offer_type) {
      // Validate receiver's item still exists - check both inventory and equipment
      receiverItemToRemove = receiverInventory.find(item => item.id === receiverItemData.id);
      receiverItemSource = 'inventory';
      
      if (!receiverItemToRemove) {
        // Try equipment
        receiverItemToRemove = receiverEquipment.find(item => item.id === receiverItemData.id);
        if (receiverItemToRemove) {
          receiverItemSource = 'equipment';
        }
      }
      if (!receiverItemToRemove) {
        receiverItemToRemove = receiverInventory.find(item => 
          item.name === receiverItemData.name && 
          (receiverItemData.rarity ? item.rarity === receiverItemData.rarity : true)
        );
        if (!receiverItemToRemove) {
          receiverItemToRemove = receiverEquipment.find(item => 
            item.name === receiverItemData.name && 
            (receiverItemData.rarity ? item.rarity === receiverItemData.rarity : true)
          );
          if (receiverItemToRemove) {
            receiverItemSource = 'equipment';
          }
        }
      }
      if (!receiverItemToRemove) {
        throw new Error("O item oferecido pelo comprador não está mais no inventário");
      }
      // Check if receiver's item is equipped
      if (receiverItemToRemove.isEquipped) {
        throw new Error("O item oferecido pelo comprador está equipado. Deve ser desequipado primeiro.");
      }
    }
  }

  let newInitiatorInventory = [...initiatorInventory];
  let newInitiatorEquipment = [...initiatorEquipment];
  let newReceiverInventory = [...receiverInventory];
  let newReceiverEquipment = [...receiverEquipment];
  let newInitiatorCurrency = { ...initiatorCurrency };
  let newReceiverCurrency = { ...receiverCurrency };

  // Remove initiator's item from the correct source
  if (initiatorItemSource === 'inventory') {
    newInitiatorInventory = newInitiatorInventory.filter(
      item => item.id !== initiatorItemToRemove.id
    );
  } else {
    newInitiatorEquipment = newInitiatorEquipment.filter(
      item => item.id !== initiatorItemToRemove.id
    );
  }

  // Add initiator's item to receiver
  newReceiverInventory.push({
    id: crypto.randomUUID(),
    name: initiatorItemData.name,
    description: initiatorItemData.description || "",
    quantity: initiatorItemData.quantity || 1,
    category: initiatorItemData.category || "Outros",
    rarity: initiatorItemData.rarity || "comum",
    isEquipped: false,
  });

  // Handle receiver's offer
  if (receiverItemData) {
    if (receiverItemData.offer_type === 'currency' && receiverItemData.currency) {
      // Receiver is paying with currency - use automatic conversion
      const paymentCurrency = normalizeCurrency(receiverItemData.currency);
      
      // Subtract from receiver using automatic conversion
      const receiverAfterPayment = subtractCurrency(newReceiverCurrency, paymentCurrency);
      if (!receiverAfterPayment) {
        throw new Error("Erro ao processar pagamento: moedas insuficientes");
      }
      newReceiverCurrency = receiverAfterPayment;
      
      // Add to initiator
      newInitiatorCurrency = addCurrency(newInitiatorCurrency, paymentCurrency);
    } else if (receiverItemData.offer_type === 'item' || !receiverItemData.offer_type) {
      // Receiver is trading an item - remove from the correct source
      if (receiverItemSource === 'inventory') {
        newReceiverInventory = newReceiverInventory.filter(
          item => item.id !== receiverItemToRemove!.id
        );
      } else {
        newReceiverEquipment = newReceiverEquipment.filter(
          item => item.id !== receiverItemToRemove!.id
        );
      }

      newInitiatorInventory.push({
        id: crypto.randomUUID(),
        name: receiverItemData.name,
        description: receiverItemData.description || "",
        quantity: receiverItemData.quantity || 1,
        category: receiverItemData.category || "Outros",
        rarity: receiverItemData.rarity || "comum",
        isEquipped: false,
      });
    }
  }

  // Update initiator character
  const { error: initError } = await supabase
    .from("characters")
    .update({ 
      inventory: newInitiatorInventory,
      equipment: newInitiatorEquipment,
      currency: newInitiatorCurrency,
    })
    .eq("id", trade.initiator_character_id);

  if (initError) throw initError;

  // Update receiver character
  const { error: recvError } = await supabase
    .from("characters")
    .update({ 
      inventory: newReceiverInventory,
      equipment: newReceiverEquipment,
      currency: newReceiverCurrency,
    })
    .eq("id", trade.receiver_character_id);

  if (recvError) throw recvError;

  // Mark trade as completed
  const { error: tradeError } = await supabase
    .from("player_trades")
    .update({ status: 'completed' })
    .eq("id", trade.id);

  if (tradeError) throw tradeError;

  toast.success("Troca realizada com sucesso!");
}
