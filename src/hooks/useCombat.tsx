import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface CombatEncounter {
  id: string;
  campaign_id: string;
  name: string;
  round: number;
  current_turn: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Combatant {
  id: string;
  encounter_id: string;
  name: string;
  initiative: number;
  current_hp: number;
  max_hp: number;
  armor_class: number;
  conditions: string[];
  is_player: boolean;
  character_id: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

// Fetch active encounter for a campaign with realtime updates
export function useActiveEncounter(campaignId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`encounter-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'combat_encounters',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['combat-encounter', campaignId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, queryClient]);

  return useQuery({
    queryKey: ['combat-encounter', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;

      const { data, error } = await supabase
        .from('combat_encounters')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CombatEncounter | null;
    },
    enabled: !!campaignId,
  });
}

// Fetch combatants for an encounter with realtime updates
export function useCombatants(encounterId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!encounterId) return;

    const channel = supabase
      .channel(`combatants-${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'combatants',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['combatants', encounterId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId, queryClient]);

  return useQuery({
    queryKey: ['combatants', encounterId],
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

// Create a new combat encounter
export function useCreateEncounter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, name }: { campaignId: string; name: string }) => {
      // End any active encounters first
      await supabase
        .from('combat_encounters')
        .update({ is_active: false, status: 'finished' })
        .eq('campaign_id', campaignId)
        .eq('is_active', true);

      const { data, error } = await supabase
        .from('combat_encounters')
        .insert({
          campaign_id: campaignId,
          name,
          round: 1,
          current_turn: 0,
          is_active: true,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data as CombatEncounter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['combat-encounter', data.campaign_id] });
      toast.success('Combate iniciado!');
    },
    onError: () => {
      toast.error('Erro ao iniciar combate');
    },
  });
}

// End an encounter
export function useEndEncounter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (encounterId: string) => {
      const { data, error } = await supabase
        .from('combat_encounters')
        .update({ is_active: false, status: 'finished' })
        .eq('id', encounterId)
        .select()
        .single();

      if (error) throw error;
      return data as CombatEncounter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['combat-encounter', data.campaign_id] });
      toast.success('Combate encerrado');
    },
    onError: () => {
      toast.error('Erro ao encerrar combate');
    },
  });
}

// Update encounter (round, turn)
export function useUpdateEncounter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CombatEncounter> & { id: string }) => {
      const { data, error } = await supabase
        .from('combat_encounters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CombatEncounter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['combat-encounter', data.campaign_id] });
    },
  });
}

// Add a combatant
export function useAddCombatant() {
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
      queryClient.invalidateQueries({ queryKey: ['combatants', data.encounter_id] });
    },
    onError: () => {
      toast.error('Erro ao adicionar combatente');
    },
  });
}

// Update a combatant and optionally sync with character sheet
export function useUpdateCombatant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, encounterId, syncToCharacter, ...updates }: Partial<Combatant> & { id: string; encounterId: string; syncToCharacter?: boolean }) => {
      const { data, error } = await supabase
        .from('combatants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If this combatant is linked to a character and sync is requested, update character too
      if (syncToCharacter && data.character_id) {
        const characterUpdates: Record<string, any> = {};
        
        if (updates.current_hp !== undefined) {
          characterUpdates.current_hp = updates.current_hp;
        }
        if (updates.armor_class !== undefined) {
          characterUpdates.armor_class = updates.armor_class;
        }
        if (updates.conditions !== undefined) {
          characterUpdates.conditions = updates.conditions;
        }

        if (Object.keys(characterUpdates).length > 0) {
          await supabase
            .from('characters')
            .update(characterUpdates)
            .eq('id', data.character_id);
          
          // Invalidate character queries
          queryClient.invalidateQueries({ queryKey: ['character', data.character_id] });
          queryClient.invalidateQueries({ queryKey: ['characters'] });
        }
      }

      return { data, encounterId };
    },
    onSuccess: ({ encounterId }) => {
      queryClient.invalidateQueries({ queryKey: ['combatants', encounterId] });
    },
  });
}

// Update combatant with automatic sync to character (convenience hook)
export function useUpdateCombatantWithSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, encounterId, characterId, ...updates }: Partial<Combatant> & { id: string; encounterId: string; characterId?: string | null }) => {
      // Update combatant
      const { data, error } = await supabase
        .from('combatants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Sync to character if linked
      const charId = characterId ?? data.character_id;
      if (charId) {
        const characterUpdates: Record<string, any> = {};
        
        if (updates.current_hp !== undefined) {
          characterUpdates.current_hp = updates.current_hp;
        }
        if (updates.armor_class !== undefined) {
          characterUpdates.armor_class = updates.armor_class;
        }
        if (updates.conditions !== undefined) {
          characterUpdates.conditions = updates.conditions;
        }

        if (Object.keys(characterUpdates).length > 0) {
          await supabase
            .from('characters')
            .update(characterUpdates)
            .eq('id', charId);
          
          queryClient.invalidateQueries({ queryKey: ['character', charId] });
          queryClient.invalidateQueries({ queryKey: ['characters'] });
        }
      }

      return { data, encounterId };
    },
    onSuccess: ({ encounterId }) => {
      queryClient.invalidateQueries({ queryKey: ['combatants', encounterId] });
    },
  });
}

// Remove a combatant
export function useRemoveCombatant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, encounterId }: { id: string; encounterId: string }) => {
      const { error } = await supabase
        .from('combatants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return encounterId;
    },
    onSuccess: (encounterId) => {
      queryClient.invalidateQueries({ queryKey: ['combatants', encounterId] });
    },
  });
}
