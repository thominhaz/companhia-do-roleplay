import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { detectChanges, getFieldLabel } from './useCharacterHistory';

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
  is_archived: boolean;
  conditions: string[];
  // Physical appearance fields
  age: string | null;
  height: string | null;
  weight: string | null;
  eyes: string | null;
  hair: string | null;
  skin: string | null;
  distinctive_features: string | null;
  goals: string | null;
  allies_organizations: string | null;
  builder_data: BuilderData | null;
  level_choices: LevelChoice[] | null;
  created_at: string;
  updated_at: string;
}

// Builder types
export interface BuilderData {
  race_id?: string;
  subrace_id?: string;
  class_id?: string;
  attribute_method?: 'point_buy' | 'standard_array' | 'rolled';
  base_attributes?: Record<string, number>;
  ability_bonus_choices?: string[];
  background_id?: string;
  alignment?: string;
  equipment_choices?: Record<number, number>;
  equipment_category_selections?: Record<string, string>;
  variant_human_feat?: string;
  variant_human_skill?: string;
  custom_background?: {
    name: string;
    skills: string[];
    proficiencies: string[];
    feature: string;
  };
}

export interface LevelChoice {
  level: number;
  class_id: string;                       // MULTICLASS-READY
  hp_roll: number;
  used_average: boolean;
  subclass_id?: string;
  selected_skills?: string[];
  selected_feat?: string;
  feat_attribute?: string;
  attribute_improvements?: Record<string, number>;
  improvement_choice?: 'feat' | 'attributes';
  feature_options?: Record<string, string>;
  extra_languages?: string[];
  extra_cantrips?: string[];
  extra_spells?: string[];
  multiclass_proficiencies?: string[];    // MULTICLASS-READY
}

export type CharacterInsert = Omit<CharacterDB, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_archived' | 'builder_data' | 'level_choices'> & {
  builder_data?: BuilderData | null;
  level_choices?: LevelChoice[] | null;
};

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
      return data as unknown as CharacterDB[];
    },
    enabled: !!user,
  });
}

export function useCharacter(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      if (!user || !id) return null;

      // Try to fetch as owner first
      const { data: ownData, error: ownError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (ownData) return ownData as unknown as CharacterDB;

      // If not found as owner, try to fetch as campaign member (read-only view)
      const { data: memberData, error: memberError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (memberError) {
        console.error('Error fetching character:', memberError);
        return null;
      }

      return memberData as unknown as CharacterDB | null;
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
      return data as unknown as CharacterDB;
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CharacterDB> & { id: string }) => {
      // Get current character data for comparison
      const { data: currentChar } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log changes if user is authenticated and we have previous data
      if (user && currentChar) {
        const fieldsToTrack = Object.keys(updates);
        const changes = detectChanges(currentChar, updates, fieldsToTrack);
        
        if (changes.length > 0) {
          const historyEntries = changes.map(change => ({
            character_id: id,
            user_id: user.id,
            field_name: change.field_name,
            field_label: getFieldLabel(change.field_name),
            old_value: typeof change.old_value === 'object' 
              ? JSON.stringify(change.old_value) 
              : String(change.old_value ?? ''),
            new_value: typeof change.new_value === 'object' 
              ? JSON.stringify(change.new_value) 
              : String(change.new_value ?? ''),
            change_type: 'update',
          }));

          // Insert history in background (don't block the update)
          supabase
            .from('character_history')
            .insert(historyEntries)
            .then(({ error: historyError }) => {
              if (historyError) {
                console.error('Error logging character history:', historyError);
              }
            });
        }
      }

      return data as CharacterDB;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['character', data.id] });
      queryClient.invalidateQueries({ queryKey: ['character-history', data.id] });
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

export function useArchiveCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { data, error } = await supabase
        .from('characters')
        .update({ is_archived: archive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CharacterDB;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['character', data.id] });
      toast.success(data.is_archived ? 'Personagem arquivado' : 'Personagem restaurado');
    },
    onError: () => {
      toast.error('Erro ao arquivar personagem');
    },
  });
}
