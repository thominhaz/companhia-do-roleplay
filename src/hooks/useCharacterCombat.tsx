import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Combatant, CombatEncounter } from './useCombat';

interface CharacterCombatInfo {
  encounter: CombatEncounter;
  combatant: Combatant;
  allCombatants: Combatant[];
  campaignName: string;
  isMyTurn: boolean;
  turnPosition: number;
}

// Find active combat for a character
export function useCharacterActiveCombat(characterId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!characterId) return;

    // Listen to combatants changes for this character
    const channel = supabase
      .channel(`character-combat-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'combatants',
          filter: `character_id=eq.${characterId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['character-combat', characterId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'combat_encounters',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['character-combat', characterId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, queryClient]);

  return useQuery({
    queryKey: ['character-combat', characterId],
    queryFn: async (): Promise<CharacterCombatInfo | null> => {
      if (!characterId) return null;

      // Find combatant entry for this character in an active encounter
      const { data: combatantData, error: combatantError } = await supabase
        .from('combatants')
        .select(`
          *,
          combat_encounters!inner (
            *,
            campaigns!inner (
              name
            )
          )
        `)
        .eq('character_id', characterId)
        .eq('combat_encounters.is_active', true)
        .maybeSingle();

      if (combatantError) throw combatantError;
      if (!combatantData) return null;

      const encounter = combatantData.combat_encounters as unknown as CombatEncounter & { campaigns: { name: string } };
      
      // Fetch all combatants in this encounter
      const { data: allCombatants, error: allError } = await supabase
        .from('combatants')
        .select('*')
        .eq('encounter_id', encounter.id)
        .order('initiative', { ascending: false });

      if (allError) throw allError;

      // Calculate turn position
      const sortedCombatants = allCombatants || [];
      const currentTurnIndex = encounter.current_turn;
      const myIndex = sortedCombatants.findIndex(c => c.id === combatantData.id);
      const isMyTurn = myIndex === currentTurnIndex;
      
      // Calculate how many turns until my turn
      let turnPosition = 0;
      if (myIndex >= 0 && !isMyTurn) {
        if (myIndex > currentTurnIndex) {
          turnPosition = myIndex - currentTurnIndex;
        } else {
          turnPosition = sortedCombatants.length - currentTurnIndex + myIndex;
        }
      }

      return {
        encounter: encounter,
        combatant: combatantData as Combatant,
        allCombatants: sortedCombatants as Combatant[],
        campaignName: encounter.campaigns.name,
        isMyTurn,
        turnPosition,
      };
    },
    enabled: !!characterId,
    refetchInterval: 5000, // Poll every 5s as backup
  });
}
