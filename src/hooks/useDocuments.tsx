import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface CampaignDocument {
  id: string;
  campaign_id: string;
  created_by: string;
  title: string;
  content: string | null;
  document_type: string;
  style: string;
  is_signed: boolean;
  signature_data: { character_id: string; character_name: string; signed_at: string }[];
  requires_signature: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentDelivery {
  id: string;
  document_id: string;
  character_id: string;
  delivered_at: string;
  read_at: string | null;
}

export function useCampaignDocuments(campaignId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign-documents', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_documents')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(doc => ({
        ...doc,
        signature_data: (doc.signature_data || []) as CampaignDocument['signature_data']
      })) as CampaignDocument[];
    },
    enabled: !!campaignId && !!user
  });
}

export function useDocumentDeliveries(documentId: string) {
  return useQuery({
    queryKey: ['document-deliveries', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_document_deliveries')
        .select(`
          *,
          characters:character_id (id, name, image_url)
        `)
        .eq('document_id', documentId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!documentId
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      campaign_id: string;
      title: string;
      content?: string;
      document_type: string;
      style?: string;
      requires_signature?: boolean;
    }) => {
      const { error } = await supabase
        .from('campaign_documents')
        .insert({
          ...data,
          created_by: user!.id
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-documents', variables.campaign_id] });
      toast.success('Documento criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar documento');
    }
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId, ...data }: {
      id: string;
      campaignId: string;
      title?: string;
      content?: string;
      document_type?: string;
      style?: string;
      requires_signature?: boolean;
      is_signed?: boolean;
      signature_data?: CampaignDocument['signature_data'];
    }) => {
      const { error } = await supabase
        .from('campaign_documents')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-documents', variables.campaignId] });
      toast.success('Documento atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar documento');
    }
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
      const { error } = await supabase
        .from('campaign_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-documents', variables.campaignId] });
      toast.success('Documento excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir documento');
    }
  });
}

export function useDeliverDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, characterIds }: { documentId: string; characterIds: string[] }) => {
      const deliveries = characterIds.map(character_id => ({
        document_id: documentId,
        character_id
      }));

      const { error } = await supabase
        .from('campaign_document_deliveries')
        .upsert(deliveries, { onConflict: 'document_id,character_id' });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-deliveries', variables.documentId] });
      toast.success('Documento entregue aos jogadores!');
    },
    onError: () => {
      toast.error('Erro ao entregar documento');
    }
  });
}

export function useCharacterDocuments(characterId: string) {
  return useQuery({
    queryKey: ['character-documents', characterId],
    queryFn: async () => {
      const { data: deliveries, error } = await supabase
        .from('campaign_document_deliveries')
        .select(`
          *,
          document:document_id (*)
        `)
        .eq('character_id', characterId)
        .order('delivered_at', { ascending: false });

      if (error) throw error;
      return (deliveries || []).map(d => ({
        ...d,
        document: d.document ? {
          ...d.document,
          signature_data: (d.document.signature_data || []) as CampaignDocument['signature_data']
        } : null
      }));
    },
    enabled: !!characterId
  });
}

export function useMarkDocumentRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deliveryId, characterId }: { deliveryId: string; characterId: string }) => {
      const { error } = await supabase
        .from('campaign_document_deliveries')
        .update({ read_at: new Date().toISOString() })
        .eq('id', deliveryId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['character-documents', variables.characterId] });
    }
  });
}

export function useSignDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      documentId, 
      campaignId,
      characterId, 
      characterName,
      currentSignatures 
    }: { 
      documentId: string;
      campaignId: string;
      characterId: string;
      characterName: string;
      currentSignatures: CampaignDocument['signature_data'];
    }) => {
      const newSignature = {
        character_id: characterId,
        character_name: characterName,
        signed_at: new Date().toISOString()
      };

      const updatedSignatures = [...currentSignatures, newSignature];

      const { error } = await supabase
        .from('campaign_documents')
        .update({ 
          signature_data: updatedSignatures,
          is_signed: true
        })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-documents', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['character-documents'] });
      toast.success('Documento assinado!');
    },
    onError: () => {
      toast.error('Erro ao assinar documento');
    }
  });
}
