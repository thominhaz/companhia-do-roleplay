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
  recipient_id: string | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  recipient_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Fetch messages for a campaign with realtime updates
export function useCampaignMessages(campaignId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
        async (payload) => {
          const newMessage = payload.new as CampaignMessage;
          
          // Check if this message is visible to the current user
          const isPublic = !newMessage.recipient_id;
          const isSentByMe = newMessage.user_id === user?.id;
          const isSentToMe = newMessage.recipient_id === user?.id;
          
          if (!isPublic && !isSentByMe && !isSentToMe) {
            // This private message is not for us, ignore
            return;
          }
          
          // Fetch the profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('id', newMessage.user_id)
            .single();
          
          // Fetch recipient profile if it's a private message
          let recipientProfile = null;
          if (newMessage.recipient_id) {
            const { data } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url')
              .eq('id', newMessage.recipient_id)
              .single();
            recipientProfile = data;
          }
          
          queryClient.setQueryData<CampaignMessage[]>(
            ['campaign-messages', campaignId],
            (old = []) => [...old, { 
              ...newMessage, 
              profile: profile || undefined,
              recipient_profile: recipientProfile || undefined
            }]
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
  }, [campaignId, queryClient, user?.id]);

  return useQuery({
    queryKey: ['campaign-messages', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];

      // Get messages (RLS will filter based on recipient_id visibility)
      const { data: messages, error: messagesError } = await supabase
        .from('campaign_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      if (!messages || messages.length === 0) return [];

      // Get unique user IDs (both senders and recipients)
      const userIds = [...new Set([
        ...messages.map(m => m.user_id),
        ...messages.filter(m => m.recipient_id).map(m => m.recipient_id!)
      ])];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Combine messages with their profiles
      return messages.map(msg => ({
        ...msg,
        profile: profileMap.get(msg.user_id) || null,
        recipient_profile: msg.recipient_id ? profileMap.get(msg.recipient_id) || null : null,
      })) as CampaignMessage[];
    },
    enabled: !!campaignId,
  });
}

// Send a message (with optional recipient for private messages)
export function useSendMessage() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      content, 
      recipientId 
    }: { 
      campaignId: string; 
      content: string;
      recipientId?: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('campaign_messages')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          content,
          recipient_id: recipientId || null,
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
