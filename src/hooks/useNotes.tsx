import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CampaignNote {
  id: string;
  campaign_id: string;
  user_id: string;
  title: string;
  content: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Fetch notes for a campaign
export function useCampaignNotes(campaignId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign-notes', campaignId],
    queryFn: async () => {
      if (!campaignId || !user) return [];

      const { data, error } = await supabase
        .from('campaign_notes')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(data.map(n => n.user_id))];

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      // Create a map of user_id to profile
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Combine notes with their profiles
      return data.map(note => ({
        ...note,
        profile: profileMap.get(note.user_id) || null,
      })) as CampaignNote[];
    },
    enabled: !!campaignId && !!user,
  });
}

// Create a note
export function useCreateNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: { campaign_id: string; title: string; content?: string; is_public?: boolean }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('campaign_notes')
        .insert({
          ...note,
          user_id: user.id,
          is_public: note.is_public ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CampaignNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-notes', data.campaign_id] });
      toast.success('Nota criada!');
    },
    onError: () => {
      toast.error('Erro ao criar nota');
    },
  });
}

// Update a note
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId, ...updates }: Partial<CampaignNote> & { id: string; campaignId: string }) => {
      const { data, error } = await supabase
        .from('campaign_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, campaignId };
    },
    onSuccess: ({ campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-notes', campaignId] });
      toast.success('Nota salva');
    },
    onError: () => {
      toast.error('Erro ao salvar nota');
    },
  });
}

// Delete a note
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
      const { error } = await supabase
        .from('campaign_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return campaignId;
    },
    onSuccess: (campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-notes', campaignId] });
      toast.success('Nota removida');
    },
    onError: () => {
      toast.error('Erro ao remover nota');
    },
  });
}
