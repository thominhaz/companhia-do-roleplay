import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CampaignDB {
  id: string;
  master_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  invite_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignPlayerDB {
  id: string;
  campaign_id: string;
  user_id: string;
  character_id: string | null;
  role: 'player' | 'master';
  joined_at: string;
}

export interface SessionDB {
  id: string;
  campaign_id: string;
  title: string;
  scheduled_at: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export function useMasterCampaigns() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaigns', 'master', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_players(count),
          sessions(scheduled_at)
        `)
        .eq('master_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function usePlayerCampaigns() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaigns', 'player', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('campaign_players')
        .select(`
          *,
          campaigns(*)
        `)
        .eq('user_id', user.id)
        .eq('role', 'player');

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAllCampaigns() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaigns', 'all', user?.id],
    queryFn: async () => {
      if (!user) return { master: [], player: [] };

      // Get campaigns where user is master
      const { data: masterCampaigns, error: masterError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('master_id', user.id)
        .order('updated_at', { ascending: false });

      if (masterError) throw masterError;

      // Get campaigns where user is a player
      const { data: playerData, error: playerError } = await supabase
        .from('campaign_players')
        .select(`
          campaign_id,
          role,
          campaigns(*)
        `)
        .eq('user_id', user.id)
        .eq('role', 'player');

      if (playerError) throw playerError;

      const playerCampaigns = playerData
        ?.map(p => p.campaigns)
        .filter(Boolean) as CampaignDB[];

      return {
        master: masterCampaigns || [],
        player: playerCampaigns || [],
      };
    },
    enabled: !!user,
  });
}

export function useCreateCampaign() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: { name: string; description?: string; image_url?: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          ...campaign,
          master_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('row-level security')) {
          throw new Error('Apenas usuários Premium podem criar campanhas');
        }
        throw error;
      }

      // Add master as campaign player
      await supabase.from('campaign_players').insert({
        campaign_id: data.id,
        user_id: user.id,
        role: 'master',
      });

      return data as CampaignDB;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha removida');
    },
    onError: () => {
      toast.error('Erro ao remover campanha');
    },
  });
}
