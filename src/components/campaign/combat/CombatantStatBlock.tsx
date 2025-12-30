import { useState, useEffect } from "react";
import { Combatant, useUpdateCombatant } from "@/hooks/useCombat";
import { supabase } from "@/integrations/supabase/client";
import { getModifier } from "@/data/srd";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HomebrewMonsterData, MonsterAction } from "@/types";
import { PlayerCharacterSheet } from "../dashboard/PlayerCharacterSheet";
import {
  Heart,
  Shield,
  Zap,
  User,
  Skull,
  Sword,
  Footprints,
  Eye,
  X,
  BookOpen,
  Swords,
  FlameKindling,
  ShieldOff,
  Languages,
  Target,
  Pencil,
  Check,
  Minus,
  Plus,
  FileText
} from "lucide-react";
import { escapePostgrestLikePattern } from "@/lib/postgrestUtils";

interface CombatantStatBlockProps {
  combatant: Combatant | null;
  campaignId: string;
  onClose: () => void;
  onRollDice?: (expression: string, label: string) => void;
}

interface CharacterData {
  id: string;
  name: string;
  class: string;
  race: string;
  level: number;
  current_hp: number;
  max_hp: number;
  temporary_hp: number;
  armor_class: number;
  speed: number;
  initiative: number;
  attributes: Record<string, number>;
  conditions: string[];
  proficiency_bonus: number;
  image_url?: string;
}

interface HomebrewMonster {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  data: HomebrewMonsterData;
}

const ATTR_NAMES: Record<string, string> = {
  strength: 'FOR',
  dexterity: 'DES',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'SAB',
  charisma: 'CAR'
};

const CONDITIONS = [
  { name: "Agarrado", icon: "🪢", color: "bg-orange-500/20 text-orange-400" },
  { name: "Amedrontado", icon: "😨", color: "bg-purple-500/20 text-purple-400" },
  { name: "Atordoado", icon: "💫", color: "bg-yellow-500/20 text-yellow-400" },
  { name: "Caído", icon: "⬇️", color: "bg-gray-500/20 text-gray-400" },
  { name: "Cego", icon: "👁️", color: "bg-slate-500/20 text-slate-400" },
  { name: "Encantado", icon: "💕", color: "bg-pink-500/20 text-pink-400" },
  { name: "Envenenado", icon: "☠️", color: "bg-green-500/20 text-green-400" },
  { name: "Exausto", icon: "😫", color: "bg-amber-500/20 text-amber-400" },
  { name: "Incapacitado", icon: "🚫", color: "bg-red-500/20 text-red-400" },
  { name: "Inconsciente", icon: "💤", color: "bg-indigo-500/20 text-indigo-400" },
  { name: "Invisível", icon: "👻", color: "bg-cyan-500/20 text-cyan-400" },
  { name: "Paralisado", icon: "🧊", color: "bg-blue-500/20 text-blue-400" },
  { name: "Petrificado", icon: "🗿", color: "bg-stone-500/20 text-stone-400" },
  { name: "Surdo", icon: "🔇", color: "bg-rose-500/20 text-rose-400" },
];

