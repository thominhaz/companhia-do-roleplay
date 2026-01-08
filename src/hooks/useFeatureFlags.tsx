import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FeatureKey = 
  | 'dice_roller'
  | 'character_sheet'
  | 'campaigns'
  | 'combat_tracker'
  | 'forge'
  | 'supporter_gallery'
  | 'advanced_combat'
  | 'stress_sanity'
  | 'discord_bot'
  | 'web_version';

interface StretchGoalFeature {
  feature_key: string | null;
  status: string;
  title: string;
  value: number;
}

export function useFeatureFlags() {
  const { data: features, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stretch_goals')
        .select('feature_key, status, title, value')
        .not('feature_key', 'is', null);
      
      if (error) throw error;
      return data as StretchGoalFeature[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const isFeatureReleased = (featureKey: FeatureKey): boolean => {
    if (!features) return false;
    const feature = features.find(f => f.feature_key === featureKey);
    return feature?.status === 'released';
  };

  const getFeatureStatus = (featureKey: FeatureKey): 'pending' | 'achieved' | 'released' | null => {
    if (!features) return null;
    const feature = features.find(f => f.feature_key === featureKey);
    return feature?.status as 'pending' | 'achieved' | 'released' | null;
  };

  const getReleasedFeatures = (): FeatureKey[] => {
    if (!features) return [];
    return features
      .filter(f => f.status === 'released')
      .map(f => f.feature_key as FeatureKey);
  };

  return {
    isLoading,
    features,
    isFeatureReleased,
    getFeatureStatus,
    getReleasedFeatures,
  };
}
