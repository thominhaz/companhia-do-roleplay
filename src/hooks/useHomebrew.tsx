import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { 
  HomebrewContent, 
  HomebrewContentType, 
  CreateHomebrewInput, 
  UpdateHomebrewInput,
  HomebrewShare,
  HomebrewData
} from '@/types';

// Transform database row to HomebrewContent type
function transformHomebrewContent(row: any): HomebrewContent {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as HomebrewContentType,
    name: row.name,
    description: row.description,
    icon: row.icon || '✨',
    data: row.data as HomebrewData,
    source: row.source,
    is_public: row.is_public,
    version: row.version,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useHomebrew(type?: HomebrewContentType) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's homebrew content
  const { data: homebrewContent, isLoading, error } = useQuery({
    queryKey: ['homebrew', user?.id, type],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('homebrew_content')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []).map(transformHomebrewContent);
    },
    enabled: !!user,
  });

  // Fetch homebrew count for limit checking
  const { data: homebrewCount = 0 } = useQuery({
    queryKey: ['homebrew-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { data, error } = await supabase.rpc('count_user_homebrew', {
        _user_id: user.id
      });
      
      if (error) throw error;
      return data || 0;
    },
    enabled: !!user,
  });

  // Check if user can create homebrew
  const { data: canCreate = false } = useQuery({
    queryKey: ['can-create-homebrew', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase.rpc('can_create_homebrew', {
        _user_id: user.id
      });
      
      if (error) throw error;
      return data || false;
    },
    enabled: !!user,
  });

  // Create homebrew mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateHomebrewInput) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('homebrew_content')
        .insert([{
          user_id: user.id,
          type: input.type,
          name: input.name,
          description: input.description || null,
          icon: input.icon || '✨',
          data: input.data,
          is_public: input.is_public || false,
        } as any])
        .select()
        .single();
      
      if (error) throw error;
      return transformHomebrewContent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-count'] });
      toast.success('Conteúdo criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating homebrew:', error);
      const msg = error?.message || String(error);
      if (msg.includes('row-level security')) {
        toast.error('Você precisa ser premium para criar conteúdo homebrew');
      } else {
        toast.error(`Erro ao criar conteúdo: ${msg}`);
      }
    },
  });

  // Update homebrew mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateHomebrewInput }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.icon !== undefined) updateData.icon = input.icon;
      if (input.data !== undefined) updateData.data = input.data;
      if (input.is_public !== undefined) updateData.is_public = input.is_public;
      
      // Increment version on update
      const { data: current } = await supabase
        .from('homebrew_content')
        .select('version')
        .eq('id', id)
        .single();
      
      updateData.version = (current?.version || 1) + 1;
      
      const { data, error } = await supabase
        .from('homebrew_content')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return transformHomebrewContent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew'] });
      toast.success('Conteúdo atualizado!');
    },
    onError: (error: Error) => {
      console.error('Error updating homebrew:', error);
      toast.error('Erro ao atualizar conteúdo');
    },
  });

  // Delete homebrew mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('homebrew_content')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-count'] });
      toast.success('Conteúdo excluído!');
    },
    onError: (error: Error) => {
      console.error('Error deleting homebrew:', error);
      toast.error('Erro ao excluir conteúdo');
    },
  });

  // Share homebrew with campaign mutation
  const shareMutation = useMutation({
    mutationFn: async ({ contentId, campaignId }: { contentId: string; campaignId: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('homebrew_shares')
        .insert({
          content_id: contentId,
          campaign_id: campaignId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as HomebrewShare;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-shares'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-share-status'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-homebrew'] });
      toast.success('Compartilhado com a campanha!');
    },
    onError: (error: Error) => {
      console.error('Error sharing homebrew:', error);
      if (error.message.includes('duplicate')) {
        toast.error('Já compartilhado com esta campanha');
      } else {
        toast.error('Erro ao compartilhar');
      }
    },
  });

  // Unshare homebrew from campaign mutation
  const unshareMutation = useMutation({
    mutationFn: async ({ contentId, campaignId }: { contentId: string; campaignId: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('homebrew_shares')
        .delete()
        .eq('content_id', contentId)
        .eq('campaign_id', campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-shares'] });
      toast.success('Compartilhamento removido!');
    },
    onError: (error: Error) => {
      console.error('Error unsharing homebrew:', error);
      toast.error('Erro ao remover compartilhamento');
    },
  });

  return {
    // Data
    homebrewContent: homebrewContent || [],
    homebrewCount,
    canCreate,
    isLoading,
    error,
    
    // Mutations
    createHomebrew: createMutation.mutate,
    updateHomebrew: updateMutation.mutate,
    deleteHomebrew: deleteMutation.mutate,
    shareWithCampaign: shareMutation.mutate,
    shareWithCampaignAsync: shareMutation.mutateAsync,
    unshareFromCampaign: unshareMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSharing: shareMutation.isPending,
  };
}

// Hook for fetching shared homebrew content for a campaign
export function useCampaignHomebrew(campaignId: string | undefined) {
  const { user } = useAuth();

  const { data: sharedContent, isLoading } = useQuery({
    queryKey: ['campaign-homebrew', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      
      const { data, error } = await supabase
        .from('homebrew_shares')
        .select(`
          id,
          content_id,
          campaign_id,
          shared_at,
          homebrew_content (*)
        `)
        .eq('campaign_id', campaignId);
      
      if (error) throw error;
      
      return (data || []).map((share: any) => ({
        share: {
          id: share.id,
          content_id: share.content_id,
          campaign_id: share.campaign_id,
          shared_at: share.shared_at,
        } as HomebrewShare,
        content: transformHomebrewContent(share.homebrew_content),
      }));
    },
    enabled: !!user && !!campaignId,
  });

  return {
    sharedContent: sharedContent || [],
    isLoading,
  };
}

// Hook for fetching a single homebrew item
export function useHomebrewItem(id: string | undefined) {
  const { user } = useAuth();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['homebrew-item', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('homebrew_content')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return transformHomebrewContent(data);
    },
    enabled: !!user && !!id,
  });

  return {
    item,
    isLoading,
    error,
  };
}
