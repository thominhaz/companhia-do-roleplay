import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CharacterDB {
  id: string;
  user_id: string;
  name: string;
  race: string;
  subrace: string | null;
  class: string;
  level: number;
  experience: number;
  max_hp: number;
  current_hp: number;
  temporary_hp: number;
  armor_class: number;
  initiative: number;
  speed: number;
  proficiency_bonus: number;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  saving_throws: Record<string, any>;
  skills: Record<string, any>;
  hit_dice: { total: number; current: number; diceType: string };
  death_saves: { successes: number; failures: number };
  equipment: any[];
  inventory: any[];
  currency: { copper: number; silver: number; electrum: number; gold: number; platinum: number };
  spellcasting: any | null;
  spells: any[];
  background: string | null;
  alignment: string | null;
  personality_traits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  backstory: string | null;
  features: any[];
  proficiencies: any[];
  languages: string[];
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type CharacterInsert = Omit<CharacterDB, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useCharacters() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['characters', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as CharacterDB[];
    },
    enabled: !!user,
  });
}

export function useCharacter(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as CharacterDB;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateCharacter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (character: CharacterInsert) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('characters')
        .insert({
          ...character,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('row-level security')) {
          throw new Error('Limite de personagens atingido. Faça upgrade para Premium!');
        }
        throw error;
      }
      return data as CharacterDB;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['characterCount'] });
      toast.success('Personagem criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CharacterDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CharacterDB;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['character', data.id] });
      toast.success('Personagem atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar personagem');
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['characterCount'] });
      toast.success('Personagem removido');
    },
    onError: () => {
      toast.error('Erro ao remover personagem');
    },
  });
}
