import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PersonalNote {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  color: string;
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Fetch all personal notes
export function usePersonalNotes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['personal-notes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('personal_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(note => ({
        ...note,
        tags: note.tags || []
      })) as PersonalNote[];
    },
    enabled: !!user,
  });
}

// Create a note
export function useCreatePersonalNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: { title: string; content?: string; color?: string; tags?: string[] }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('personal_notes')
        .insert({
          ...note,
          user_id: user.id,
          color: note.color ?? 'default',
          tags: note.tags ?? [],
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, tags: data.tags || [] } as PersonalNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-notes'] });
      toast.success('Nota criada!');
    },
    onError: () => {
      toast.error('Erro ao criar nota');
    },
  });
}

// Update a note
export function useUpdatePersonalNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PersonalNote> & { id: string }) => {
      const { data, error } = await supabase
        .from('personal_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, tags: data.tags || [] } as PersonalNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-notes'] });
    },
    onError: () => {
      toast.error('Erro ao salvar nota');
    },
  });
}

// Delete a note
export function useDeletePersonalNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('personal_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-notes'] });
      toast.success('Nota removida');
    },
    onError: () => {
      toast.error('Erro ao remover nota');
    },
  });
}

// Toggle pin status
export function useTogglePinNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const { data, error } = await supabase
        .from('personal_notes')
        .update({ is_pinned: !isPinned, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, tags: data.tags || [] } as PersonalNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['personal-notes'] });
      toast.success(data.is_pinned ? 'Nota fixada!' : 'Nota desafixada');
    },
    onError: () => {
      toast.error('Erro ao atualizar nota');
    },
  });
}
