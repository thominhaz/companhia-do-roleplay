import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SubscriptionTier = 'aldeao' | 'heroi' | 'mestre';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: string;
  expiresAt: string | null;
  characterCount: number;
  canCreateCharacter: boolean;
  canCreateCampaign: boolean;
  canCreateHomebrew: boolean;
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

const ALDEAO_LIMITS = {
  maxCharacters: 3 as const,
  canBeMaster: false,
  hasCombatTracker: false,
  hasAdvancedTools: false,
  hasThemes: false,
  hasHistorico: false,
  hasDiscordIntegration: false,
  hasStressSanity: false,
};

const HEROI_LIMITS = {
  maxCharacters: 20 as const,
  canBeMaster: false,
  hasCombatTracker: false,
  hasAdvancedTools: true,
  hasThemes: true,
  hasHistorico: true,
  hasDiscordIntegration: false,
  hasStressSanity: false,
};

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

function getTierFromStatus(status: string | null, expiresAt: string | null): SubscriptionTier {
  if (!status) return 'aldeao';
  
  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  if (isExpired) return 'aldeao';
  
  if (status === 'mestre' || status === 'premium') return 'mestre';
  if (status === 'heroi') return 'heroi';
  return 'aldeao';
}

function getLimitsForTier(tier: SubscriptionTier) {
  switch (tier) {
    case 'mestre': return MESTRE_LIMITS;
    case 'heroi': return HEROI_LIMITS;
    default: return ALDEAO_LIMITS;
  }
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionInfo> => {
      if (!user) {
        return {
          tier: 'aldeao',
          status: 'aldeao',
          expiresAt: null,
          characterCount: 0,
          canCreateCharacter: false,
          canCreateCampaign: false,
          canCreateHomebrew: false,
          limits: ALDEAO_LIMITS,
        };
      }

      // Get subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, expires_at')
        .eq('user_id', user.id)
        .single();

      // Get character count
      const { count: characterCount } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const tier = getTierFromStatus(subscription?.status ?? null, subscription?.expires_at ?? null);
      const limits = getLimitsForTier(tier);
      const count = characterCount ?? 0;

      const canCreateCharacter = tier === 'mestre' 
        ? true 
        : tier === 'heroi' 
          ? count < 20 
          : count < 3;

      return {
        tier,
        status: subscription?.status ?? 'aldeao',
        expiresAt: subscription?.expires_at ?? null,
        characterCount: count,
        canCreateCharacter,
        canCreateCampaign: tier === 'mestre',
        canCreateHomebrew: tier === 'heroi' || tier === 'mestre',
        limits,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCharacterCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['characterCount', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return count ?? 0;
    },
    enabled: !!user,
  });
}
