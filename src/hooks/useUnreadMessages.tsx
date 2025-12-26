import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UnreadCount {
  recipientId: string | null; // null = public chat
  count: number;
}

// Fetch unread message counts for a campaign
export function useUnreadMessageCounts(campaignId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-messages', campaignId, user?.id],
    queryFn: async (): Promise<Map<string | null, number>> => {
      if (!user || !campaignId) return new Map();

      // Get read receipts for this user
      const { data: receipts } = await supabase
        .from('campaign_message_read_receipts')
        .select('other_user_id, last_read_at')
        .eq('user_id', user.id)
        .eq('campaign_id', campaignId);

      const receiptMap = new Map<string | null, string>();
      receipts?.forEach(r => {
        receiptMap.set(r.other_user_id, r.last_read_at);
      });

      // Get all messages visible to user
      const { data: messages } = await supabase
        .from('campaign_messages')
        .select('id, user_id, recipient_id, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (!messages) return new Map();

      // Count unread messages per conversation
      const unreadCounts = new Map<string | null, number>();

      messages.forEach(msg => {
        // Skip own messages
        if (msg.user_id === user.id) return;

        // Determine the "other" user ID for this conversation
        let otherUserId: string | null = null;
        
        if (msg.recipient_id === null) {
          // Public message
          otherUserId = null;
        } else if (msg.recipient_id === user.id) {
          // Private message sent TO me
          otherUserId = msg.user_id;
        } else if (msg.user_id === user.id) {
          // Private message sent BY me (skip, we don't count our own)
          return;
        } else {
          // Private message between other users (shouldn't see due to RLS, but skip)
          return;
        }

        const lastRead = receiptMap.get(otherUserId);
        const isUnread = !lastRead || new Date(msg.created_at) > new Date(lastRead);

        if (isUnread) {
          unreadCounts.set(otherUserId, (unreadCounts.get(otherUserId) || 0) + 1);
        }
      });

      return unreadCounts;
    },
    enabled: !!user && !!campaignId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Mark messages as read for a specific conversation
export function useMarkMessagesAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      otherUserId 
    }: { 
      campaignId: string; 
      otherUserId: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('campaign_message_read_receipts')
        .upsert({
          user_id: user.id,
          campaign_id: campaignId,
          other_user_id: otherUserId,
          last_read_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,campaign_id,other_user_id',
        });

      if (error) throw error;
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['unread-messages', campaignId] });
    },
  });
}
