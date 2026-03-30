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
  parent_id: string | null;
  sort_order: number;
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
        .order('sort_order', { ascending: true });

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
    mutationFn: async (note: { campaign_id: string; title: string; content?: string; is_public?: boolean; parent_id?: string | null }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Calculate next sort_order for siblings
      const { data: siblings } = await supabase
        .from('campaign_notes')
        .select('sort_order')
        .eq('campaign_id', note.campaign_id)
        .is('parent_id', note.parent_id ?? null)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = (siblings?.[0]?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from('campaign_notes')
        .insert({
          ...note,
          user_id: user.id,
          is_public: note.is_public ?? false,
          sort_order: nextOrder,
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

// Reorder notes (swap sort_order between two notes)
export function useReorderNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, direction, campaignId }: { noteId: string; direction: 'up' | 'down'; campaignId: string }) => {
      const { data: allNotes, error: fetchError } = await supabase
        .from('campaign_notes')
        .select('id, parent_id, sort_order')
        .eq('campaign_id', campaignId)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      if (!allNotes) return campaignId;

      const currentNote = allNotes.find(n => n.id === noteId);
      if (!currentNote) return campaignId;

      // Get siblings (same parent_id)
      const siblings = allNotes
        .filter(n => n.parent_id === currentNote.parent_id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      // Normalize sort_orders if they're all the same (e.g. all 0)
      const allSameOrder = siblings.every(s => s.sort_order === siblings[0]?.sort_order);
      if (allSameOrder && siblings.length > 1) {
        await Promise.all(
          siblings.map((s, idx) =>
            supabase.from('campaign_notes').update({ sort_order: idx }).eq('id', s.id)
          )
        );
        // Re-assign local values after normalization
        siblings.forEach((s, idx) => { s.sort_order = idx; });
      }

      const currentIdx = siblings.findIndex(n => n.id === noteId);
      const swapIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;

      if (swapIdx < 0 || swapIdx >= siblings.length) return campaignId;

      const swapNote = siblings[swapIdx];
      const currentOrder = currentNote.sort_order ?? currentIdx;
      const swapOrder = swapNote.sort_order ?? swapIdx;

      await Promise.all([
        supabase.from('campaign_notes').update({ sort_order: swapOrder }).eq('id', noteId),
        supabase.from('campaign_notes').update({ sort_order: currentOrder }).eq('id', swapNote.id),
      ]);

      return campaignId;
    },
    onSuccess: (campaignId) => {
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaign-notes', campaignId] });
      }
    },
    onError: () => {
      toast.error('Erro ao reordenar nota');
    },
  });
}

// Delete a note
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
      // First, recursively delete all child notes
      const deleteChildren = async (parentId: string) => {
        const { data: children } = await supabase
          .from('campaign_notes')
          .select('id')
          .eq('parent_id', parentId);

        if (children && children.length > 0) {
          for (const child of children) {
            await deleteChildren(child.id);
          }
          await supabase
            .from('campaign_notes')
            .delete()
            .in('id', children.map(c => c.id));
        }
      };

      await deleteChildren(id);

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
