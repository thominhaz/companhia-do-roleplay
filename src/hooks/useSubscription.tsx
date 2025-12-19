import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SubscriptionStatus = 'free' | 'premium';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  expiresAt: string | null;
  characterCount: number;
  canCreateCharacter: boolean;
  canCreateCampaign: boolean;
  limits: {
    maxCharacters: number | 'unlimited';
    canBeMaster: boolean;
    hasCombatTracker: boolean;
    hasAdvancedTools: boolean;
  };
}

const FREE_LIMITS = {
  maxCharacters: 3 as const,
  canBeMaster: false,
  hasCombatTracker: false,
  hasAdvancedTools: false,
};

const PREMIUM_LIMITS = {
  maxCharacters: 'unlimited' as const,
  canBeMaster: true,
  hasCombatTracker: true,
  hasAdvancedTools: true,
};

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionInfo> => {
      if (!user) {
        return {
          status: 'free',
          expiresAt: null,
          characterCount: 0,
          canCreateCharacter: false,
          canCreateCampaign: false,
          limits: FREE_LIMITS,
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

      const isPremium = subscription?.status === 'premium' && 
        (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

      const status: SubscriptionStatus = isPremium ? 'premium' : 'free';
      const limits = isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
      const count = characterCount ?? 0;

      return {
        status,
        expiresAt: subscription?.expires_at ?? null,
        characterCount: count,
        canCreateCharacter: isPremium || count < 3,
        canCreateCampaign: isPremium,
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
