import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SessionDB {
  id: string;
  campaign_id: string;
  title: string;
  scheduled_at: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface CampaignPlayerDB {
  id: string;
  campaign_id: string;
  user_id: string;
  character_id: string | null;
  role: string;
  joined_at: string;
}

// Fetch sessions for a campaign
export function useCampaignSessions(campaignId: string) {
  return useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      return data as SessionDB[];
    },
    enabled: !!campaignId,
  });
}

// Create a new session
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: {
      campaign_id: string;
      title: string;
      scheduled_at: string;
      location?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert(session)
        .select()
        .single();

      if (error) throw error;
      return data as SessionDB;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.campaign_id] });
      toast.success('Sessão agendada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar sessão: ' + error.message);
    },
  });
}

// Update a session
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SessionDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SessionDB;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.campaign_id] });
      toast.success('Sessão atualizada');
    },
    onError: () => {
      toast.error('Erro ao atualizar sessão');
    },
  });
}

// Delete a session
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return campaignId;
    },
    onSuccess: (campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', campaignId] });
      toast.success('Sessão removida');
    },
    onError: () => {
      toast.error('Erro ao remover sessão');
    },
  });
}

// Fetch players for a campaign
export function useCampaignPlayers(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-players', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];

      const { data, error } = await supabase
        .from('campaign_players')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data as CampaignPlayerDB[];
    },
    enabled: !!campaignId,
  });
}

// Invite/Add player to campaign
export function useInvitePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, userId, characterId }: {
      campaignId: string;
      userId: string;
      characterId?: string;
    }) => {
      const { data, error } = await supabase
        .from('campaign_players')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          character_id: characterId || null,
          role: 'player',
        })
        .select()
        .single();

      if (error) throw error;
      return data as CampaignPlayerDB;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-players', data.campaign_id] });
      toast.success('Jogador adicionado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar jogador: ' + error.message);
    },
  });
}

// Join a campaign (for players)
export function useJoinCampaign() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, characterId }: {
      campaignId: string;
      characterId?: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Check if campaign exists
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaignId)
        .maybeSingle();

      if (campaignError) throw campaignError;
      if (!campaign) throw new Error('Campanha não encontrada');

      // Check if already a member
      const { data: existing } = await supabase
        .from('campaign_players')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) throw new Error('Você já está nesta campanha');

      // Join campaign
      const { data, error } = await supabase
        .from('campaign_players')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          character_id: characterId || null,
          role: 'player',
        })
        .select()
        .single();

      if (error) throw error;
      return data as CampaignPlayerDB;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Você entrou na campanha!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Leave a campaign
export function useLeaveCampaign() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('campaign_players')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Você saiu da campanha');
    },
    onError: () => {
      toast.error('Erro ao sair da campanha');
    },
  });
}

// Remove player from campaign (for masters)
export function useRemovePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, campaignId }: { playerId: string; campaignId: string }) => {
      const { error } = await supabase
        .from('campaign_players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;
      return campaignId;
    },
    onSuccess: (campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-players', campaignId] });
      toast.success('Jogador removido');
    },
    onError: () => {
      toast.error('Erro ao remover jogador');
    },
  });
}

// Update player's character in campaign
export function useUpdateCampaignPlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, characterId, campaignId }: {
      playerId: string;
      characterId: string | null;
      campaignId: string;
    }) => {
      const { data, error } = await supabase
        .from('campaign_players')
        .update({ character_id: characterId })
        .eq('id', playerId)
        .select()
        .single();

      if (error) throw error;
      return { data, campaignId };
    },
    onSuccess: ({ campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-players', campaignId] });
      toast.success('Personagem atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar personagem');
    },
  });
}
