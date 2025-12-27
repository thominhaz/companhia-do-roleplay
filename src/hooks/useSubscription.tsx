import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export type SubscriptionTier = 'visitante' | 'aldeao' | 'heroi' | 'mestre';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: string;
  expiresAt: string | null;
  isLifetime: boolean;
  characterCount: number;
  canCreateCharacter: boolean;
  canCreateCampaign: boolean;
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

const VISITANTE_LIMITS = {
  maxCharacters: 0 as const,
  canBeMaster: false,
  hasCombatTracker: false,
  hasAdvancedTools: false,
  hasThemes: false,
  hasHistorico: false,
  hasDiscordIntegration: false,
  hasStressSanity: false,
};

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
  if (!status) return 'visitante';
  
  // Check if expired (but lifetime tokens have no expiration)
  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  if (isExpired) return 'visitante';
  
  if (status === 'mestre' || status === 'premium') return 'mestre';
  if (status === 'heroi') return 'heroi';
  if (status === 'aldeao') return 'aldeao';
  if (status === 'visitante') return 'visitante';
  
  return 'visitante';
}

function getLimitsForTier(tier: SubscriptionTier) {
  switch (tier) {
    case 'mestre': return MESTRE_LIMITS;
    case 'heroi': return HEROI_LIMITS;
    case 'aldeao': return ALDEAO_LIMITS;
    default: return VISITANTE_LIMITS;
  }
}

function isLifetimeSubscription(expiresAt: string | null): boolean {
  if (!expiresAt) return true; // null = lifetime
  // Consider 10+ years as lifetime
  const tenYearsFromNow = new Date();
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);
  return new Date(expiresAt) > tenYearsFromNow;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionInfo> => {
      if (!user) {
        return {
          tier: 'visitante',
          status: 'visitante',
          expiresAt: null,
          isLifetime: false,
          characterCount: 0,
          canCreateCharacter: false,
          canCreateCampaign: false,
          canCreateHomebrew: false,
          canUseQuickNotes: false,
          canUseForge: false,
          limits: VISITANTE_LIMITS,
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
      const isLifetime = isLifetimeSubscription(subscription?.expires_at ?? null);

      // Visitante cannot create anything
      const canCreateCharacter = tier === 'visitante' 
        ? false 
        : tier === 'mestre' 
          ? true 
          : tier === 'heroi' 
            ? count < 20 
            : count < 3;

      return {
        tier,
        status: subscription?.status ?? 'visitante',
        expiresAt: subscription?.expires_at ?? null,
        isLifetime,
        characterCount: count,
        canCreateCharacter,
        canCreateCampaign: tier === 'mestre',
        canCreateHomebrew: tier === 'heroi' || tier === 'mestre',
        canUseQuickNotes: tier !== 'visitante',
        canUseForge: tier !== 'visitante',
        limits,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook para verificar e sincronizar assinatura (mantém compatibilidade com Stripe para futuro)
export function useSubscriptionSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const checkStripeSubscription = useCallback(async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        return null;
      }
      
      // Invalida cache para forçar refetch
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      
      return data;
    } catch (error) {
      console.error("Error in checkStripeSubscription:", error);
      return null;
    }
  }, [user, queryClient]);

  // Verifica parâmetros de retorno do Stripe checkout (mantido para futuro)
  useEffect(() => {
    const subscriptionStatus = searchParams.get("subscription");
    
    if (subscriptionStatus === "success") {
      toast.success("Assinatura realizada com sucesso! Atualizando seu plano...");
      
      // Limpa o parâmetro da URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("subscription");
      setSearchParams(newParams, { replace: true });
      
      // Verifica a assinatura com retry
      const checkWithRetry = async (attempts = 0) => {
        const result = await checkStripeSubscription();
        
        if (result?.subscribed) {
          const tierName = result.tier === 'mestre' ? 'Mestre' : 'Herói';
          toast.success(`Plano ${tierName} ativado com sucesso!`);
        } else if (attempts < 3) {
          setTimeout(() => checkWithRetry(attempts + 1), 2000);
        }
      };
      
      checkWithRetry();
    } else if (subscriptionStatus === "canceled") {
      toast.info("Assinatura cancelada");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("subscription");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, checkStripeSubscription]);

  // Verifica assinatura ao fazer login
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        checkStripeSubscription();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id, checkStripeSubscription]);

  return { checkStripeSubscription };
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
