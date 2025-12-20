import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface CampaignMessage {
  id: string;
  campaign_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// Fetch messages for a campaign with realtime updates
export function useCampaignMessages(campaignId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`messages-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_messages',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          queryClient.setQueryData<CampaignMessage[]>(
            ['campaign-messages', campaignId],
            (old = []) => [...old, payload.new as CampaignMessage]
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'campaign_messages',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          queryClient.setQueryData<CampaignMessage[]>(
            ['campaign-messages', campaignId],
            (old = []) => old.filter(m => m.id !== (payload.old as any).id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, queryClient]);

  return useQuery({
    queryKey: ['campaign-messages', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];

      const { data, error } = await supabase
        .from('campaign_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data as CampaignMessage[];
    },
    enabled: !!campaignId,
  });
}

// Send a message
export function useSendMessage() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ campaignId, content }: { campaignId: string; content: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('campaign_messages')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CampaignMessage;
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    },
  });
}

// Delete a message
export function useDeleteMessage() {
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('campaign_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
  });
}
