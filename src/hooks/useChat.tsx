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
  reply_to_id: string | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  recipient_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  reply_to?: {
    id: string;
    content: string;
    user_id: string;
    profile?: {
      display_name: string | null;
    };
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
          const newMessage = payload.new as any;
          
          // Check if this message is visible to the current user
          const isPublic = !newMessage.recipient_id;
          const isSentByMe = newMessage.user_id === user?.id;
          const isSentToMe = newMessage.recipient_id === user?.id;
          
          if (!isPublic && !isSentByMe && !isSentToMe) {
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

          // Fetch reply_to message if exists
          let replyTo = null;
          if (newMessage.reply_to_id) {
            const { data: replyMsg } = await supabase
              .from('campaign_messages')
              .select('id, content, user_id')
              .eq('id', newMessage.reply_to_id)
              .single();
            
            if (replyMsg) {
              const { data: replyProfile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', replyMsg.user_id)
                .single();
              
              replyTo = {
                ...replyMsg,
                profile: replyProfile || undefined,
              };
            }
          }
          
          queryClient.setQueryData<CampaignMessage[]>(
            ['campaign-messages', campaignId],
            (old = []) => [...old, { 
              ...newMessage, 
              profile: profile || undefined,
              recipient_profile: recipientProfile || undefined,
              reply_to: replyTo || undefined,
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

      // Get reply_to message IDs
      const replyToIds = messages.filter(m => m.reply_to_id).map(m => m.reply_to_id!);

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Get reply_to messages if any
      let replyToMessages: any[] = [];
      if (replyToIds.length > 0) {
        const { data: replies } = await supabase
          .from('campaign_messages')
          .select('id, content, user_id')
          .in('id', replyToIds);
        
        if (replies) {
          // Get profiles for reply authors
          const replyUserIds = [...new Set(replies.map(r => r.user_id))];
          const { data: replyProfiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', replyUserIds);
          
          const replyProfileMap = new Map(replyProfiles?.map(p => [p.id, p]) || []);
          
          replyToMessages = replies.map(r => ({
            ...r,
            profile: replyProfileMap.get(r.user_id) || null,
          }));
        }
      }

      // Create maps
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const replyToMap = new Map(replyToMessages.map(r => [r.id, r]));

      // Combine messages with their profiles and replies
      return messages.map(msg => ({
        ...msg,
        profile: profileMap.get(msg.user_id) || null,
        recipient_profile: msg.recipient_id ? profileMap.get(msg.recipient_id) || null : null,
        reply_to: msg.reply_to_id ? replyToMap.get(msg.reply_to_id) || null : null,
      })) as CampaignMessage[];
    },
    enabled: !!campaignId,
  });
}

// Send a message (with optional recipient for private messages and reply)
export function useSendMessage() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      content, 
      recipientId,
      replyToId,
    }: { 
      campaignId: string; 
      content: string;
      recipientId?: string;
      replyToId?: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('campaign_messages')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          content,
          recipient_id: recipientId || null,
          reply_to_id: replyToId || null,
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
