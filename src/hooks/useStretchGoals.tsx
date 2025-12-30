import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StretchGoal {
  id: string;
  goal_number: number;
  value: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  phase: string;
  phase_emoji: string | null;
  phase_order: number | null;
  status: "completed" | "current" | "pending";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignFunding {
  id: string;
  current_amount: number;
  goal_amount: number;
  updated_at: string;
}

export function useStretchGoals() {
  return useQuery({
    queryKey: ["stretch-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stretch_goals")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as StretchGoal[];
    },
  });
}

export function useCampaignFunding() {
  return useQuery({
    queryKey: ["campaign-funding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_funding")
        .select("*")
        .single();

      if (error) throw error;
      return data as CampaignFunding;
    },
  });
}

export function useUpdateStretchGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: Partial<StretchGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from("stretch_goals")
        .update(goal)
        .eq("id", goal.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stretch-goals"] });
      toast.success("Meta atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar meta: " + error.message);
    },
  });
}

export function useCreateStretchGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: Omit<StretchGoal, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("stretch_goals")
        .insert(goal)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stretch-goals"] });
      toast.success("Meta criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar meta: " + error.message);
    },
  });
}

export function useDeleteStretchGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("stretch_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stretch-goals"] });
      toast.success("Meta excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir meta: " + error.message);
    },
  });
}

export function useUpdateCampaignFunding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (funding: Partial<CampaignFunding> & { id: string }) => {
      const { data, error } = await supabase
        .from("campaign_funding")
        .update(funding)
        .eq("id", funding.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-funding"] });
      toast.success("Financiamento atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar financiamento: " + error.message);
    },
  });
}
