import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TokenPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  isPlayer: boolean;
  characterId?: string;
  combatantId?: string;
}

export interface BattleMap {
  id: string;
  campaign_id: string;
  name: string;
  grid_width: number;
  grid_height: number;
  cell_size: number;
  image_url: string | null;
  token_positions: TokenPosition[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBattleMaps(campaignId: string) {
  return useQuery({
    queryKey: ['battle-maps', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('battle_maps')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(m => ({
        ...m,
        token_positions: (m.token_positions as any) || [],
      })) as BattleMap[];
    },
    enabled: !!campaignId,
  });
}

export function useActiveBattleMap(campaignId: string) {
  return useQuery({
    queryKey: ['battle-maps', campaignId, 'active'],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data, error } = await supabase
        .from('battle_maps')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        token_positions: (data.token_positions as any) || [],
      } as BattleMap;
    },
    enabled: !!campaignId,
  });
}

export function useCreateBattleMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (map: {
      campaign_id: string;
      name: string;
      grid_width: number;
      grid_height: number;
      image_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('battle_maps')
        .insert(map)
        .select()
        .single();
      if (error) throw error;
      return { ...data, token_positions: (data.token_positions as any) || [] } as BattleMap;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['battle-maps', data.campaign_id] });
      toast.success('Mapa criado!');
    },
    onError: () => toast.error('Erro ao criar mapa'),
  });
}

export function useUpdateBattleMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      campaignId: string;
      name?: string;
      grid_width?: number;
      grid_height?: number;
      image_url?: string | null;
      token_positions?: TokenPosition[];
      is_active?: boolean;
    }) => {
      const { id, campaignId, ...updates } = params;
      const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) updatePayload.name = updates.name;
      if (updates.grid_width !== undefined) updatePayload.grid_width = updates.grid_width;
      if (updates.grid_height !== undefined) updatePayload.grid_height = updates.grid_height;
      if (updates.image_url !== undefined) updatePayload.image_url = updates.image_url;
      if (updates.token_positions !== undefined) updatePayload.token_positions = updates.token_positions as any;
      if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active;

      const { data, error } = await supabase
        .from('battle_maps')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data, campaignId };
    },
    onSuccess: ({ campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['battle-maps', campaignId] });
    },
    onError: () => toast.error('Erro ao atualizar mapa'),
  });
}

export function useDeleteBattleMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
      const { error } = await supabase
        .from('battle_maps')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return campaignId;
    },
    onSuccess: (campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['battle-maps', campaignId] });
      toast.success('Mapa removido');
    },
    onError: () => toast.error('Erro ao remover mapa'),
  });
}

export function useActivateBattleMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, campaignId, currentlyActive }: { id: string; campaignId: string; currentlyActive?: boolean }) => {
      if (currentlyActive) {
        // Just deactivate this map
        const { error } = await supabase
          .from('battle_maps')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      } else {
        // Deactivate all maps first
        await supabase
          .from('battle_maps')
          .update({ is_active: false })
          .eq('campaign_id', campaignId);
        // Activate selected
        const { error } = await supabase
          .from('battle_maps')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      }
      return { campaignId, activated: !currentlyActive };
    },
    onSuccess: ({ campaignId, activated }) => {
      queryClient.invalidateQueries({ queryKey: ['battle-maps', campaignId] });
      toast.success(activated ? 'Mapa ativado para jogadores!' : 'Mapa desativado');
    },
    onError: () => toast.error('Erro ao alterar mapa'),
  });
}
