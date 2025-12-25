import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CampaignNPC {
  id: string;
  campaign_id: string;
  name: string;
  title?: string | null;
  occupation?: string | null;
  location?: string | null;
  appearance?: string | null;
  personality?: string | null;
  motivations?: string | null;
  secrets?: string | null;
  notes?: string | null;
  status: 'alive' | 'dead' | 'unknown' | 'missing';
  image_url?: string | null;
  is_hidden: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NPCRelationship {
  id: string;
  campaign_id: string;
  npc_id: string;
  related_npc_id: string;
  relationship_type: string;
  description?: string | null;
  is_mutual: boolean;
  created_at: string;
  related_npc?: CampaignNPC;
}

export interface CreateNPCData {
  campaign_id: string;
  name: string;
  title?: string;
  occupation?: string;
  location?: string;
  appearance?: string;
  personality?: string;
  motivations?: string;
  secrets?: string;
  notes?: string;
  status?: 'alive' | 'dead' | 'unknown' | 'missing';
  image_url?: string;
  is_hidden?: boolean;
  tags?: string[];
}

export interface UpdateNPCData extends Partial<CreateNPCData> {
  id: string;
}

export interface CreateRelationshipData {
  campaign_id: string;
  npc_id: string;
  related_npc_id: string;
  relationship_type: string;
  description?: string;
  is_mutual?: boolean;
}

// Fetch all NPCs for a campaign
export function useCampaignNPCs(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-npcs', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_npcs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('name');

      if (error) throw error;
      return data as CampaignNPC[];
    },
    enabled: !!campaignId,
  });
}

// Fetch a single NPC with relationships
export function useNPCWithRelationships(npcId: string, campaignId: string) {
  return useQuery({
    queryKey: ['npc-details', npcId],
    queryFn: async () => {
      // Fetch NPC
      const { data: npc, error: npcError } = await supabase
        .from('campaign_npcs')
        .select('*')
        .eq('id', npcId)
        .single();

      if (npcError) throw npcError;

      // Fetch relationships where this NPC is the source
      const { data: outgoingRels, error: outError } = await supabase
        .from('campaign_npc_relationships')
        .select('*')
        .eq('npc_id', npcId);

      if (outError) throw outError;

      // Fetch relationships where this NPC is the target (for mutual relationships)
      const { data: incomingRels, error: inError } = await supabase
        .from('campaign_npc_relationships')
        .select('*')
        .eq('related_npc_id', npcId)
        .eq('is_mutual', true);

      if (inError) throw inError;

      // Get related NPC details
      const relatedNpcIds = [
        ...outgoingRels.map(r => r.related_npc_id),
        ...incomingRels.map(r => r.npc_id)
      ];

      let relatedNpcs: CampaignNPC[] = [];
      if (relatedNpcIds.length > 0) {
        const { data: npcs } = await supabase
          .from('campaign_npcs')
          .select('*')
          .in('id', relatedNpcIds);
        relatedNpcs = npcs as CampaignNPC[] || [];
      }

      // Combine relationships with NPC details
      const relationships = [
        ...outgoingRels.map(r => ({
          ...r,
          related_npc: relatedNpcs.find(n => n.id === r.related_npc_id)
        })),
        ...incomingRels.map(r => ({
          ...r,
          related_npc: relatedNpcs.find(n => n.id === r.npc_id),
          // Swap IDs for incoming mutual relationships
          npc_id: r.related_npc_id,
          related_npc_id: r.npc_id
        }))
      ];

      return {
        npc: npc as CampaignNPC,
        relationships: relationships as NPCRelationship[]
      };
    },
    enabled: !!npcId && !!campaignId,
  });
}

// Create NPC
export function useCreateNPC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNPCData) => {
      const { data: npc, error } = await supabase
        .from('campaign_npcs')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return npc as CampaignNPC;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-npcs', variables.campaign_id] });
      toast.success('NPC criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating NPC:', error);
      toast.error('Erro ao criar NPC');
    },
  });
}

// Update NPC
export function useUpdateNPC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateNPCData) => {
      const { data: npc, error } = await supabase
        .from('campaign_npcs')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return npc as CampaignNPC;
    },
    onSuccess: (npc) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-npcs', npc.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['npc-details', npc.id] });
      toast.success('NPC atualizado!');
    },
    onError: (error: Error) => {
      console.error('Error updating NPC:', error);
      toast.error('Erro ao atualizar NPC');
    },
  });
}

// Delete NPC
export function useDeleteNPC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
      const { error } = await supabase
        .from('campaign_npcs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, campaignId };
    },
    onSuccess: ({ campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-npcs', campaignId] });
      toast.success('NPC removido!');
    },
    onError: (error: Error) => {
      console.error('Error deleting NPC:', error);
      toast.error('Erro ao remover NPC');
    },
  });
}

// Create relationship
export function useCreateNPCRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRelationshipData) => {
      const { data: rel, error } = await supabase
        .from('campaign_npc_relationships')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return rel as NPCRelationship;
    },
    onSuccess: (rel) => {
      queryClient.invalidateQueries({ queryKey: ['npc-details', rel.npc_id] });
      queryClient.invalidateQueries({ queryKey: ['npc-details', rel.related_npc_id] });
      toast.success('Relacionamento adicionado!');
    },
    onError: (error: Error) => {
      console.error('Error creating relationship:', error);
      toast.error('Erro ao criar relacionamento');
    },
  });
}

// Delete relationship
export function useDeleteNPCRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, npcId, relatedNpcId }: { id: string; npcId: string; relatedNpcId: string }) => {
      const { error } = await supabase
        .from('campaign_npc_relationships')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { npcId, relatedNpcId };
    },
    onSuccess: ({ npcId, relatedNpcId }) => {
      queryClient.invalidateQueries({ queryKey: ['npc-details', npcId] });
      queryClient.invalidateQueries({ queryKey: ['npc-details', relatedNpcId] });
      toast.success('Relacionamento removido!');
    },
    onError: (error: Error) => {
      console.error('Error deleting relationship:', error);
      toast.error('Erro ao remover relacionamento');
    },
  });
}
