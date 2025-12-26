import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TimelineEvent {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  event_date: string;
  icon: string;
  color: string;
  image_url: string | null;
  is_major_event: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useTimeline(campaignId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["timeline-events", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from("campaign_timeline_events")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as TimelineEvent[];
    },
    enabled: !!campaignId,
  });

  const createEvent = useMutation({
    mutationFn: async (event: Partial<TimelineEvent> & { created_by: string }) => {
      const maxOrder = events.length > 0 ? Math.max(...events.map(e => e.sort_order)) + 1 : 0;
      
      const { data, error } = await supabase
        .from("campaign_timeline_events")
        .insert({
          campaign_id: campaignId,
          title: event.title!,
          description: event.description,
          event_date: event.event_date!,
          icon: event.icon || "calendar",
          color: event.color || "primary",
          image_url: event.image_url,
          is_major_event: event.is_major_event ?? false,
          sort_order: maxOrder,
          created_by: event.created_by,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-events", campaignId] });
      toast({ title: "Evento adicionado à timeline!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar evento", description: error.message, variant: "destructive" });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimelineEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("campaign_timeline_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-events", campaignId] });
      toast({ title: "Evento atualizado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("campaign_timeline_events")
        .delete()
        .eq("id", eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-events", campaignId] });
      toast({ title: "Evento removido!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const reorderEvents = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("campaign_timeline_events")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-events", campaignId] });
    },
  });

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    reorderEvents,
  };
}
