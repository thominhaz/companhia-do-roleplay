import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Faction {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  alignment: string | null;
  influence_level: string | null;
  headquarters: string | null;
  goals: string | null;
  secrets: string | null;
  is_hidden: boolean;
  show_reputation_to_players: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface FactionNPC {
  id: string;
  faction_id: string;
  npc_id: string;
  role: string | null;
  rank: string | null;
  is_leader: boolean;
  created_at: string;
  npc?: {
    id: string;
    name: string;
    title: string | null;
    image_url: string | null;
    status: string;
  };
}

export interface FactionRelationship {
  id: string;
  campaign_id: string;
  faction_id: string;
  related_faction_id: string;
  relationship_type: string;
  description: string | null;
  is_mutual: boolean;
  created_at: string;
  related_faction?: Faction;
}

export interface CharacterFactionRep {
  id: string;
  campaign_id: string;
  character_id: string;
  faction_id: string;
  reputation_level: number;
  reputation_title: string | null;
  notes: string | null;
  updated_at: string;
  created_at: string;
  character?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

export interface FactionEvent {
  id: string;
  campaign_id: string;
  faction_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  reputation_change: number;
  created_at: string;
  created_by: string;
}

export function useFactions(campaignId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: factions = [], isLoading } = useQuery({
    queryKey: ["campaign-factions", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from("campaign_factions")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("name");
      
      if (error) throw error;
      return data as Faction[];
    },
    enabled: !!campaignId,
  });

  const createFaction = useMutation({
    mutationFn: async (faction: Partial<Faction>) => {
      const { data, error } = await supabase
        .from("campaign_factions")
        .insert({
          campaign_id: campaignId,
          name: faction.name!,
          description: faction.description,
          image_url: faction.image_url,
          alignment: faction.alignment,
          influence_level: faction.influence_level,
          headquarters: faction.headquarters,
          goals: faction.goals,
          secrets: faction.secrets,
          is_hidden: faction.is_hidden ?? false,
          tags: faction.tags ?? [],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-factions", campaignId] });
      toast({ title: "Facção criada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar facção", description: error.message, variant: "destructive" });
    },
  });

  const updateFaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Faction> & { id: string }) => {
      const { data, error } = await supabase
        .from("campaign_factions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-factions", campaignId] });
      toast({ title: "Facção atualizada!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteFaction = useMutation({
    mutationFn: async (factionId: string) => {
      const { error } = await supabase
        .from("campaign_factions")
        .delete()
        .eq("id", factionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-factions", campaignId] });
      toast({ title: "Facção excluída!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  return {
    factions,
    isLoading,
    createFaction,
    updateFaction,
    deleteFaction,
  };
}

export function useFactionNPCs(factionId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: factionNPCs = [], isLoading } = useQuery({
    queryKey: ["faction-npcs", factionId],
    queryFn: async () => {
      if (!factionId) return [];
      const { data, error } = await supabase
        .from("campaign_faction_npcs")
        .select(`
          *,
          npc:campaign_npcs(id, name, title, image_url, status)
        `)
        .eq("faction_id", factionId);
      
      if (error) throw error;
      return data as FactionNPC[];
    },
    enabled: !!factionId,
  });

  const linkNPC = useMutation({
    mutationFn: async (params: { npc_id: string; role?: string; rank?: string; is_leader?: boolean }) => {
      const { data, error } = await supabase
        .from("campaign_faction_npcs")
        .insert({
          faction_id: factionId,
          npc_id: params.npc_id,
          role: params.role,
          rank: params.rank,
          is_leader: params.is_leader ?? false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faction-npcs", factionId] });
      toast({ title: "NPC vinculado à facção!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao vincular NPC", description: error.message, variant: "destructive" });
    },
  });

  const unlinkNPC = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("campaign_faction_npcs")
        .delete()
        .eq("id", linkId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faction-npcs", factionId] });
      toast({ title: "NPC removido da facção!" });
    },
  });

  return {
    factionNPCs,
    isLoading,
    linkNPC,
    unlinkNPC,
  };
}

export function useFactionRelationships(campaignId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ["faction-relationships", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from("campaign_faction_relationships")
        .select(`
          *,
          related_faction:campaign_factions!campaign_faction_relationships_related_faction_id_fkey(*)
        `)
        .eq("campaign_id", campaignId);
      
      if (error) throw error;
      return data as FactionRelationship[];
    },
    enabled: !!campaignId,
  });

  const createRelationship = useMutation({
    mutationFn: async (params: {
      faction_id: string;
      related_faction_id: string;
      relationship_type: string;
      description?: string;
      is_mutual?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("campaign_faction_relationships")
        .insert({
          campaign_id: campaignId,
          ...params,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faction-relationships", campaignId] });
      toast({ title: "Relacionamento criado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteRelationship = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("campaign_faction_relationships")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faction-relationships", campaignId] });
      toast({ title: "Relacionamento removido!" });
    },
  });

  return {
    relationships,
    isLoading,
    createRelationship,
    deleteRelationship,
  };
}

export function useCharacterFactionRep(campaignId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reputations = [], isLoading } = useQuery({
    queryKey: ["character-faction-rep", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from("campaign_character_faction_rep")
        .select(`
          *,
          character:characters(id, name, image_url)
        `)
        .eq("campaign_id", campaignId);
      
      if (error) throw error;
      return data as CharacterFactionRep[];
    },
    enabled: !!campaignId,
  });

  const upsertReputation = useMutation({
    mutationFn: async (params: {
      character_id: string;
      faction_id: string;
      reputation_level: number;
      reputation_title?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("campaign_character_faction_rep")
        .upsert({
          campaign_id: campaignId,
          character_id: params.character_id,
          faction_id: params.faction_id,
          reputation_level: params.reputation_level,
          reputation_title: params.reputation_title,
          notes: params.notes,
        }, { onConflict: 'character_id,faction_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character-faction-rep", campaignId] });
      toast({ title: "Reputação atualizada!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  return {
    reputations,
    isLoading,
    upsertReputation,
  };
}

export function useFactionEvents(campaignId: string | undefined, factionId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["faction-events", campaignId, factionId],
    queryFn: async () => {
      if (!campaignId) return [];
      let query = supabase
        .from("campaign_faction_events")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });
      
      if (factionId) {
        query = query.eq("faction_id", factionId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as FactionEvent[];
    },
    enabled: !!campaignId,
  });

  const createEventAndApply = useMutation({
    mutationFn: async (params: {
      faction_id: string;
      title: string;
      description?: string;
      event_date?: string;
      reputation_change: number;
      character_ids: string[];
      created_by: string;
    }) => {
      // Create the event
      const { data: event, error: eventError } = await supabase
        .from("campaign_faction_events")
        .insert({
          campaign_id: campaignId,
          faction_id: params.faction_id,
          title: params.title,
          description: params.description,
          event_date: params.event_date,
          reputation_change: params.reputation_change,
          created_by: params.created_by,
        })
        .select()
        .single();
      
      if (eventError) throw eventError;

      // Apply reputation change to all characters
      for (const charId of params.character_ids) {
        // Get current reputation
        const { data: existing } = await supabase
          .from("campaign_character_faction_rep")
          .select("*")
          .eq("character_id", charId)
          .eq("faction_id", params.faction_id)
          .single();

        const currentLevel = existing?.reputation_level || 0;
        const newLevel = Math.max(-100, Math.min(100, currentLevel + params.reputation_change));
        
        // Calculate reputation title
        let title = "Neutro";
        if (newLevel <= -51) title = "Odiado";
        else if (newLevel <= -26) title = "Hostil";
        else if (newLevel <= -1) title = "Desconfiado";
        else if (newLevel === 0) title = "Neutro";
        else if (newLevel <= 25) title = "Amigável";
        else if (newLevel <= 50) title = "Respeitado";
        else title = "Venerado";

        await supabase
          .from("campaign_character_faction_rep")
          .upsert({
            campaign_id: campaignId,
            character_id: charId,
            faction_id: params.faction_id,
            reputation_level: newLevel,
            reputation_title: title,
          }, { onConflict: 'character_id,faction_id' });
      }

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faction-events", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["character-faction-rep", campaignId] });
      toast({ title: "Evento criado e reputações atualizadas!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const revertEvent = useMutation({
    mutationFn: async (event: FactionEvent) => {
      // Get all character reputations for this faction
      const { data: reps, error: repsError } = await supabase
        .from("campaign_character_faction_rep")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("faction_id", event.faction_id);
      
      if (repsError) throw repsError;

      // Apply the opposite reputation change to each character
      for (const rep of reps || []) {
        const newLevel = Math.max(-100, Math.min(100, rep.reputation_level - event.reputation_change));
        
        // Calculate new reputation title
        let title = "Neutro";
        if (newLevel <= -51) title = "Odiado";
        else if (newLevel <= -26) title = "Hostil";
        else if (newLevel <= -1) title = "Desconfiado";
        else if (newLevel === 0) title = "Neutro";
        else if (newLevel <= 25) title = "Amigável";
        else if (newLevel <= 50) title = "Respeitado";
        else title = "Venerado";

        await supabase
          .from("campaign_character_faction_rep")
          .update({
            reputation_level: newLevel,
            reputation_title: title,
          })
          .eq("id", rep.id);
      }

      // Delete the event
      const { error } = await supabase
        .from("campaign_faction_events")
        .delete()
        .eq("id", event.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faction-events", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["character-faction-rep", campaignId] });
      toast({ title: "Evento revertido e reputações restauradas!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao reverter", description: error.message, variant: "destructive" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("campaign_faction_events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faction-events", campaignId] });
      toast({ title: "Evento removido (sem reverter reputação)!" });
    },
  });

  return {
    events,
    isLoading,
    createEventAndApply,
    revertEvent,
    deleteEvent,
  };
}