export function CombatantStatBlock({ 
  combatant, 
  campaignId, 
  onClose,
  onRollDice
}: CombatantStatBlockProps) {
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [homebrewMonster, setHomebrewMonster] = useState<HomebrewMonster | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'actions'>('stats');
  const [isEditingHp, setIsEditingHp] = useState(false);
  const [hpValue, setHpValue] = useState("");
  const [showFullSheet, setShowFullSheet] = useState(false);
  const updateCombatant = useUpdateCombatant();

  // Fetch character data if combatant has character_id
  useEffect(() => {
    if (!combatant?.character_id) {
      setCharacterData(null);
      return;
    }

    const fetchCharacter = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('id', combatant.character_id)
          .single();

        if (error) throw error;
        setCharacterData(data as CharacterData);
      } catch (error) {
        console.error('Error fetching character:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [combatant?.character_id]);

  // Fetch Homebrew Monster data
  useEffect(() => {
    if (!combatant || combatant.is_player || combatant.character_id) {
      setHomebrewMonster(null);
      return;
    }

    const fetchMonsterData = async () => {
      setLoading(true);
      try {
        const cleanName = combatant.name.replace(/^[^\w\s]+\s*/, '').trim();
        
        // Escape special characters to prevent SQL injection
        const escapedCleanName = escapePostgrestLikePattern(cleanName);
        const escapedCombatantName = escapePostgrestLikePattern(combatant.name);
        
        const { data: homebrew } = await supabase
          .from('homebrew_content')
          .select('*')
          .eq('type', 'monster')
          .or(`name.ilike.%${escapedCleanName}%,name.ilike.%${escapedCombatantName}%`)
          .maybeSingle();

        if (homebrew) {
          setHomebrewMonster({
            id: homebrew.id,
            name: homebrew.name,
            description: homebrew.description,
            icon: homebrew.icon || '👹',
            data: homebrew.data as HomebrewMonsterData
          });
        }
      } catch (error) {
        console.error('Error fetching monster data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonsterData();
  }, [combatant, campaignId]);

  if (!combatant) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
        <Target className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-sm">Selecione um combatente para ver os detalhes</p>
      </div>
    );
  }

  const hpPercent = Math.max(0, Math.min(100, (combatant.current_hp / combatant.max_hp) * 100));
  const isDead = combatant.current_hp === 0;

  const getHpColor = () => {
    if (isDead) return "bg-gray-500";
    if (hpPercent <= 25) return "bg-red-500";
    if (hpPercent <= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const startEditHp = () => {
    setHpValue(combatant.current_hp.toString());
    setIsEditingHp(true);
  };

  const saveHp = () => {
    const newHp = parseInt(hpValue);
    if (!isNaN(newHp) && newHp >= 0 && newHp <= combatant.max_hp) {
      updateCombatant.mutate({
        id: combatant.id,
        encounterId: combatant.encounter_id,
        current_hp: newHp,
        syncToCharacter: combatant.is_player
      });
    }
    setIsEditingHp(false);
  };

  const adjustHp = (delta: number) => {
    const newHp = Math.max(0, Math.min(combatant.max_hp, combatant.current_hp + delta));
    updateCombatant.mutate({
      id: combatant.id,
      encounterId: combatant.encounter_id,
      current_hp: newHp,
      syncToCharacter: combatant.is_player
    });
  };

  const HpQuickEdit = () => (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => adjustHp(-1)}
      >
        <Minus className="w-3 h-3" />
      </Button>
      {isEditingHp ? (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={hpValue}
            onChange={(e) => setHpValue(e.target.value)}
            className="w-14 h-6 text-xs text-center"
            min={0}
            max={combatant.max_hp}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveHp();
              if (e.key === 'Escape') setIsEditingHp(false);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-500"
            onClick={saveHp}
          >
            <Check className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={startEditHp}
        >
          <Pencil className="w-3 h-3 mr-1" />
          Editar
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => adjustHp(1)}
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );

  const renderMonsterAction = (action: MonsterAction, index: number) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-muted/30 rounded-lg p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <Sword className="w-3 h-3 text-red-500" />
          {action.name}
        </h4>
        {action.attack_bonus !== undefined && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRollDice?.(`1d20+${action.attack_bonus}`, `${action.name} (Ataque)`)}
            className="h-6 text-xs px-2"
          >
            +{action.attack_bonus}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{action.description}</p>
      {action.damage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRollDice?.(action.damage!, `${action.name} (Dano)`)}
          className="h-6 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400"
        >
          🎲 {action.damage} {action.damage_type && `(${action.damage_type})`}
        </Button>
      )}
    </motion.div>
  );

  // Monster or NPC stat block (D&D Beyond style)
  if (homebrewMonster) {
    const data = homebrewMonster.data;
    const attributes = data.attributes || {};

    return (
      <div className="h-full flex flex-col bg-card border-l border-border">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-red-900/20 to-orange-900/20">
          <div>
            <h2 className="text-xl font-bold font-serif tracking-wide uppercase text-red-400">
              {homebrewMonster.name}
            </h2>
            <p className="text-xs text-muted-foreground italic">
              {data.size} {data.type}, {data.alignment}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-red-500 via-red-300 to-red-500" />

            {/* Basic Stats */}
            <div className="space-y-1 text-sm">
              <p><span className="font-bold text-red-400">Classe de Armadura</span> {combatant.armor_class}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-red-400">Pontos de Vida</span> 
                <span>{combatant.current_hp} / {combatant.max_hp}</span>
                {data.hit_points && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRollDice?.(data.hit_points!, 'Pontos de Vida')}
                    className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ({data.hit_points})
                  </Button>
                )}
                <HpQuickEdit />
              </div>
              <p><span className="font-bold text-red-400">Deslocamento</span> {data.speed}</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-red-500 via-red-300 to-red-500" />

            {/* Attributes - D&D Beyond style */}
            <div className="grid grid-cols-6 gap-1 text-center">
              {Object.entries(ATTR_NAMES).map(([key, abbr]) => {
                const value = attributes[key as keyof typeof attributes] || 10;
                const modifier = getModifier(value);
                return (
                  <div 
                    key={key}
                    className="cursor-pointer hover:bg-muted/50 rounded p-1 transition-colors"
                    onClick={() => onRollDice?.(`1d20${modifier >= 0 ? '+' : ''}${modifier}`, `Teste de ${abbr}`)}
                  >
                    <div className="text-xs font-bold text-red-400">{abbr}</div>
                    <div className="text-sm">{value}</div>
                    <div className={cn("text-xs", modifier >= 0 ? "text-muted-foreground" : "text-red-400")}>
                      ({modifier >= 0 ? '+' : ''}{modifier})
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-red-500 via-red-300 to-red-500" />

            {/* Saving Throws, Skills, etc. */}
            <div className="space-y-1 text-sm">
              {data.saving_throws && Object.keys(data.saving_throws).length > 0 && (
                <p>
                  <span className="font-bold text-red-400">Salvaguardas</span>{' '}
                  {Object.entries(data.saving_throws).map(([ability, value], i) => {
                    const abbr = ATTR_NAMES[ability] || ability.toUpperCase().substring(0, 3);
                    const bonus = typeof value === 'number' ? value : 0;
                    return (
                      <span key={ability}>
                        {i > 0 && ', '}
                        <Button
                          variant="link"
                          className="h-auto p-0 text-sm"
                          onClick={() => onRollDice?.(`1d20+${bonus}`, `Salvaguarda de ${abbr}`)}
                        >
                          {abbr} +{bonus}
                        </Button>
                      </span>
                    );
                  })}
                </p>
              )}
              {data.skills && typeof data.skills === 'object' && Object.keys(data.skills).length > 0 && (
                <p>
                  <span className="font-bold text-red-400">Perícias</span>{' '}
                  {Object.entries(data.skills as Record<string, number>).map(([skill, bonus], i) => (
                    <span key={skill}>
                      {i > 0 && ', '}
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm"
                        onClick={() => onRollDice?.(`1d20+${bonus}`, skill)}
                      >
                        {skill} +{bonus}
                      </Button>
                    </span>
                  ))}
                </p>
              )}
              {data.damage_resistances && data.damage_resistances.length > 0 && (
                <p><span className="font-bold text-red-400">Resistências</span> {data.damage_resistances.join(', ')}</p>
              )}
              {data.damage_immunities && data.damage_immunities.length > 0 && (
                <p><span className="font-bold text-red-400">Imunidades</span> {data.damage_immunities.join(', ')}</p>
              )}
              {data.senses && (
                <p><span className="font-bold text-red-400">Sentidos</span> {data.senses}</p>
              )}
              {data.languages && (
                <p><span className="font-bold text-red-400">Idiomas</span> {data.languages}</p>
              )}
              <p>
                <span className="font-bold text-red-400">Nível de Desafio</span> {data.challenge_rating}
                {data.xp && ` (${data.xp} XP)`}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-red-500 via-red-300 to-red-500" />

            {/* Traits */}
            {data.traits && Array.isArray(data.traits) && data.traits.length > 0 && (
              <div className="space-y-3">
                {(data.traits as Array<{ name: string; description: string }>).map((trait, i) => (
                  <div key={i}>
                    <p className="text-sm">
                      <span className="font-bold italic">{trait.name}.</span>{' '}
                      {trait.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {data.actions && data.actions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-red-400 border-b border-red-500/30 pb-1">Ações</h3>
                {data.actions.map((action, i) => renderMonsterAction(action, i))}
              </div>
            )}

            {/* Reactions */}
            {data.reactions && data.reactions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-orange-400 border-b border-orange-500/30 pb-1">Reações</h3>
                {data.reactions.map((action, i) => renderMonsterAction(action, i))}
              </div>
            )}

            {/* Legendary Actions */}
            {data.legendary_actions && data.legendary_actions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-yellow-400 border-b border-yellow-500/30 pb-1">Ações Lendárias</h3>
                {data.legendary_actions.map((action, i) => renderMonsterAction(action, i))}
              </div>
            )}

            {/* Conditions */}
            {combatant.conditions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Condições Ativas</h4>
                <div className="flex flex-wrap gap-1">
                  {combatant.conditions.map((condition) => {
                    const condData = CONDITIONS.find(c => c.name === condition);
                    return (
                      <Badge key={condition} className={cn("text-xs", condData?.color || "bg-muted")}>
                        {condData?.icon} {condition}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Player character stat block
  if (characterData) {
    const attributes = characterData.attributes as Record<string, number>;

    return (
      <>
        <div className="h-full flex flex-col bg-card border-l border-border">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-blue-900/20 to-cyan-900/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden border-2 border-blue-500/50 bg-blue-500/20">
                {characterData.image_url ? (
                  <img src={characterData.image_url} alt={characterData.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-blue-400" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold">{characterData.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {characterData.race} • {characterData.class} Nv {characterData.level}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* View Full Sheet Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setShowFullSheet(true)}
              >
                <FileText className="w-4 h-4" />
                Ver Ficha Completa
              </Button>

              {/* Combat Stats Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Heart className="w-5 h-5 mx-auto mb-1 text-red-500" />
                  <div className="text-lg font-bold">{combatant.current_hp}/{combatant.max_hp}</div>
                  <div className="text-[10px] text-muted-foreground">HP</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Shield className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold">{combatant.armor_class}</div>
                  <div className="text-[10px] text-muted-foreground">CA</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                  <div className="text-lg font-bold">{combatant.initiative}</div>
                  <div className="text-[10px] text-muted-foreground">Init</div>
                </div>
              </div>

              {/* HP Quick Edit */}
              <div className="flex items-center justify-center">
                <HpQuickEdit />
              </div>

              {/* Attributes */}
              <div className="grid grid-cols-6 gap-1 text-center">
                {Object.entries(ATTR_NAMES).map(([key, abbr]) => {
                  const value = attributes[key] || 10;
                  const modifier = getModifier(value);
                  return (
                    <div 
                      key={key}
                      className="cursor-pointer hover:bg-muted/50 rounded p-2 transition-colors"
                      onClick={() => onRollDice?.(`1d20${modifier >= 0 ? '+' : ''}${modifier}`, `Teste de ${abbr}`)}
                    >
                      <div className="text-xs font-bold text-blue-400">{abbr}</div>
                      <div className="text-sm font-bold">{value}</div>
                      <div className={cn("text-xs", modifier >= 0 ? "text-green-500" : "text-red-500")}>
                        {modifier >= 0 ? '+' : ''}{modifier}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conditions */}
              {combatant.conditions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Condições Ativas</h4>
                  <div className="flex flex-wrap gap-1">
                    {combatant.conditions.map((condition) => {
                      const condData = CONDITIONS.find(c => c.name === condition);
                      return (
                        <Badge key={condition} className={cn("text-xs", condData?.color || "bg-muted")}>
                          {condData?.icon} {condition}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Full Character Sheet Modal */}
        <PlayerCharacterSheet
          characterId={combatant.character_id || ''}
          open={showFullSheet}
          onOpenChange={setShowFullSheet}
        />
      </>
    );
  }

  // Generic combatant (no detailed data)
  return (
    <div className="h-full flex flex-col bg-card border-l border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
            combatant.is_player ? "bg-blue-500/20" : "bg-red-500/20"
          )}>
            {combatant.is_player ? (
              <User className="w-6 h-6 text-blue-400" />
            ) : (
              <Skull className="w-6 h-6 text-red-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold truncate">{combatant.name}</h2>
            <p className="text-xs text-muted-foreground">
              {combatant.is_player ? 'Jogador' : 'Monstro/NPC'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 flex-shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Combat Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Heart className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <div className="text-lg font-bold">{combatant.current_hp}/{combatant.max_hp}</div>
              <div className="text-[10px] text-muted-foreground">HP</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Shield className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <div className="text-lg font-bold">{combatant.armor_class}</div>
              <div className="text-[10px] text-muted-foreground">CA</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <div className="text-lg font-bold">{combatant.initiative}</div>
              <div className="text-[10px] text-muted-foreground">Init</div>
            </div>
          </div>

          {/* HP Bar */}
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={getHpColor()}
                initial={false}
                animate={{ width: `${hpPercent}%` }}
                transition={{ type: "spring", stiffness: 100 }}
                style={{ height: '100%' }}
              />
            </div>
            {/* HP Quick Edit */}
            <div className="flex items-center justify-center">
              <HpQuickEdit />
            </div>
          </div>

          {/* Conditions */}
          {combatant.conditions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Condições Ativas</h4>
              <div className="flex flex-wrap gap-1">
                {combatant.conditions.map((condition) => {
                  const condData = CONDITIONS.find(c => c.name === condition);
                  return (
                    <Badge key={condition} className={cn("text-xs", condData?.color || "bg-muted")}>
                      {condData?.icon} {condition}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
