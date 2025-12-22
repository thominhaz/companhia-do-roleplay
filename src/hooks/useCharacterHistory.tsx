import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CharacterHistoryEntry {
  id: string;
  character_id: string;
  user_id: string;
  field_name: string;
  field_label: string;
  old_value: string | null;
  new_value: string | null;
  change_type: string;
  created_at: string;
}

export interface ChangeToLog {
  field_name: string;
  field_label: string;
  old_value: any;
  new_value: any;
  change_type?: 'update' | 'create' | 'delete';
}

// Field labels for display
const FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  race: 'Raça',
  class: 'Classe',
  level: 'Nível',
  experience: 'Experiência',
  max_hp: 'HP Máximo',
  current_hp: 'HP Atual',
  temporary_hp: 'HP Temporário',
  armor_class: 'Classe de Armadura',
  initiative: 'Iniciativa',
  speed: 'Velocidade',
  proficiency_bonus: 'Bônus de Proficiência',
  alignment: 'Alinhamento',
  background: 'Antecedente',
  backstory: 'História',
  personality_traits: 'Traços de Personalidade',
  ideals: 'Ideais',
  bonds: 'Vínculos',
  flaws: 'Defeitos',
  attributes: 'Atributos',
  skills: 'Perícias',
  saving_throws: 'Salvaguardas',
  proficiencies: 'Proficiências',
  languages: 'Idiomas',
  features: 'Habilidades',
  spells: 'Magias',
  equipment: 'Equipamento',
  inventory: 'Inventário',
  currency: 'Moedas',
  hit_dice: 'Dados de Vida',
  death_saves: 'Salvaguardas contra Morte',
  spellcasting: 'Conjuração',
  image_url: 'Imagem',
  subrace: 'Sub-raça',
};

export function getFieldLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] || fieldName;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function useCharacterHistory(characterId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['character-history', characterId],
    queryFn: async (): Promise<CharacterHistoryEntry[]> => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('character_history')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching character history:', error);
        return [];
      }

      return (data || []) as CharacterHistoryEntry[];
    },
    enabled: !!characterId && !!user,
  });
}

export function useLogCharacterChanges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      characterId, 
      changes 
    }: { 
      characterId: string; 
      changes: ChangeToLog[] 
    }) => {
      if (!user || changes.length === 0) return;

      const historyEntries = changes.map(change => ({
        character_id: characterId,
        user_id: user.id,
        field_name: change.field_name,
        field_label: getFieldLabel(change.field_name),
        old_value: formatValue(change.old_value),
        new_value: formatValue(change.new_value),
        change_type: change.change_type || 'update',
      }));

      const { error } = await supabase
        .from('character_history')
        .insert(historyEntries);

      if (error) {
        console.error('Error logging character changes:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['character-history', variables.characterId] 
      });
    },
  });
}

// Helper to detect changes between two objects
export function detectChanges(
  oldData: Record<string, any>, 
  newData: Record<string, any>,
  fieldsToTrack?: string[]
): ChangeToLog[] {
  const changes: ChangeToLog[] = [];
  const fields = fieldsToTrack || Object.keys(newData);

  for (const field of fields) {
    const oldValue = oldData[field];
    const newValue = newData[field];
    
    // Compare values (handle objects by JSON stringify)
    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);
    
    if (oldStr !== newStr) {
      changes.push({
        field_name: field,
        field_label: getFieldLabel(field),
        old_value: oldValue,
        new_value: newValue,
        change_type: 'update',
      });
    }
  }

  return changes;
}
