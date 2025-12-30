import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Combatant } from "@/hooks/useCombat";
import { CampaignNPC, useNPCWithRelationships } from "@/hooks/useNPCs";
import { getModifier } from "@/data/srd";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { HomebrewMonsterData, MonsterAction } from "@/types";
import {
  Heart,
  Shield,
  Zap,
  User,
  Skull,
  Sword,
  Sparkles,
  MapPin,
  Briefcase,
  Eye,
  X,
  Footprints,
  Target,
  Loader2,
  Swords,
  BookOpen,
  FlameKindling,
  ShieldOff,
  Languages
} from "lucide-react";
import { escapePostgrestLikePattern } from "@/lib/postgrestUtils";

interface CombatantDetailSheetProps {
  combatant: Combatant | null;
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CombatantDetailSheet({ 
  combatant, 
  campaignId, 
  open, 
  onOpenChange,
  onRollDice
}: CombatantDetailSheetProps) {
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [npcData, setNpcData] = useState<CampaignNPC | null>(null);
  const [homebrewMonster, setHomebrewMonster] = useState<HomebrewMonster | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'actions'>('stats');

  // Fetch NPC data if combatant is NPC
  const { data: npcDetails } = useNPCWithRelationships(
    !combatant?.is_player && !combatant?.character_id ? combatant?.id || '' : '',
    campaignId
  );

  // Fetch character data if combatant has character_id
  useEffect(() => {
    if (!combatant?.character_id || !open) {
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
  }, [combatant?.character_id, open]);

  // Fetch NPC or Homebrew Monster data
  useEffect(() => {
    if (!combatant || combatant.is_player || combatant.character_id || !open) {
      setNpcData(null);
      setHomebrewMonster(null);
      return;
    }

    const fetchMonsterData = async () => {
      setLoading(true);
      try {
        // Try to find homebrew monster by name (strip emoji prefix if present)
        const cleanName = combatant.name.replace(/^[^\w\s]+\s*/, '').trim();
        
        // Escape special characters to prevent SQL injection
        const escapedCleanName = escapePostgrestLikePattern(cleanName);
        const escapedCombatantName = escapePostgrestLikePattern(combatant.name);
        
        // First try homebrew_content
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
        } else {
          // Try to find NPC
          const { data: npc } = await supabase
            .from('campaign_npcs')
            .select('*')
            .eq('campaign_id', campaignId)
            .ilike('name', `%${escapedCombatantName}%`)
            .maybeSingle();

          if (npc) {
            setNpcData(npc as CampaignNPC);
          }
        }
      } catch (error) {
        console.error('Error fetching monster data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonsterData();
  }, [combatant, campaignId, open]);

  if (!combatant) return null;

  const hpPercent = Math.max(0, Math.min(100, (combatant.current_hp / combatant.max_hp) * 100));
  const isDead = combatant.current_hp === 0;

  const getHpColor = () => {
    if (isDead) return "bg-gray-500";
    if (hpPercent <= 25) return "bg-red-500";
    if (hpPercent <= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const renderMonsterAction = (action: MonsterAction, index: number) => {
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-card rounded-xl p-4 border border-border space-y-2"
      >
        <div className="flex items-center justify-between">
          <h4 className="font-bold flex items-center gap-2">
            <Sword className="w-4 h-4 text-red-500" />
            {action.name}
          </h4>
          {action.attack_bonus !== undefined && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRollDice?.(`1d20+${action.attack_bonus}`, `${action.name} (Ataque)`)}
              className="h-7 text-xs"
            >
              +{action.attack_bonus} Ataque
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{action.description}</p>
        {action.damage && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRollDice?.(action.damage!, `${action.name} (Dano)`)}
              className="h-7 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400"
            >
              🎲 {action.damage} {action.damage_type && `(${action.damage_type})`}
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  const renderCharacterContent = () => {
    if (!characterData) return null;

    const attributes = characterData.attributes as Record<string, number>;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 opacity-20" />
          <div className="relative p-4 flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-blue-500/50 bg-blue-500/20">
              {characterData.image_url ? (
                <img src={characterData.image_url} alt={characterData.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{characterData.name}</h2>
              <p className="text-muted-foreground">
                {characterData.race} • {characterData.class} Nv {characterData.level}
              </p>
            </div>
          </div>
        </div>

        {/* Combat Stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
            <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{combatant.current_hp}/{combatant.max_hp}</div>
            <div className="text-xs text-muted-foreground">Pontos de Vida</div>
          </motion.div>
          <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{combatant.armor_class}</div>
            <div className="text-xs text-muted-foreground">Classe de Armadura</div>
          </motion.div>
          <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
            <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{combatant.initiative}</div>
            <div className="text-xs text-muted-foreground">Iniciativa</div>
          </motion.div>
        </div>

        {/* Attributes */}
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(ATTR_NAMES).map(([key, abbr]) => {
            const value = attributes[key] || 10;
            const modifier = getModifier(value);
            return (
              <motion.div
                key={key}
                className="bg-card rounded-xl p-3 border border-border text-center cursor-pointer"
                whileHover={{ scale: 1.05 }}
                onClick={() => onRollDice?.(`1d20${modifier >= 0 ? '+' : ''}${modifier}`, `Teste de ${abbr}`)}
              >
                <div className="text-xs text-muted-foreground mb-1">{abbr}</div>
                <div className="text-lg font-bold">{value}</div>
                <div className={cn("text-sm font-medium", modifier >= 0 ? "text-green-500" : "text-red-500")}>
                  {modifier >= 0 ? '+' : ''}{modifier}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Conditions */}
        {combatant.conditions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Condições Ativas</h4>
            <div className="flex flex-wrap gap-2">
              {combatant.conditions.map((condition) => {
                const condData = CONDITIONS.find(c => c.name === condition);
                return (
                  <Badge key={condition} className={cn("text-sm", condData?.color || "bg-muted")}>
                    {condData?.icon} {condition}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHomebrewMonsterContent = () => {
    if (!homebrewMonster) return null;

    const data = homebrewMonster.data;
    const attributes = data.attributes || {};

    return (
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'stats' | 'actions')}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="stats" className="flex-1">
            <BookOpen className="w-4 h-4 mr-1" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex-1">
            <Swords className="w-4 h-4 mr-1" />
            Ações ({data.actions?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6 mt-0">
          {/* Monster Header */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 opacity-20" />
            <div className="relative p-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 border-red-500/50 bg-red-500/20 text-4xl">
                {homebrewMonster.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{homebrewMonster.name}</h2>
                <p className="text-muted-foreground text-sm">
                  {data.size} {data.type} • {data.alignment}
                </p>
                <Badge variant="outline" className="mt-1">
                  ND {data.challenge_rating}
                </Badge>
              </div>
            </div>
          </div>

          {/* Combat Stats */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
              <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{combatant.current_hp}/{combatant.max_hp}</div>
              <div className="text-xs text-muted-foreground">{data.hit_points}</div>
            </motion.div>
            <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
              <Shield className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{combatant.armor_class}</div>
              <div className="text-xs text-muted-foreground">Classe de Armadura</div>
            </motion.div>
            <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
              <Footprints className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-lg font-bold">{data.speed}</div>
              <div className="text-xs text-muted-foreground">Deslocamento</div>
            </motion.div>
          </div>

          {/* Attributes */}
          <div className="grid grid-cols-6 gap-2">
            {Object.entries(ATTR_NAMES).map(([key, abbr]) => {
              const value = attributes[key as keyof typeof attributes] || 10;
              const modifier = getModifier(value);
              return (
                <motion.div
                  key={key}
                  className="bg-card rounded-xl p-3 border border-border text-center cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => onRollDice?.(`1d20${modifier >= 0 ? '+' : ''}${modifier}`, `Teste de ${abbr}`)}
                >
                  <div className="text-xs text-muted-foreground mb-1">{abbr}</div>
                  <div className="text-lg font-bold">{value}</div>
                  <div className={cn("text-sm font-medium", modifier >= 0 ? "text-green-500" : "text-red-500")}>
                    {modifier >= 0 ? '+' : ''}{modifier}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Immunities & Resistances */}
          <div className="space-y-3">
            {data.damage_resistances && data.damage_resistances.length > 0 && (
              <div className="bg-card rounded-xl p-3 border border-border">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                  <ShieldOff className="w-4 h-4" />
                  Resistências a Dano
                </h4>
                <div className="flex flex-wrap gap-1">
                  {data.damage_resistances.map((r, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{r}</Badge>
                  ))}
                </div>
              </div>
            )}
            {data.damage_immunities && data.damage_immunities.length > 0 && (
              <div className="bg-card rounded-xl p-3 border border-border">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                  <FlameKindling className="w-4 h-4" />
                  Imunidades a Dano
                </h4>
                <div className="flex flex-wrap gap-1">
                  {data.damage_immunities.map((i, idx) => (
                    <Badge key={idx} variant="destructive" className="text-xs">{i}</Badge>
                  ))}
                </div>
              </div>
            )}
            {data.senses && (
              <div className="bg-card rounded-xl p-3 border border-border">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4" />
                  Sentidos
                </h4>
                <p className="text-sm">{data.senses}</p>
              </div>
            )}
            {data.languages && (
              <div className="bg-card rounded-xl p-3 border border-border">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mb-1">
                  <Languages className="w-4 h-4" />
                  Idiomas
                </h4>
                <p className="text-sm">{data.languages}</p>
              </div>
            )}
          </div>

          {/* Conditions */}
          {combatant.conditions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Condições Ativas</h4>
              <div className="flex flex-wrap gap-2">
                {combatant.conditions.map((condition) => {
                  const condData = CONDITIONS.find(c => c.name === condition);
                  return (
                    <Badge key={condition} className={cn("text-sm", condData?.color || "bg-muted")}>
                      {condData?.icon} {condition}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-3 mt-0">
          {data.actions && data.actions.length > 0 ? (
            data.actions.map((action, index) => renderMonsterAction(action, index))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Swords className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Nenhuma ação definida</p>
            </div>
          )}

          {data.legendary_actions && data.legendary_actions.length > 0 && (
            <>
              <h4 className="font-semibold text-sm text-muted-foreground pt-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                Ações Lendárias
              </h4>
              {data.legendary_actions.map((action, index) => renderMonsterAction(action, index))}
            </>
          )}
        </TabsContent>
      </Tabs>
    );
  };

  const renderBasicMonsterContent = () => {
    return (
      <div className="space-y-6">
        {/* Monster Header */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 opacity-20" />
          <div className="relative p-4 flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 border-red-500/50 bg-red-500/20">
              <Skull className="w-10 h-10 text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{combatant.name}</h2>
              <p className="text-muted-foreground">Monstro/Inimigo</p>
            </div>
          </div>
        </div>

        {/* Combat Stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
            <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{combatant.current_hp}/{combatant.max_hp}</div>
            <div className="text-xs text-muted-foreground">Pontos de Vida</div>
          </motion.div>
          <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{combatant.armor_class}</div>
            <div className="text-xs text-muted-foreground">Classe de Armadura</div>
          </motion.div>
          <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
            <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{combatant.initiative}</div>
            <div className="text-xs text-muted-foreground">Iniciativa</div>
          </motion.div>
        </div>

        {/* HP Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">HP</span>
            <span className="font-medium">{Math.round(hpPercent)}%</span>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn("h-full", getHpColor())}
              initial={{ width: 0 }}
              animate={{ width: `${hpPercent}%` }}
              transition={{ type: "spring", stiffness: 100 }}
            />
          </div>
        </div>

        {/* Conditions */}
        {combatant.conditions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Condições Ativas</h4>
            <div className="flex flex-wrap gap-2">
              {combatant.conditions.map((condition) => {
                const condData = CONDITIONS.find(c => c.name === condition);
                return (
                  <Badge key={condition} className={cn("text-sm", condData?.color || "bg-muted")}>
                    {condData?.icon} {condition}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {combatant.notes && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Notas</h4>
            <p className="text-sm">{combatant.notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderNPCContent = () => {
    if (!npcData) return renderBasicMonsterContent();

    return (
      <div className="space-y-6">
        {/* NPC Header */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 opacity-20" />
          <div className="relative p-4 flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-purple-500/50 bg-purple-500/20">
              {npcData.image_url ? (
                <img src={npcData.image_url} alt={npcData.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-purple-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{npcData.name}</h2>
              {npcData.title && <p className="text-sm text-muted-foreground italic">"{npcData.title}"</p>}
              {npcData.occupation && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Briefcase className="w-3 h-3" />
                  {npcData.occupation}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Combat Stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
            <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{combatant.current_hp}/{combatant.max_hp}</div>
            <div className="text-xs text-muted-foreground">Pontos de Vida</div>
          </motion.div>
          <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{combatant.armor_class}</div>
            <div className="text-xs text-muted-foreground">Classe de Armadura</div>
          </motion.div>
          <motion.div className="bg-card rounded-xl p-4 border border-border text-center" whileHover={{ scale: 1.02 }}>
            <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{combatant.initiative}</div>
            <div className="text-xs text-muted-foreground">Iniciativa</div>
          </motion.div>
        </div>

        {npcData.location && (
          <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Localização</div>
              <div className="font-medium">{npcData.location}</div>
            </div>
          </div>
        )}

        {npcData.appearance && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4" />
              Aparência
            </h4>
            <p className="text-sm">{npcData.appearance}</p>
          </div>
        )}

        {/* Conditions */}
        {combatant.conditions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Condições Ativas</h4>
            <div className="flex flex-wrap gap-2">
              {combatant.conditions.map((condition) => {
                const condData = CONDITIONS.find(c => c.name === condition);
                return (
                  <Badge key={condition} className={cn("text-sm", condData?.color || "bg-muted")}>
                    {condData?.icon} {condition}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              {combatant.is_player ? (
                <User className="w-5 h-5 text-blue-500" />
              ) : (
                <Skull className="w-5 h-5 text-red-500" />
              )}
              Ficha do Combatente
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : combatant.character_id && characterData ? (
              renderCharacterContent()
            ) : homebrewMonster ? (
              renderHomebrewMonsterContent()
            ) : npcData ? (
              renderNPCContent()
            ) : (
              renderBasicMonsterContent()
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
