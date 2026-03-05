import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Combatant, CombatEncounter } from './useCombat';

export interface PreparedEncounter {
  id: string;
  campaign_id: string;
  name: string;
  status: string;
  pre_selected_player_ids: string[];
  created_at: string;
  updated_at: string;
  round: number;
  current_turn: number;
  is_active: boolean;
}

// Fetch draft encounters for a campaign
export function usePreparedEncounters(campaignId: string) {
  return useQuery({
    queryKey: ['prepared-encounters', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('combat_encounters')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PreparedEncounter[];
    },
    enabled: !!campaignId,
  });
}

// Fetch combatants for a draft encounter
export function useDraftCombatants(encounterId: string) {
  return useQuery({
    queryKey: ['draft-combatants', encounterId],
    queryFn: async () => {
      if (!encounterId) return [];
      const { data, error } = await supabase
        .from('combatants')
        .select('*')
        .eq('encounter_id', encounterId)
        .order('initiative', { ascending: false });
      if (error) throw error;
      return data as Combatant[];
    },
    enabled: !!encounterId,
  });
}

// Create a draft encounter
export function useCreateDraftEncounter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, name, preSelectedPlayerIds }: { campaignId: string; name: string; preSelectedPlayerIds?: string[] }) => {
      const { data, error } = await supabase
        .from('combat_encounters')
        .insert({
          campaign_id: campaignId,
          name,
          round: 1,
          current_turn: 0,
          is_active: false,
          status: 'draft',
          pre_selected_player_ids: preSelectedPlayerIds || [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as PreparedEncounter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prepared-encounters', data.campaign_id] });
      toast.success('Encontro preparado criado!');
    },
    onError: () => toast.error('Erro ao criar encontro'),
  });
}

// Update a draft encounter
export function useUpdateDraftEncounter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId, ...updates }: { id: string; campaignId: string; name?: string; pre_selected_player_ids?: string[] }) => {
      const { error } = await supabase
        .from('combat_encounters')
        .update(updates)
        .eq('id', id)
        .eq('status', 'draft');
      if (error) throw error;
      return { id, campaignId };
    },
    onSuccess: ({ campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['prepared-encounters', campaignId] });
    },
  });
}

// Delete a draft encounter
export function useDeleteDraftEncounter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
      // Delete combatants first
      await supabase.from('combatants').delete().eq('encounter_id', id);
      const { error } = await supabase
        .from('combat_encounters')
        .delete()
        .eq('id', id)
        .eq('status', 'draft');
      if (error) throw error;
      return campaignId;
    },
    onSuccess: (campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['prepared-encounters', campaignId] });
      toast.success('Encontro removido');
    },
    onError: () => toast.error('Erro ao remover encontro'),
  });
}

// Start a prepared encounter (draft → active)
export function useStartPreparedEncounter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ encounterId, campaignId }: { encounterId: string; campaignId: string }) => {
      // End any active encounters first
      await supabase
        .from('combat_encounters')
        .update({ is_active: false, status: 'finished' })
        .eq('campaign_id', campaignId)
        .eq('is_active', true);

      // Activate the draft encounter
      const { data, error } = await supabase
        .from('combat_encounters')
        .update({ is_active: true, status: 'active', round: 1, current_turn: 0 })
        .eq('id', encounterId)
        .select()
        .single();
      if (error) throw error;
      return data as CombatEncounter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prepared-encounters', data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['combat-encounter', data.campaign_id] });
      toast.success('Combate iniciado!');
    },
    onError: () => toast.error('Erro ao iniciar combate'),
  });
}

// Add combatant to a draft encounter
export function useAddDraftCombatant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (combatant: Omit<Combatant, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('combatants')
        .insert(combatant)
        .select()
        .single();
      if (error) throw error;
      return data as Combatant;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['draft-combatants', data.encounter_id] });
    },
    onError: () => toast.error('Erro ao adicionar combatente'),
  });
}

// Remove combatant from draft
export function useRemoveDraftCombatant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, encounterId }: { id: string; encounterId: string }) => {
      const { error } = await supabase.from('combatants').delete().eq('id', id);
      if (error) throw error;
      return encounterId;
    },
    onSuccess: (encounterId) => {
      queryClient.invalidateQueries({ queryKey: ['draft-combatants', encounterId] });
    },
  });
}
