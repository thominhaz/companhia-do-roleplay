import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WhiteboardElement {
  id: string;
  campaign_id: string;
  element_type: 'sticky_note' | 'text' | 'image' | 'connection';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  z_index?: number;
  content?: string;
  image_url?: string;
  background_color?: string;
  text_color?: string;
  font_size?: number;
  connection_from?: string;
  connection_to?: string;
  connection_style?: string;
  created_at: string;
  updated_at: string;
}

export function useWhiteboardElements(campaignId: string) {
  return useQuery({
    queryKey: ['whiteboard-elements', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_whiteboard_elements')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('z_index', { ascending: true });

      if (error) throw error;
      return data as WhiteboardElement[];
    },
    enabled: !!campaignId,
  });
}

export function useCreateWhiteboardElement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (element: Omit<WhiteboardElement, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('campaign_whiteboard_elements')
        .insert(element)
        .select()
        .single();

      if (error) throw error;
      return data as WhiteboardElement;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-elements', data.campaign_id] });
    },
    onError: (error) => {
      console.error('Error creating element:', error);
      toast.error('Erro ao criar elemento');
    },
  });
}

export function useUpdateWhiteboardElement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId, ...updates }: { id: string; campaignId: string } & Partial<WhiteboardElement>) => {
      const { data, error } = await supabase
        .from('campaign_whiteboard_elements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, campaignId } as WhiteboardElement & { campaignId: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-elements', data.campaignId] });
    },
  });
}

export function useDeleteWhiteboardElement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
      const { error } = await supabase
        .from('campaign_whiteboard_elements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, campaignId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-elements', data.campaignId] });
    },
    onError: () => {
      toast.error('Erro ao excluir elemento');
    },
  });
}

export function useBulkUpdateWhiteboardElements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, elements }: { campaignId: string; elements: Array<{ id: string } & Partial<WhiteboardElement>> }) => {
      const promises = elements.map(({ id, ...updates }) =>
        supabase
          .from('campaign_whiteboard_elements')
          .update(updates)
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error('Some updates failed');
      }

      return { campaignId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-elements', data.campaignId] });
    },
  });
}

export function useClearWhiteboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('campaign_whiteboard_elements')
        .delete()
        .eq('campaign_id', campaignId);

      if (error) throw error;
      return campaignId;
    },
    onSuccess: (campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-elements', campaignId] });
      toast.success('Whiteboard limpo');
    },
    onError: () => {
      toast.error('Erro ao limpar whiteboard');
    },
  });
}
