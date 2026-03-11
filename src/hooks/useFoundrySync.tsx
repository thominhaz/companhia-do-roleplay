import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CampaignDB } from './useCampaigns';

/**
 * Hook to push combat state changes to Foundry VTT.
 * Uses the campaign's foundry_vtt_url as the base and sends updates
 * via the Go20 foundry-sync edge function for reverse sync.
 */
export function useFoundryPush(campaign: CampaignDB | null | undefined) {
  const pushCombatUpdate = useCallback(
    async (action: string, payload: Record<string, unknown>) => {
      if (!campaign?.foundry_vtt_url) return; // No Foundry configured

      // Get the campaign's API key to identify ourselves
      // We call our own edge function which then could relay to Foundry
      // For now, the Foundry module polls our edge function, so push is optional
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const foundryUrl = campaign.foundry_vtt_url;

        // If Foundry has a webhook/API endpoint, POST directly
        // This is a best-effort push; Foundry module also polls
        if (foundryUrl && foundryUrl.includes('/api/')) {
          await fetch(foundryUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: 'go20', action, ...payload }),
          }).catch(() => {
            // Silently fail - Foundry polling is the backup
          });
        }
      } catch {
        // Non-critical: Foundry module will poll for updates
      }
    },
    [campaign]
  );

  return { pushCombatUpdate };
}
