import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type HomebrewShareRequest = {
  id: string;
  campaign_id: string;
  content_id: string;
  requester_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  responded_at: string | null;
  responded_by: string | null;
};

export type HomebrewShareRequestWithDetails = HomebrewShareRequest & {
  homebrew_content: {
    id: string;
    name: string;
    type: string;
    icon: string | null;
    description: string | null;
  };
  requester_profile: {
    display_name: string | null;
  } | null;
};

// Hook para buscar solicitações pendentes de uma campanha (para mestres)
export function useCampaignShareRequests(campaignId: string | undefined) {
  const { user } = useAuth();

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['homebrew-share-requests', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      
      const { data, error } = await supabase
        .from('homebrew_share_requests')
        .select(`
          *,
          homebrew_content (
            id,
            name,
            type,
            icon,
            description
          )
        `)
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch requester profiles
      const requesterIds = [...new Set((data || []).map((r: any) => r.requester_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', requesterIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      
      return (data || []).map((request: any) => ({
        ...request,
        requester_profile: profileMap.get(request.requester_id) || null
      })) as HomebrewShareRequestWithDetails[];
    },
    enabled: !!user && !!campaignId,
  });

  return { requests, isLoading, refetch };
}

// Hook para buscar campanhas elegíveis para compartilhar (para jogadores)
export function useEligibleCampaignsForSharing() {
  const { user } = useAuth();

  const { data: eligibleCampaigns = [], isLoading } = useQuery({
    queryKey: ['eligible-campaigns-for-sharing', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Busca campanhas onde o usuário é jogador e a política permite compartilhamento
      const { data, error } = await supabase
        .from('campaign_players')
        .select(`
          campaign_id,
          campaigns (
            id,
            name,
            description,
            homebrew_sharing_policy,
            master_id
          )
        `)
        .eq('user_id', user.id)
        .neq('role', 'master');
      
      if (error) throw error;
      
      // Filtra campanhas com política de compartilhamento ativa
      return (data || [])
        .filter((cp: any) => 
          cp.campaigns && 
          cp.campaigns.homebrew_sharing_policy !== 'disabled' &&
          cp.campaigns.master_id !== user.id
        )
        .map((cp: any) => ({
          id: cp.campaigns.id,
          name: cp.campaigns.name,
          description: cp.campaigns.description,
          homebrew_sharing_policy: cp.campaigns.homebrew_sharing_policy,
        }));
    },
    enabled: !!user,
  });

  return { eligibleCampaigns, isLoading };
}

// Hook para solicitar compartilhamento
export function useRequestHomebrewShare() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ contentId, campaignId }: { contentId: string; campaignId: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('homebrew_share_requests')
        .insert({
          content_id: contentId,
          campaign_id: campaignId,
          requester_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-share-requests'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-share-status'] });
      toast.success('Solicitação enviada ao mestre!');
    },
    onError: (error: Error) => {
      console.error('Error requesting share:', error);
      if (error.message.includes('duplicate')) {
        toast.error('Já existe uma solicitação pendente');
      } else {
        toast.error('Erro ao solicitar compartilhamento');
      }
    },
  });

  return {
    requestShare: mutation.mutate,
    isRequesting: mutation.isPending,
  };
}

// Hook para responder a solicitações (aprovar/rejeitar)
export function useRespondToShareRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, contentId, campaignId }: { 
      requestId: string; 
      contentId: string;
      campaignId: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      // Atualiza a solicitação
      const { error: updateError } = await supabase
        .from('homebrew_share_requests')
        .update({
          status: 'approved',
          responded_at: new Date().toISOString(),
          responded_by: user.id,
        })
        .eq('id', requestId);
      
      if (updateError) throw updateError;
      
      // Cria o compartilhamento efetivo
      const { error: shareError } = await supabase
        .from('homebrew_shares')
        .insert({
          content_id: contentId,
          campaign_id: campaignId,
        });
      
      if (shareError && !shareError.message.includes('duplicate')) {
        throw shareError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-share-requests'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-homebrew'] });
      toast.success('Solicitação aprovada!');
    },
    onError: (error: Error) => {
      console.error('Error approving request:', error);
      toast.error('Erro ao aprovar solicitação');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('homebrew_share_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
          responded_by: user.id,
        })
        .eq('id', requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-share-requests'] });
      toast.success('Solicitação rejeitada');
    },
    onError: (error: Error) => {
      console.error('Error rejecting request:', error);
      toast.error('Erro ao rejeitar solicitação');
    },
  });

  return {
    approveRequest: approveMutation.mutate,
    rejectRequest: rejectMutation.mutate,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
