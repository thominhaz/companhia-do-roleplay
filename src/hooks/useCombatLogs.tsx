import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export type ActionType = 
  | 'damage' 
  | 'heal' 
  | 'condition_add' 
  | 'condition_remove' 
  | 'turn_start' 
  | 'combat_start' 
  | 'combat_end';

export interface CombatLog {
  id: string;
  encounter_id: string;
  combatant_id: string | null;
  action_type: ActionType;
  value: number | null;
  details: string | null;
  combatant_name: string | null;
  created_at: string;
}

// Fetch combat logs for an encounter with realtime updates
export function useCombatLogs(encounterId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!encounterId) return;

    const channel = supabase
      .channel(`combat-logs-${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'combat_logs',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['combat-logs', encounterId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId, queryClient]);

  return useQuery({
    queryKey: ['combat-logs', encounterId],
    queryFn: async () => {
      if (!encounterId) return [];

      const { data, error } = await supabase
        .from('combat_logs')
        .select('*')
        .eq('encounter_id', encounterId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CombatLog[];
    },
    enabled: !!encounterId,
  });
}

// Add a combat log entry
export function useAddCombatLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: Omit<CombatLog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('combat_logs')
        .insert(log)
        .select()
        .single();

      if (error) throw error;
      return data as CombatLog;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['combat-logs', data.encounter_id] });
    },
  });
}
