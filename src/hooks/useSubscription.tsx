import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export type SubscriptionTier = 'mestre';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: string;
  expiresAt: string | null;
  isLifetime: boolean;
  characterCount: number;
  canCreateCharacter: boolean;
  canCreateCampaign: boolean;
  canJoinCampaign: boolean;
  canCreateHomebrew: boolean;
  canUseQuickNotes: boolean;
  canUseForge: boolean;
  limits: {
    maxCharacters: number | 'unlimited';
    canBeMaster: boolean;
    hasCombatTracker: boolean;
    hasAdvancedTools: boolean;
    hasThemes: boolean;
    hasHistorico: boolean;
    hasDiscordIntegration: boolean;
    hasStressSanity: boolean;
  };
}

const MESTRE_LIMITS = {
  maxCharacters: 'unlimited' as const,
  canBeMaster: true,
  hasCombatTracker: true,
  hasAdvancedTools: true,
  hasThemes: true,
  hasHistorico: true,
  hasDiscordIntegration: true,
  hasStressSanity: true,
};

const FULL_ACCESS: SubscriptionInfo = {
  tier: 'mestre',
  status: 'mestre',
  expiresAt: null,
  isLifetime: true,
  characterCount: 0,
  canCreateCharacter: true,
  canCreateCampaign: true,
  canJoinCampaign: true,
  canCreateHomebrew: true,
  canUseQuickNotes: true,
  canUseForge: true,
  limits: MESTRE_LIMITS,
};

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionInfo> => {
      if (!user) {
        return { ...FULL_ACCESS, characterCount: 0 };
      }
      return { ...FULL_ACCESS };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hour - no need to refresh often
  });
}

// No-op sync hook (kept for compatibility)
export function useSubscriptionSync() {
  return { checkStripeSubscription: async () => null };
}

export function useCharacterCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['characterCount', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { supabase } = await import('@/integrations/supabase/client');
      const { count } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count ?? 0;
    },
    enabled: !!user,
  });
}
