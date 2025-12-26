import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Heart,
  Shield,
  Zap,
  Clock,
  Target,
  Footprints,
  Swords,
  BookOpen,
  Backpack,
  User,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Edit3,
  MoreVertical,
  TrendingUp,
  FileText,
  Eye,
  Search,
  Lightbulb,
  Moon,
  Sunrise,
  Plus,
  Minus,
  Dices,
  History,
  X,
  Star,
  ArrowRightLeft,
  Scroll,
  Users
} from "lucide-react";
import advancementData from "@/data/rules/avanco-personagem.json";
import { calculateFeatBonuses } from "@/lib/featEffects";
import { useCharacter, useUpdateCharacter } from "@/hooks/useCharacters";
import { useCharacterActiveCombat } from "@/hooks/useCharacterCombat";
import { useUpdateCombatant } from "@/hooks/useCombat";
import { getModifier, getAttributeAbbr, CLASSES } from "@/data/srd";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LevelUpSheet } from "./LevelUpSheet";
import { EditStatsSheet } from "./EditStatsSheet";
import { SpellsManagementSheet } from "./SpellsManagementSheet";
import { NotesSheet } from "./NotesSheet";
import { CharacterHistorySheet } from "./CharacterHistorySheet";
import { CombatStatusCard } from "./CombatStatusCard";
import { InventoryManagementSheet } from "./InventoryManagementSheet";
import { SpellCastDialog, SPELL_SLOTS_BY_LEVEL, type ActiveConcentration } from "./SpellCastDialog";
import { useAddCombatLog } from "@/hooks/useCombatLogs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useCharacterCampaign } from "@/hooks/useCampaigns";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { PrivateMasterChat } from "./PrivateMasterChat";
import { TradeOfferModal } from "./TradeOfferModal";
import { PlayerTradeModal } from "./PlayerTradeModal";
import { InitiateTradeSheet } from "./InitiateTradeSheet";
import { DocumentsSheet } from "./DocumentsSheet";
import { useCharacterDocuments } from "@/hooks/useDocuments";
import { CharacterFactionReputations } from "./CharacterFactionReputations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ATTRIBUTES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

const ATTR_NAMES: Record<string, string> = {
  strength: 'Força',
  dexterity: 'Destreza',
  constitution: 'Constituição',
  intelligence: 'Inteligência',
  wisdom: 'Sabedoria',
  charisma: 'Carisma'
};

const SKILLS = [
  { id: 'acrobatics', name: 'Acrobacia', attr: 'dexterity' },
  { id: 'animal_handling', name: 'Lidar com Animais', attr: 'wisdom' },
  { id: 'arcana', name: 'Arcanismo', attr: 'intelligence' },
  { id: 'athletics', name: 'Atletismo', attr: 'strength' },
  { id: 'deception', name: 'Enganação', attr: 'charisma' },
  { id: 'history', name: 'História', attr: 'intelligence' },
  { id: 'insight', name: 'Intuição', attr: 'wisdom' },
  { id: 'intimidation', name: 'Intimidação', attr: 'charisma' },
  { id: 'investigation', name: 'Investigação', attr: 'intelligence' },
  { id: 'medicine', name: 'Medicina', attr: 'wisdom' },
  { id: 'nature', name: 'Natureza', attr: 'intelligence' },
  { id: 'perception', name: 'Percepção', attr: 'wisdom' },
  { id: 'performance', name: 'Atuação', attr: 'charisma' },
  { id: 'persuasion', name: 'Persuasão', attr: 'charisma' },
  { id: 'religion', name: 'Religião', attr: 'intelligence' },
  { id: 'sleight_of_hand', name: 'Prestidigitação', attr: 'dexterity' },
  { id: 'stealth', name: 'Furtividade', attr: 'dexterity' },
  { id: 'survival', name: 'Sobrevivência', attr: 'wisdom' },
];

const CONDITIONS = [
  { name: "Agarrado", icon: "🪢" },
  { name: "Amedrontado", icon: "😨" },
  { name: "Atordoado", icon: "💫" },
  { name: "Caído", icon: "⬇️" },
  { name: "Cego", icon: "👁️" },
  { name: "Encantado", icon: "💕" },
  { name: "Envenenado", icon: "☠️" },
  { name: "Exausto", icon: "😫" },
  { name: "Incapacitado", icon: "🚫" },
  { name: "Inconsciente", icon: "💤" },
  { name: "Invisível", icon: "👻" },
  { name: "Paralisado", icon: "🧊" },
  { name: "Petrificado", icon: "🗿" },
  { name: "Surdo", icon: "🔇" },
];

// Spell constants
const SPELL_SCHOOLS: Record<string, { name: string; color: string }> = {
  abjuration: { name: "Abjuração", color: "bg-blue-500/20 text-blue-400" },
  conjuration: { name: "Conjuração", color: "bg-yellow-500/20 text-yellow-400" },
  divination: { name: "Adivinhação", color: "bg-cyan-500/20 text-cyan-400" },
  enchantment: { name: "Encantamento", color: "bg-pink-500/20 text-pink-400" },
  evocation: { name: "Evocação", color: "bg-red-500/20 text-red-400" },
  illusion: { name: "Ilusão", color: "bg-purple-500/20 text-purple-400" },
  necromancy: { name: "Necromancia", color: "bg-green-500/20 text-green-400" },
  transmutation: { name: "Transmutação", color: "bg-orange-500/20 text-orange-400" },
};

// New unified spell interface based on magias.json
interface SpellData {
  name: string;
  originalName: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string;
  };
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels: string | null;
  classes: string[];
}

function SheetCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
}

// Attribute Box Component - Minimalist style
function AttributeBox({ 
  name, 
  fullName,
  modifier 
}: { 
  name: string;
  fullName: string;
  modifier: number;
}) {
  return (
    <div className="bg-muted/50 rounded-xl p-4 text-center hover:bg-muted/70 transition-colors cursor-pointer">
      <div className="text-3xl font-bold text-foreground mb-1">
        {modifier >= 0 ? '+' : ''}{modifier}
      </div>
      <div className="text-xs text-muted-foreground">{fullName}</div>
    </div>
  );
}

// Skill Row Component
function SkillRow({
  skill,
  attrAbbr,
  isProficient,
  hasExpertise,
  total,
  base,
  bonus
}: {
  skill: { id: string; name: string };
  attrAbbr: string;
  isProficient: boolean;
  hasExpertise: boolean;
  total: number;
  base: number;
  bonus: number;
}) {
  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
      hasExpertise 
        ? 'bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20' 
        : isProficient 
          ? 'bg-primary/10 border border-primary/30 hover:bg-primary/20' 
          : 'hover:bg-muted/30'
    }`}>
      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
        hasExpertise ? 'bg-yellow-500 border-yellow-500' :
        isProficient ? 'bg-primary border-primary' : 'border-muted-foreground/50'
      }`} />
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${isProficient || hasExpertise ? 'font-semibold' : 'font-medium'} ${
          hasExpertise ? 'text-yellow-400' : isProficient ? 'text-primary' : ''
        }`}>{skill.name}</span>
        <span className="text-xs text-muted-foreground ml-2">{attrAbbr}</span>
        {hasExpertise && <span className="text-[10px] text-yellow-400 ml-2">(Expertise)</span>}
        {isProficient && !hasExpertise && <span className="text-[10px] text-primary ml-2">(Prof.)</span>}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{base}</span>
        <span>+</span>
        <span>{bonus}</span>
        <span>=</span>
        <span className={`font-bold px-2 py-1 rounded-lg min-w-[32px] text-center ${
          hasExpertise ? 'bg-yellow-500/20 text-yellow-400' : 'bg-primary/20 text-primary'
        }`}>
          {total >= 0 ? '+' : ''}{total}
        </span>
      </div>
    </div>
  );
}

export function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading } = useCharacter(id || '');
  const updateCharacter = useUpdateCharacter();
  const { data: combatInfo } = useCharacterActiveCombat(id || '');
  const updateCombatant = useUpdateCombatant();
  const { data: subscription } = useSubscription();
  const { data: characterCampaign } = useCharacterCampaign(id);
  const { data: campaignPlayers } = useCampaignPlayers(characterCampaign?.id || '');
  const { data: characterDocuments } = useCharacterDocuments(id || '');
  
  // Calculate unread documents count
  const unreadDocumentsCount = characterDocuments?.filter(d => !d.read_at).length || 0;
  const [activeTab, setActiveTab] = useState('geral');
  const [skillsTab, setSkillsTab] = useState('pericias');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showEditStats, setShowEditStats] = useState(false);
  const [showSpells, setShowSpells] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTradeSheet, setShowTradeSheet] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [hpModifier, setHpModifier] = useState('');
  const [tempHpInput, setTempHpInput] = useState('');
  const [showRestDialog, setShowRestDialog] = useState<'short' | 'long' | null>(null);
  const [hitDiceToSpend, setHitDiceToSpend] = useState(0);
  const [allSpellsData, setAllSpellsData] = useState<SpellData[]>([]);
  const [selectedSpellDetail, setSelectedSpellDetail] = useState<SpellData | null>(null);
  const [spellsLoading, setSpellsLoading] = useState(true);
  const [xpInput, setXpInput] = useState('');
  const [useMilestone, setUseMilestone] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [spellToCast, setSpellToCast] = useState<SpellData | null>(null);
  const [showSpellCastDialog, setShowSpellCastDialog] = useState(false);

  // Combat log integration
  const addCombatLog = useAddCombatLog();

  // Get spell slots for character
  const spellSlots = useMemo(() => {
    if (!character) return [0, 0, 0, 0, 0, 0, 0, 0, 0];
    return SPELL_SLOTS_BY_LEVEL[character.level.toString()] || [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }, [character?.level]);

  // Get used slots from character spellcasting
  const usedSlots = useMemo(() => {
    if (!character?.spellcasting) return [0, 0, 0, 0, 0, 0, 0, 0, 0];
    return (character.spellcasting as any)?.usedSlots || [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }, [character?.spellcasting]);

  // Get active concentration
  const activeConcentration = useMemo((): ActiveConcentration | null => {
    if (!character?.spellcasting) return null;
    return (character.spellcasting as any)?.activeConcentration || null;
  }, [character?.spellcasting]);

  // Cast spell and consume slot
  const handleCastSpell = async (spellLevel: number, castAtLevel: number, isConcentration: boolean) => {
    if (!character) return;
    
    const spellName = spellToCast?.name || "Magia";
    const isCantrip = spellLevel === 0;
    
    // Update slots (only for non-cantrips)
    const newUsedSlots = [...usedSlots];
    if (!isCantrip && castAtLevel > 0) {
      newUsedSlots[castAtLevel - 1] = (newUsedSlots[castAtLevel - 1] || 0) + 1;
    }
    
    // Update concentration
    const newConcentration: ActiveConcentration | null = isConcentration 
      ? { spellName, castAt: new Date().toISOString() }
      : activeConcentration;
    
    await updateCharacter.mutateAsync({
      id: character.id,
      spellcasting: {
        ...(character.spellcasting as any),
        usedSlots: newUsedSlots,
        activeConcentration: newConcentration,
      },
    });

    // Log to combat if in active combat
    if (combatInfo?.combatant && combatInfo?.encounter) {
      const levelText = isCantrip ? "(truque)" : `(nível ${castAtLevel})`;
      const concentrationText = isConcentration ? " [Concentração]" : "";
      
      await addCombatLog.mutateAsync({
        encounter_id: combatInfo.encounter.id,
        combatant_id: combatInfo.combatant.id,
        combatant_name: character.name,
        action_type: 'damage' as any, // Using damage as generic action type for spells
        value: null,
        details: `🔮 Lançou ${spellName} ${levelText}${concentrationText}`,
      });
    }
  };

  // Drop concentration
  const handleDropConcentration = async () => {
    if (!character) return;
    
    const droppedSpell = activeConcentration?.spellName;
    
    await updateCharacter.mutateAsync({
      id: character.id,
      spellcasting: {
        ...(character.spellcasting as any),
        activeConcentration: null,
      },
    });

    // Log to combat if in active combat
    if (combatInfo?.combatant && combatInfo?.encounter && droppedSpell) {
      await addCombatLog.mutateAsync({
        encounter_id: combatInfo.encounter.id,
        combatant_id: combatInfo.combatant.id,
        combatant_name: character.name,
        action_type: 'condition_remove' as any,
        value: null,
        details: `💨 Perdeu concentração em ${droppedSpell}`,
      });
    }
  };

  // Recover all spell slots (long rest)
  const handleRecoverAllSlots = async () => {
    if (!character) return;
    
    await updateCharacter.mutateAsync({
      id: character.id,
      spellcasting: {
        ...(character.spellcasting as any),
        usedSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        activeConcentration: null, // Also clear concentration on long rest
      },
    });
    toast.success("Slots de magia recuperados!", {
      description: "Descanso longo completo",
      icon: "✨",
    });
  };

  const hasHistoryAccess = subscription?.limits.hasHistorico ?? false;

  // Load all spells data from unified magias.json
  useEffect(() => {
    const loadSpells = async () => {
      try {
        const mod = await import("@/data/spells/magias.json");
        const spells = mod.default as SpellData[];
        setAllSpellsData(spells);
      } catch (error) {
        console.error("Error loading spells:", error);
      } finally {
        setSpellsLoading(false);
      }
    };
    loadSpells();
  }, []);

  // Map character spells to full spell data
  const characterSpellsWithData = useMemo(() => {
    if (!character?.spells) return [];
    const charSpells = character.spells as any[];
    return charSpells.map((spell: any) => {
      const spellName = typeof spell === 'string' ? spell : spell.name;
      const fullData = allSpellsData.find(s => 
        s.name.toLowerCase() === spellName.toLowerCase() || 
        s.originalName?.toLowerCase() === spellName.toLowerCase()
      );
      return {
        id: spellName,
        fullData,
        displayName: fullData?.name || (typeof spellName === 'string' 
          ? spellName.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
          : spellName),
      };
    });
  }, [character?.spells, allSpellsData]);

  // Helper to update conditions with combat sync
  const updateConditions = async (newConditions: string[]) => {
    // Update character
    await updateCharacter.mutateAsync({
      id: character!.id,
      conditions: newConditions,
    });

    // If in active combat, also update the combatant
    if (combatInfo?.combatant && combatInfo?.encounter) {
      await updateCombatant.mutateAsync({
        id: combatInfo.combatant.id,
        encounterId: combatInfo.encounter.id,
        conditions: newConditions,
      });
    }
  };

  // Helper to sync HP with combat
  const syncHpWithCombat = async (newCurrentHp: number, newMaxHp?: number) => {
    if (combatInfo?.combatant && combatInfo?.encounter) {
      const updateData: { id: string; encounterId: string; current_hp: number; max_hp?: number } = {
        id: combatInfo.combatant.id,
        encounterId: combatInfo.encounter.id,
        current_hp: newCurrentHp,
      };
      if (newMaxHp !== undefined) {
        updateData.max_hp = newMaxHp;
      }
      await updateCombatant.mutateAsync(updateData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-12 w-12 rounded-full mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl mb-4" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Personagem não encontrado</p>
          <Button onClick={() => navigate('/characters')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const attributes = character.attributes as Record<string, number>;
  const rawSaves = character.saving_throws as Record<string, { proficient: boolean } | boolean>;
  const skills = character.skills as Record<string, { proficient?: boolean; expertise?: boolean } | boolean>;
  
  // Infer saving throw proficiencies from class if not set
  const classData = CLASSES.find(c => c.name === character.class);
  const classSavingThrows = classData?.saving_throw_proficiencies || [];
  
  // Build saves object with fallback to class data
  const saves: Record<string, { proficient: boolean }> = {};
  ATTRIBUTES.forEach(attr => {
    const savedData = rawSaves?.[attr];
    if (typeof savedData === 'boolean') {
      saves[attr] = { proficient: savedData };
    } else if (savedData?.proficient) {
      saves[attr] = { proficient: true };
    } else if (classSavingThrows.includes(attr)) {
      saves[attr] = { proficient: true };
    } else {
      saves[attr] = { proficient: false };
    }
  });
  
  // Calculate feat bonuses (initiative, AC, speed, passive bonuses, HP)
  const features = character.features as Array<{ name: string; source?: string; level?: number; description?: string }> | undefined;
  const featBonuses = calculateFeatBonuses(features, character.level);
  
  // Calculate effective stats with feat bonuses
  const effectiveInitiative = character.initiative + featBonuses.initiative;
  const effectiveAC = character.armor_class + featBonuses.ac;
  const effectiveSpeed = character.speed + featBonuses.speed;
  
  // Calculate passive scores - support both old and new skill format
  const wisdomMod = getModifier(attributes.wisdom || 10);
  const intMod = getModifier(attributes.intelligence || 10);
  const getSkillProficient = (skillId: string) => {
    const skillData = skills?.[skillId];
    return typeof skillData === 'boolean' ? skillData : (skillData?.proficient || false);
  };
  const perceptionProf = getSkillProficient('perception') ? character.proficiency_bonus : 0;
  const investigationProf = getSkillProficient('investigation') ? character.proficiency_bonus : 0;
  const insightProf = getSkillProficient('insight') ? character.proficiency_bonus : 0;
  
  const passivePerception = 10 + wisdomMod + perceptionProf + featBonuses.passive_perception;
  const passiveInvestigation = 10 + intMod + investigationProf + featBonuses.passive_investigation;
  const passiveInsight = 10 + wisdomMod + insightProf + featBonuses.passive_insight;

  const hpPercent = Math.max(0, Math.min(100, (character.current_hp / character.max_hp) * 100));

  // Get proficiencies - handle both array format (racial weapons) and object format
  const rawProficiencies = character.proficiencies;
  const proficiencies: { armor?: string[]; weapons?: string[]; tools?: string[] } = 
    Array.isArray(rawProficiencies) 
      ? { weapons: rawProficiencies as string[] }
      : (rawProficiencies as { armor?: string[]; weapons?: string[]; tools?: string[] } || {});
  const languages = character.languages as string[] || [];

  // HP modification handlers - supports temporary HP absorption
  const handleHpChange = async (delta: number) => {
    if (delta === 0) return;
    
    let newCurrentHp = character.current_hp;
    let newTempHp = character.temporary_hp;
    
    if (delta < 0) {
      // Taking damage - absorb with temp HP first
      const damage = Math.abs(delta);
      if (newTempHp > 0) {
        if (newTempHp >= damage) {
          // Temp HP absorbs all damage
          newTempHp -= damage;
        } else {
          // Temp HP absorbs some, rest goes to HP
          const remainingDamage = damage - newTempHp;
          newTempHp = 0;
          newCurrentHp = Math.max(0, newCurrentHp - remainingDamage);
        }
      } else {
        newCurrentHp = Math.max(0, newCurrentHp - damage);
      }
    } else {
      // Healing - only affects current HP, not temp
      newCurrentHp = Math.min(character.max_hp, newCurrentHp + delta);
    }
    
    try {
      await updateCharacter.mutateAsync({
        id: character.id,
        current_hp: newCurrentHp,
        temporary_hp: newTempHp
      });
      // Sync with combat
      await syncHpWithCombat(newCurrentHp);
      
      if (delta < 0) {
        const absorbed = character.temporary_hp - newTempHp;
        if (absorbed > 0) {
          toast.success(`-${Math.abs(delta)} Dano (${absorbed} absorvido por HP temp)`);
        } else {
          toast.success(`-${Math.abs(delta)} Dano`);
        }
      } else {
        toast.success(`+${delta} HP`);
      }
      setHpModifier('');
    } catch (error) {
      toast.error('Erro ao atualizar HP');
    }
  };

  const handleHpModifierSubmit = (isDamage: boolean) => {
    const value = parseInt(hpModifier, 10);
    if (isNaN(value) || value === 0) {
      toast.error('Digite um valor válido');
      return;
    }
    // Support negative values for damage
    if (value < 0) {
      handleHpChange(value); // Already negative = damage
    } else {
      handleHpChange(isDamage ? -value : value);
    }
  };

  // Temporary HP handler
  const handleAddTempHp = async () => {
    const value = parseInt(tempHpInput, 10);
    if (isNaN(value) || value <= 0) {
      toast.error('Digite um valor válido');
      return;
    }
    try {
      // Temp HP doesn't stack - use the higher value
      const newTempHp = Math.max(character.temporary_hp, value);
      await updateCharacter.mutateAsync({
        id: character.id,
        temporary_hp: newTempHp
      });
      toast.success(`HP Temporário: ${newTempHp}`);
      setTempHpInput('');
    } catch (error) {
      toast.error('Erro ao adicionar HP temporário');
    }
  };

  // Get hit dice info
  const hitDice = character.hit_dice as { current: number; total: number; diceType: string };
  const conMod = getModifier(attributes.constitution || 10);

  // Short rest handler - now supports 0 hit dice for resource recovery only
  const handleShortRest = async () => {
    // Allow 0 hit dice for resource-only recovery
    if (hitDiceToSpend < 0 || hitDiceToSpend > hitDice.current) {
      toast.error('Quantidade de dados inválida');
      return;
    }

    let totalHealing = 0;
    let newHitDice = hitDice;
    
    if (hitDiceToSpend > 0) {
      // Roll hit dice
      const diceValue = parseInt(hitDice.diceType.replace('d', ''), 10);
      
      for (let i = 0; i < hitDiceToSpend; i++) {
        const roll = Math.floor(Math.random() * diceValue) + 1;
        totalHealing += Math.max(1, roll + conMod);
      }
      
      newHitDice = { ...hitDice, current: hitDice.current - hitDiceToSpend };
    }

    const newHp = Math.min(character.max_hp, character.current_hp + totalHealing);

    try {
      await updateCharacter.mutateAsync({
        id: character.id,
        current_hp: newHp,
        hit_dice: newHitDice
      });
      // Sync with combat
      await syncHpWithCombat(newHp);
      
      if (hitDiceToSpend > 0) {
        toast.success(`Descanso Curto: +${totalHealing} HP (${hitDiceToSpend}${hitDice.diceType})`);
      } else {
        toast.success('Descanso Curto: Recursos recuperados');
      }
      setShowRestDialog(null);
      setHitDiceToSpend(0);
    } catch (error) {
      toast.error('Erro ao realizar descanso');
    }
  };

  // Long rest handler
  const handleLongRest = async () => {
    // Recover all HP
    const newHp = character.max_hp;
    
    // Recover half of total hit dice (minimum 1)
    const hitDiceRecovered = Math.max(1, Math.floor(hitDice.total / 2));
    const newHitDiceCurrent = Math.min(hitDice.total, hitDice.current + hitDiceRecovered);
    const newHitDice = { ...hitDice, current: newHitDiceCurrent };

    // Reset temporary HP
    try {
      await updateCharacter.mutateAsync({
        id: character.id,
        current_hp: newHp,
        temporary_hp: 0,
        hit_dice: newHitDice
      });
      // Sync with combat
      await syncHpWithCombat(newHp, newHp);
      toast.success(`Descanso Longo: HP recuperado (${newHp}), +${hitDiceRecovered} dados de vida`);
      setShowRestDialog(null);
    } catch (error) {
      toast.error('Erro ao realizar descanso');
    }
  };

  // Filter skills
  const filteredSkills = SKILLS.filter(skill => 
    skill.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-md border-b border-border/30 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">{character.name}</h1>
              <p className="text-xs text-muted-foreground">
                {character.race} • {character.class} Nível {character.level}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <MoreVertical className="w-5 h-5" />
                  {unreadDocumentsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadDocumentsCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1 bg-card border border-border shadow-lg">
                <DropdownMenuItem 
                  onClick={() => setShowEditStats(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Edit3 className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="font-medium">Editar Personagem</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => setShowLevelUp(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="font-medium">Subir de Nível</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => setShowNotes(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="font-medium">Notas e Anotações</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    <History className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium">Histórico</span>
                    {!hasHistoryAccess && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gold/20 text-gold rounded font-bold">PRO</span>
                    )}
                  </div>
                </DropdownMenuItem>
                
                {character.spellcasting && (
                  <DropdownMenuItem 
                    onClick={() => setShowSpells(true)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="font-medium">Gerenciar Magias</span>
                  </DropdownMenuItem>
                )}
                
                {characterCampaign && campaignPlayers && campaignPlayers.length > 1 && (
                  <DropdownMenuItem 
                    onClick={() => setShowTradeSheet(true)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="font-medium">Propor Troca</span>
                  </DropdownMenuItem>
                )}
                
                {characterCampaign && (
                  <DropdownMenuItem 
                    onClick={() => setShowDocuments(true)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                      <Scroll className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium">Meus Documentos</span>
                      {unreadDocumentsCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-destructive text-destructive-foreground rounded-full font-bold min-w-[18px] text-center">
                          {unreadDocumentsCount}
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* XP & Level Up Banner - Top Right */}
      {(() => {
        const levels = advancementData.character_advancement.levels;
        const currentLevel = character.level;
        const nextLevel = Math.min(currentLevel + 1, 20);
        const currentLevelData = levels.find(l => l.level === currentLevel);
        const nextLevelData = levels.find(l => l.level === nextLevel);
        const xpForNext = nextLevelData?.xp_required || 0;
        const xpForCurrent = currentLevelData?.xp_required || 0;
        const canLevelUp = useMilestone ? false : (character.experience >= xpForNext && currentLevel < 20);
        const xpProgress = currentLevel < 20 
          ? Math.min(100, ((character.experience - xpForCurrent) / (xpForNext - xpForCurrent)) * 100)
          : 100;
        
        const handleAddXp = async () => {
          const value = parseInt(xpInput, 10);
          if (isNaN(value) || value <= 0) {
            toast.error('Digite um valor válido');
            return;
          }
          try {
            await updateCharacter.mutateAsync({
              id: character.id,
              experience: character.experience + value
            });
            toast.success(`+${value} XP adicionado!`);
            setXpInput('');
          } catch (error) {
            toast.error('Erro ao adicionar XP');
          }
        };

        return (
          <div className="max-w-7xl mx-auto px-4 mb-4">
            <div className={`rounded-xl p-4 border ${
              canLevelUp 
                ? 'bg-yellow-500/10 border-yellow-500/50' 
                : 'bg-primary/10 border-primary/30'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: XP Info */}
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${canLevelUp ? 'bg-yellow-500/20' : 'bg-primary/20'}`}>
                    <Star className={`w-6 h-6 ${canLevelUp ? 'text-yellow-400' : 'text-primary'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-bold ${canLevelUp ? 'text-yellow-400' : 'text-primary'}`}>
                        Nível {currentLevel}
                      </h3>
                      {currentLevel >= 20 && (
                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                          Máximo
                        </Badge>
                      )}
                    </div>
                    {!useMilestone && currentLevel < 20 && (
                      <p className="text-sm text-muted-foreground">
                        {character.experience.toLocaleString()} / {xpForNext.toLocaleString()} XP
                      </p>
                    )}
                    {useMilestone && (
                      <p className="text-sm text-muted-foreground">
                        Usando Milestone - Nível controlado pelo Mestre
                      </p>
                    )}
                  </div>
                </div>

                {/* Center: Progress Bar (XP mode only) */}
                {!useMilestone && currentLevel < 20 && (
                  <div className="flex-1 max-w-md">
                    <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${canLevelUp ? 'bg-yellow-500' : 'bg-primary'}`}
                        style={{ width: `${xpProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">
                      Faltam {(xpForNext - character.experience).toLocaleString()} XP para nível {nextLevel}
                    </p>
                  </div>
                )}

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                  {/* Milestone Toggle */}
                  <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                    <Label htmlFor="milestone-toggle" className="text-xs text-muted-foreground cursor-pointer">
                      Milestone
                    </Label>
                    <Switch
                      id="milestone-toggle"
                      checked={useMilestone}
                      onCheckedChange={setUseMilestone}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  {/* Add XP (only in XP mode) */}
                  {!useMilestone && currentLevel < 20 && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="+XP"
                        value={xpInput}
                        onChange={(e) => setXpInput(e.target.value)}
                        className="w-20 text-center h-9 text-sm"
                        min="1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && xpInput) {
                            handleAddXp();
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
                        onClick={handleAddXp}
                        disabled={!xpInput || updateCharacter.isPending}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Level Up Button */}
                  {(canLevelUp || (useMilestone && currentLevel < 20)) && (
                    <Button
                      className={useMilestone 
                        ? "bg-primary hover:bg-primary/80 text-primary-foreground font-bold"
                        : "bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold animate-pulse"
                      }
                      size="sm"
                      onClick={() => setShowLevelUp(true)}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Subir para Nível {nextLevel}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Content - 3 Column Layout */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Left Column - Character Info */}
          <div className="space-y-4">
            {/* Combat Status Card - Shows when character is in active combat */}
            <CombatStatusCard characterId={character.id} />
            
            <SheetCard>
              {/* Tab Header */}
              <div className="flex justify-center mb-4">
                <div className="bg-primary rounded-full px-6 py-2">
                  <span className="text-sm font-semibold text-primary-foreground">Geral</span>
                </div>
              </div>

              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 rounded-full bg-muted/50 border-4 border-primary/30 overflow-hidden">
                  {character.image_url ? (
                    <img src={character.image_url} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-center mb-4">{character.name}</h2>

              {/* Info Section */}
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-semibold text-foreground">Informações</h3>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-sm text-muted-foreground">
                    {character.race}{character.subrace ? ` (${character.subrace})` : ''} • {character.class}
                  </p>
                </div>
                {character.background && (
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-sm text-muted-foreground">{character.background}</p>
                  </div>
                )}
              </div>

              {/* Attributes */}
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-semibold text-foreground">Atributos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {ATTRIBUTES.slice(0, 3).map((attr) => {
                    const score = attributes[attr] || 10;
                    const mod = getModifier(score);
                    return (
                      <AttributeBox 
                        key={attr}
                        name={getAttributeAbbr(attr)}
                        fullName={ATTR_NAMES[attr]}
                        modifier={mod}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ATTRIBUTES.slice(3, 6).map((attr) => {
                    const score = attributes[attr] || 10;
                    const mod = getModifier(score);
                    return (
                      <AttributeBox 
                        key={attr}
                        name={getAttributeAbbr(attr)}
                        fullName={ATTR_NAMES[attr]}
                        modifier={mod}
                      />
                    );
                  })}
                </div>
              </div>

              {/* HP Bar */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Pontos de Vida</h3>
                
                {/* HP Progress Bar */}
                <div className="relative">
                  <div className="h-10 bg-muted/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-foreground drop-shadow-md">
                      {character.current_hp}/{character.max_hp}
                    </span>
                  </div>
                </div>
                
                {/* Temporary HP Display */}
                {character.temporary_hp > 0 && (
                  <div className="flex items-center justify-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-lg p-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">+{character.temporary_hp} HP Temporário</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-blue-400 hover:text-blue-300"
                      onClick={async () => {
                        await updateCharacter.mutateAsync({ id: character.id, temporary_hp: 0 });
                        toast.success('HP temporário removido');
                      }}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* HP Modifier Input */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Quantidade"
                    value={hpModifier}
                    onChange={(e) => setHpModifier(e.target.value)}
                    className="flex-1 text-center h-10"
                    min="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && hpModifier) {
                        handleHpModifierSubmit(false);
                      }
                    }}
                  />
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30"
                    onClick={() => handleHpModifierSubmit(true)}
                    disabled={!hpModifier || updateCharacter.isPending}
                  >
                    <Minus className="w-4 h-4 mr-1" />
                    Dano
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 bg-green-500/20 text-green-500 border-green-500/30 hover:bg-green-500/30"
                    onClick={() => handleHpModifierSubmit(false)}
                    disabled={!hpModifier || updateCharacter.isPending}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Curar
                  </Button>
                </div>

                {/* Temporary HP Input */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="HP Temporário"
                    value={tempHpInput}
                    onChange={(e) => setTempHpInput(e.target.value)}
                    className="flex-1 text-center h-9 text-sm"
                    min="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempHpInput) {
                        handleAddTempHp();
                      }
                    }}
                  />
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30"
                    onClick={handleAddTempHp}
                    disabled={!tempHpInput || updateCharacter.isPending}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Temp
                  </Button>
                </div>

                {/* Hit Dice & Rest */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                  <div className="flex-1 bg-muted/30 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Dices className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold">{hitDice.current}/{hitDice.total}</span>
                      <span className="text-xs text-muted-foreground">{hitDice.diceType}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Dados de Vida</p>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
                    onClick={() => setShowRestDialog('short')}
                  >
                    <Moon className="w-4 h-4 mr-1" />
                    Curto
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30"
                    onClick={() => setShowRestDialog('long')}
                  >
                    <Sunrise className="w-4 h-4 mr-1" />
                    Longo
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="bg-muted/30 rounded-xl p-2 text-center">
                  <Shield className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{effectiveAC}</p>
                  <p className="text-[10px] text-muted-foreground">CA</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-2 text-center">
                  <Zap className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{effectiveInitiative >= 0 ? '+' : ''}{effectiveInitiative}</p>
                  <p className="text-[10px] text-muted-foreground">Iniciativa</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-2 text-center">
                  <Footprints className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{effectiveSpeed}m</p>
                  <p className="text-[10px] text-muted-foreground">Desl.</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-2 text-center">
                  <Sparkles className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">+{character.proficiency_bonus}</p>
                  <p className="text-[10px] text-muted-foreground">Prof.</p>
                </div>
              </div>


              {/* Conditions Section */}
              <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                    <Swords className="w-4 h-4" />
                    Condições
                  </h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="end">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground mb-2 px-2">Selecione uma condição:</p>
                        <ScrollArea className="h-64">
                          {CONDITIONS.map((cond) => {
                            const isActive = character.conditions?.includes(cond.name);
                            return (
                              <button
                                key={cond.name}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm transition-colors ${
                                  isActive 
                                    ? 'bg-orange-500/20 text-orange-400' 
                                    : 'hover:bg-muted text-foreground'
                                }`}
                                onClick={async () => {
                                  if (isActive) {
                                    const newConditions = character.conditions.filter(c => c !== cond.name);
                                    await updateConditions(newConditions);
                                    toast.success(`Condição "${cond.name}" removida`);
                                  } else {
                                    const newConditions = [...(character.conditions || []), cond.name];
                                    await updateConditions(newConditions);
                                    toast.success(`Condição "${cond.name}" adicionada`);
                                  }
                                }}
                              >
                                <span className="text-base">{cond.icon}</span>
                                <span className="flex-1">{cond.name}</span>
                                {isActive && <X className="w-3 h-3 text-orange-400" />}
                              </button>
                            );
                          })}
                        </ScrollArea>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {character.conditions && character.conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {character.conditions.map((condition, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        {CONDITIONS.find(c => c.name === condition)?.icon} {condition}
                        <button
                          onClick={async () => {
                            const newConditions = character.conditions.filter((_, i) => i !== idx);
                            await updateConditions(newConditions);
                            toast.success(`Condição "${condition}" removida`);
                          }}
                          className="ml-1 hover:bg-orange-500/30 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Nenhuma condição ativa
                  </p>
                )}
              </div>
            </SheetCard>

            {/* Saving Throws */}
            <SheetCard>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Testes de Resistência
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {ATTRIBUTES.map((attr) => {
                  const score = attributes[attr] || 10;
                  const mod = getModifier(score);
                  const isProficient = saves?.[attr]?.proficient || false;
                  const total = mod + (isProficient ? character.proficiency_bonus : 0);
                  return (
                    <div key={attr} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      isProficient 
                        ? 'bg-primary/20 border border-primary/40' 
                        : 'bg-muted/30'
                    }`}>
                      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                        isProficient ? 'bg-primary border-primary' : 'border-muted-foreground/50'
                      }`} />
                      <span className={`text-xs flex-1 ${isProficient ? 'text-primary font-medium' : ''}`}>
                        {ATTR_NAMES[attr]}
                      </span>
                      <span className={`text-sm font-bold ${isProficient ? 'text-primary' : ''}`}>
                        {total >= 0 ? '+' : ''}{total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SheetCard>
          </div>

          {/* Middle Column - Skills & Inventory */}
          <div className="space-y-4">
            <SheetCard>
              {/* Skills Tabs */}
              <div className="flex justify-center mb-4">
                <div className="flex bg-muted/50 rounded-full p-1">
                  <button 
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      skillsTab === 'pericias' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setSkillsTab('pericias')}
                  >
                    Perícias
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      skillsTab === 'habilidades' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setSkillsTab('habilidades')}
                  >
                    Habilidades
                  </button>
                </div>
              </div>

              {skillsTab === 'pericias' && (
                <>
                  {/* Search */}
                  <div className="mb-4">
                    <Input
                      placeholder="Buscar perícia"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      className="bg-muted/30 border-0"
                    />
                  </div>

                  {/* Skills Header */}
                  <div className="flex items-center gap-3 px-3 mb-2 text-xs text-muted-foreground">
                    <span className="w-3" />
                    <span className="flex-1">Perícia</span>
                    <span className="w-20 text-center">Base + Bônus</span>
                    <span className="w-10 text-center">Total</span>
                  </div>

                  {/* Skills List */}
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-1">
                      {filteredSkills.map((skill) => {
                        const attrScore = attributes[skill.attr] || 10;
                        const mod = getModifier(attrScore);
                        const skillData = skills?.[skill.id];
                        // Support both old format (true) and new format ({ proficient: true })
                        const isProficient = typeof skillData === 'boolean' ? skillData : (skillData?.proficient || false);
                        const hasExpertise = typeof skillData === 'object' ? (skillData?.expertise || false) : false;
                        const profBonus = (isProficient ? character.proficiency_bonus : 0) + (hasExpertise ? character.proficiency_bonus : 0);
                        const total = mod + profBonus;
                        return (
                          <SkillRow
                            key={skill.id}
                            skill={skill}
                            attrAbbr={getAttributeAbbr(skill.attr)}
                            isProficient={isProficient}
                            hasExpertise={hasExpertise}
                            total={total}
                            base={mod}
                            bonus={profBonus}
                          />
                        );
                      })}
                    </div>
                  </ScrollArea>
                </>
              )}

              {skillsTab === 'habilidades' && (
                <ScrollArea className="h-[380px]">
                  <div className="space-y-2">
                    {/* Feats Section */}
                    {(() => {
                      const features = character.features as any[];
                      const feats = features?.filter(f => f.type === 'feat' || f.source === 'Talento') || [];
                      const classFeatures = features?.filter(f => f.type !== 'feat' && f.source !== 'Talento') || [];
                      
                      return (
                        <>
                          {feats.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Star className="w-3 h-3" />
                                Talentos ({feats.length})
                              </h4>
                              {feats.map((feat: any, i: number) => (
                                <div key={`feat-${i}`} className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-semibold text-yellow-400">{feat.name}</p>
                                    <Badge variant="outline" className="text-[10px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                      Talento
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{feat.description}</p>
                                  {feat.effects && (
                                    <div className="mt-2 pt-2 border-t border-yellow-500/20">
                                      <p className="text-[10px] text-yellow-400/70">Efeitos aplicados:</p>
                                      <ul className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                                        {Object.entries(feat.effects || {}).map(([key, value]) => (
                                          <li key={key}>• {key}: {String(value)}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {classFeatures.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                Habilidades de Classe ({classFeatures.length})
                              </h4>
                              {classFeatures.map((feature: any, i: number) => (
                                <div key={`feature-${i}`} className="p-3 bg-muted/30 rounded-xl mb-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-semibold">{feature.name}</p>
                                    {feature.source && (
                                      <span className="text-xs text-primary">{feature.source}</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {(!features || features.length === 0) && (
                            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma habilidade ou talento</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </ScrollArea>
              )}
            </SheetCard>

            {/* Inventory Section */}
            <SheetCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Backpack className="w-4 h-4 text-primary" />
                  Inventário
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInventory(true)}
                  className="text-xs"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Gerenciar
                </Button>
              </div>
              
              {/* Weapons */}
              {(character.equipment as any[])?.filter((item: any) => item.type === 'weapon').length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] uppercase text-primary font-semibold mb-1">Armas</p>
                  {(character.equipment as any[]).filter((item: any) => item.type === 'weapon').map((item: any, i: number) => {
                    // Calculate weapon damage with modifier
                    const hasFinesse = item.properties?.includes('finesse');
                    const isRanged = item.properties?.includes('ammunition') || item.range;
                    const strMod = getModifier((attributes as any)?.strength || 10);
                    const dexMod = getModifier((attributes as any)?.dexterity || 10);
                    let mod = strMod;
                    if (isRanged) mod = dexMod;
                    else if (hasFinesse) mod = Math.max(strMod, dexMod);
                    const modSign = mod >= 0 ? '+' : '';
                    const damageDisplay = item.damage ? `${item.damage} ${modSign}${mod}` : '';
                    
                    return (
                      <div 
                        key={`weapon-${i}`} 
                        className={`flex items-center justify-between p-3 rounded-xl mb-2 cursor-pointer transition-colors ${
                          item.equipped 
                            ? 'bg-primary/20 border border-primary/40' 
                            : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                        onClick={async () => {
                          const equipment = [...(character.equipment as any[])];
                          const itemIndex = equipment.findIndex(e => e.id === item.id || (e.name === item.name && e.type === item.type));
                          if (itemIndex >= 0) {
                            equipment[itemIndex] = { ...equipment[itemIndex], equipped: !equipment[itemIndex].equipped };
                            await updateCharacter.mutateAsync({
                              id: character.id,
                              equipment: equipment
                            });
                            toast.success(equipment[itemIndex].equipped ? `${item.name} equipado` : `${item.name} desequipado`);
                          }
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Swords className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.properties?.includes('finesse') && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0">Acuidade</Badge>
                            )}
                            {item.properties?.includes('versatile') && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0">Versátil</Badge>
                            )}
                          </div>
                          {item.equipped && item.properties?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 ml-6">
                              {item.properties.filter((p: string) => !['finesse', 'versatile'].includes(p)).slice(0, 3).map((prop: string) => (
                                <span key={prop} className="text-[9px] text-muted-foreground">
                                  {prop === 'light' ? 'Leve' :
                                   prop === 'heavy' ? 'Pesada' :
                                   prop === 'two_handed' ? '2 mãos' :
                                   prop === 'reach' ? 'Alcance' :
                                   prop === 'thrown' ? 'Arremesso' : prop}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {damageDisplay && (
                            <span className="text-xs text-primary font-mono">{damageDisplay}</span>
                          )}
                          {item.equipped && (
                            <Badge variant="outline" className="text-[10px] bg-primary/20 text-primary border-primary/40">
                              ✓
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Armor */}
              {(character.equipment as any[])?.filter((item: any) => item.type === 'armor' || item.type === 'shield').length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] uppercase text-cyan-400 font-semibold mb-1">Armaduras</p>
                  {(character.equipment as any[]).filter((item: any) => item.type === 'armor' || item.type === 'shield').map((item: any, i: number) => {
                    // Check strength requirement
                    const meetsStr = !item.strengthRequirement || (attributes?.strength || 10) >= item.strengthRequirement;
                    
                    // Calculate displayed AC
                    const dexMod = getModifier((attributes as any)?.dexterity || 10);
                    let acDisplay = '';
                    if (item.type === 'shield') {
                      acDisplay = `+${item.armorClass || 2}`;
                    } else if (item.armorCategory === 'heavy') {
                      acDisplay = `CA ${item.armorClass}`;
                    } else if (item.armorCategory === 'medium') {
                      const bonus = Math.min(dexMod, item.maxDexBonus ?? 2);
                      acDisplay = `CA ${(item.armorClass || 0) + bonus}`;
                    } else {
                      acDisplay = `CA ${(item.armorClass || 0) + dexMod}`;
                    }
                    
                    return (
                      <div 
                        key={`armor-${i}`} 
                        className={`flex items-center justify-between p-3 rounded-xl mb-2 cursor-pointer transition-colors ${
                          item.equipped 
                            ? 'bg-cyan-500/20 border border-cyan-500/40' 
                            : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                        onClick={async () => {
                          const equipment = [...(character.equipment as any[])];
                          const itemIndex = equipment.findIndex(e => e.id === item.id || (e.name === item.name && e.type === item.type));
                          if (itemIndex >= 0) {
                            const newEquipped = !equipment[itemIndex].equipped;
                            
                            // Unequip other armor of same type
                            if (newEquipped) {
                              equipment.forEach((e, idx) => {
                                if (idx !== itemIndex && e.type === item.type && e.equipped) {
                                  equipment[idx] = { ...e, equipped: false };
                                }
                              });
                            }
                            
                            equipment[itemIndex] = { ...equipment[itemIndex], equipped: newEquipped };
                            
                            // Recalculate AC
                            const dexMod = getModifier((attributes as any)?.dexterity || 10);
                            const equippedArmor = equipment.find(e => e.type === 'armor' && e.equipped);
                            const equippedShield = equipment.find(e => e.type === 'shield' && e.equipped);
                            
                            let newAC = 10 + dexMod; // Base: no armor
                            if (equippedArmor) {
                              if (equippedArmor.armorCategory === 'heavy') {
                                newAC = equippedArmor.armorClass || 10;
                              } else if (equippedArmor.armorCategory === 'medium') {
                                newAC = (equippedArmor.armorClass || 10) + Math.min(dexMod, equippedArmor.maxDexBonus ?? 2);
                              } else {
                                newAC = (equippedArmor.armorClass || 10) + dexMod;
                              }
                            }
                            if (equippedShield) {
                              newAC += equippedShield.armorClass || 2;
                            }
                            
                            await updateCharacter.mutateAsync({
                              id: character.id,
                              equipment: equipment,
                              armor_class: newAC
                            });
                            toast.success(newEquipped ? `${item.name} equipado (CA: ${newAC})` : `${item.name} desequipado`);
                          }
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.stealthDisadvantage && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-orange-500/20 text-orange-400">
                                Furt. -
                              </Badge>
                            )}
                          </div>
                          {item.equipped && !meetsStr && (
                            <p className="text-[9px] text-red-400 ml-6 mt-1">
                              ⚠️ FOR {item.strengthRequirement} necessária (Desloc. -3m)
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-cyan-400 font-mono">{acDisplay}</span>
                          {item.strengthRequirement && (
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] px-1 py-0 ${!meetsStr ? 'border-red-500 text-red-400' : ''}`}
                            >
                              F{item.strengthRequirement}
                            </Badge>
                          )}
                          {item.equipped && (
                            <Badge variant="outline" className="text-[10px] bg-cyan-500/20 text-cyan-400 border-cyan-500/40">
                              ✓
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Other Items */}
              {(character.equipment as any[])?.filter((item: any) => item.type === 'item').length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Outros Itens</p>
                  <div className="flex flex-wrap gap-1">
                    {(character.equipment as any[]).filter((item: any) => item.type === 'item').slice(0, 8).map((item: any, i: number) => (
                      <Badge key={`item-${i}`} variant="outline" className="text-xs">
                        {item.name} {item.quantity > 1 && `(${item.quantity})`}
                      </Badge>
                    ))}
                    {(character.equipment as any[]).filter((item: any) => item.type === 'item').length > 8 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        +{(character.equipment as any[]).filter((item: any) => item.type === 'item').length - 8}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {(!character.equipment || (character.equipment as any[]).length === 0) && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">Nenhum equipamento</p>
                  <Button variant="outline" size="sm" onClick={() => setShowInventory(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar Itens
                  </Button>
                </div>
              )}

              {/* Currency */}
              <div className="flex gap-2 mt-3">
                {[
                  { key: 'gold', label: 'PO', color: 'text-yellow-500' },
                  { key: 'silver', label: 'PP', color: 'text-gray-400' },
                  { key: 'copper', label: 'PC', color: 'text-orange-600' },
                ].map(({ key, label, color }) => (
                  <div key={key} className="flex-1 text-center bg-muted/30 rounded-lg p-2">
                    <p className={`text-sm font-bold ${color}`}>
                      {(character.currency as any)?.[key] || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </SheetCard>

            {/* Notes Preview */}
            <SheetCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Anotações
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs text-primary"
                  onClick={() => setShowNotes(true)}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 min-h-[100px]">
                <p className="text-xs text-muted-foreground">
                  {character.backstory || 'Clique em editar para adicionar anotações...'}
                </p>
              </div>
            </SheetCard>

            {/* Faction Reputations - only show if character is in a campaign */}
            {characterCampaign && (
              <SheetCard>
                <CharacterFactionReputations 
                  characterId={character.id} 
                  campaignId={characterCampaign.id} 
                />
              </SheetCard>
            )}
          </div>

          {/* Right Column - Combat & Spells */}
          <div className="space-y-4">
            {/* Passive Scores & Senses */}
            <SheetCard>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Sentidos
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <span className="text-xs">Percepção Passiva</span>
                  <span className="text-sm font-bold">{passivePerception}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <span className="text-xs">Investigação Passiva</span>
                  <span className="text-sm font-bold">{passiveInvestigation}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <span className="text-xs">Intuição Passiva</span>
                  <span className="text-sm font-bold">{passiveInsight}</span>
                </div>
              </div>
            </SheetCard>

            {/* Combat Info */}
            <SheetCard>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Swords className="w-4 h-4 text-primary" />
                Combate
              </h3>
              
              {/* Hit Dice */}
              <div className="p-3 bg-muted/30 rounded-xl mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Dados de Vida</span>
                  <span className="text-sm font-bold">
                    {(character.hit_dice as any)?.current || character.level}/{(character.hit_dice as any)?.total || character.level} {(character.hit_dice as any)?.diceType || 'd8'}
                  </span>
                </div>
              </div>

              {/* Death Saves - Now Clickable */}
              <div className="p-3 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">Testes contra Morte</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-500 w-14">Sucessos</span>
                    {[0, 1, 2].map(i => (
                      <button 
                        key={i}
                        onClick={async () => {
                          const current = (character.death_saves as any)?.successes || 0;
                          const newValue = i < current ? i : i + 1;
                          await updateCharacter.mutateAsync({
                            id: character.id,
                            death_saves: { ...(character.death_saves as any), successes: Math.min(3, newValue) }
                          });
                        }}
                        className={`w-5 h-5 rounded-full border-2 transition-colors hover:scale-110 ${
                          i < ((character.death_saves as any)?.successes || 0) ? 'bg-green-500 border-green-500' : 'border-muted-foreground/50 hover:border-green-400'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-500 w-14">Falhas</span>
                    {[0, 1, 2].map(i => (
                      <button 
                        key={i}
                        onClick={async () => {
                          const current = (character.death_saves as any)?.failures || 0;
                          const newValue = i < current ? i : i + 1;
                          await updateCharacter.mutateAsync({
                            id: character.id,
                            death_saves: { ...(character.death_saves as any), failures: Math.min(3, newValue) }
                          });
                        }}
                        className={`w-5 h-5 rounded-full border-2 transition-colors hover:scale-110 ${
                          i < ((character.death_saves as any)?.failures || 0) ? 'bg-red-500 border-red-500' : 'border-muted-foreground/50 hover:border-red-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </SheetCard>

            {/* Spells */}
            {character.spellcasting && (
              <SheetCard>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Magias
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs text-primary"
                      onClick={handleRecoverAllSlots}
                      title="Recuperar slots (Descanso Longo)"
                    >
                      <Moon className="w-3.5 h-3.5 mr-1" />
                      Descanso
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs text-primary"
                      onClick={() => setShowSpells(true)}
                    >
                      Gerenciar
                    </Button>
                  </div>
                </div>
                
                {/* Spell Slots Display */}
                {spellSlots.some(s => s > 0) && (
                  <div className="mb-3 p-2 bg-muted/20 rounded-xl">
                    <p className="text-[10px] text-muted-foreground mb-2 text-center">Slots de Magia</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {spellSlots.map((max, index) => {
                        if (max === 0) return null;
                        const used = usedSlots[index] || 0;
                        const available = max - used;
                        return (
                          <div 
                            key={index} 
                            className={`px-2 py-1 rounded-lg text-center min-w-[40px] ${
                              available > 0 ? 'bg-primary/20' : 'bg-muted/30'
                            }`}
                          >
                            <div className={`text-xs font-bold ${available > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                              {available}/{max}
                            </div>
                            <div className="text-[9px] text-muted-foreground">{index + 1}º</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Concentration Display */}
                {activeConcentration && (
                  <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <div>
                          <p className="text-xs font-medium text-yellow-500">Concentração</p>
                          <p className="text-sm font-semibold">{activeConcentration.spellName}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                        onClick={handleDropConcentration}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Encerrar
                      </Button>
                    </div>
                  </div>
                )}

                {(() => {
                  // Get spellcasting ability from class features
                  const classData = CLASSES.find(c => c.name === character.class);
                  const spellcastingFeature = (classData as any)?.features?.find((f: any) => f.id === 'spellcasting');
                  const spellcastingAbility = spellcastingFeature?.mechanical?.spellcasting_ability || 
                    (classData?.primary_abilities?.[0] === 'wisdom' ? 'wisdom' : 
                     classData?.primary_abilities?.[0] === 'charisma' ? 'charisma' : 
                     classData?.primary_abilities?.[0] === 'intelligence' ? 'intelligence' : 'intelligence');
                  const abilityMod = getModifier((attributes as any)?.[spellcastingAbility] || 10);
                  const spellSaveDC = 8 + character.proficiency_bonus + abilityMod;
                  const spellAttackBonus = character.proficiency_bonus + abilityMod;
                  const abilityName = ATTR_NAMES[spellcastingAbility] || spellcastingAbility;
                  
                  return (
                    <div className="space-y-2 mb-3">
                      <div className="text-[10px] text-center text-muted-foreground mb-1">
                        Habilidade: <span className="text-primary font-medium">{abilityName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-muted/30 rounded-xl text-center">
                          <p className="text-lg font-bold">{spellSaveDC}</p>
                          <p className="text-[10px] text-muted-foreground">CD Resistência</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded-xl text-center">
                          <p className="text-lg font-bold">+{spellAttackBonus}</p>
                          <p className="text-[10px] text-muted-foreground">Ataque</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <ScrollArea className="h-[180px]">
                  <div className="space-y-1">
                    {characterSpellsWithData.length > 0 ? (
                      characterSpellsWithData.slice(0, 10).map((spell, i) => {
                        const levelLabel = spell.fullData?.level === 0 ? "Truque" : `${spell.fullData?.level || '?'}º`;
                        const school = spell.fullData?.school;
                        const schoolInfo = school ? SPELL_SCHOOLS[school] : null;
                        const spellLevel = spell.fullData?.level || 0;
                        const canCastSpell = spellLevel === 0 || spellSlots.slice(spellLevel - 1).some((max, idx) => {
                          const used = usedSlots[spellLevel - 1 + idx] || 0;
                          return max - used > 0;
                        });
                        
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <button
                              onClick={() => spell.fullData && setSelectedSpellDetail(spell.fullData)}
                              className="flex-1 min-w-0 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{spell.displayName}</span>
                                {spell.fullData?.concentration && (
                                  <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400">C</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">{levelLabel}</span>
                                {schoolInfo && (
                                  <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${schoolInfo.color}`}>
                                    {schoolInfo.name}
                                  </Badge>
                                )}
                              </div>
                            </button>
                            <Button
                              size="sm"
                              variant={canCastSpell ? "default" : "secondary"}
                              disabled={!canCastSpell && spellLevel > 0}
                              className="h-7 text-xs px-2 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (spell.fullData) {
                                  setSpellToCast(spell.fullData);
                                  setShowSpellCastDialog(true);
                                }
                              }}
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Lançar
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma magia</p>
                    )}
                  </div>
                </ScrollArea>
              </SheetCard>
            )}

            {/* Proficiencies */}
            <SheetCard>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Proficiências
              </h3>
              <div className="space-y-2">
                {proficiencies.armor && proficiencies.armor.length > 0 && (
                  <div className="p-2 bg-muted/30 rounded-lg">
                    <p className="text-[10px] uppercase text-primary font-semibold mb-1">Armaduras</p>
                    <p className="text-xs text-muted-foreground">{proficiencies.armor.join(', ')}</p>
                  </div>
                )}
                {proficiencies.weapons && proficiencies.weapons.length > 0 && (
                  <div className="p-2 bg-muted/30 rounded-lg">
                    <p className="text-[10px] uppercase text-primary font-semibold mb-1">Armas</p>
                    <p className="text-xs text-muted-foreground">{proficiencies.weapons.join(', ')}</p>
                  </div>
                )}
                {proficiencies.tools && proficiencies.tools.length > 0 && (
                  <div className="p-2 bg-muted/30 rounded-lg">
                    <p className="text-[10px] uppercase text-primary font-semibold mb-1">Ferramentas</p>
                    <p className="text-xs text-muted-foreground">{proficiencies.tools.join(', ')}</p>
                  </div>
                )}
                {languages.length > 0 && (
                  <div className="p-2 bg-muted/30 rounded-lg">
                    <p className="text-[10px] uppercase text-primary font-semibold mb-1">Idiomas</p>
                    <p className="text-xs text-muted-foreground">{languages.join(', ')}</p>
                  </div>
                )}
              </div>
            </SheetCard>
          </div>
        </div>
      </div>

      {/* Sheets */}
      <LevelUpSheet 
        character={character} 
        open={showLevelUp} 
        onOpenChange={setShowLevelUp} 
      />
      <EditStatsSheet 
        character={character} 
        open={showEditStats} 
        onOpenChange={setShowEditStats} 
      />
      <SpellsManagementSheet 
        character={character} 
        open={showSpells} 
        onOpenChange={setShowSpells} 
      />
      <NotesSheet 
        character={character} 
        open={showNotes} 
        onOpenChange={setShowNotes} 
      />
      <CharacterHistorySheet
        characterId={character.id}
        characterName={character.name}
        open={showHistory}
        onOpenChange={setShowHistory}
      />

      {/* Spell Detail Sheet */}
      <Sheet open={!!selectedSpellDetail} onOpenChange={() => setSelectedSpellDetail(null)}>
        <SheetContent side="bottom" className="bg-card border-border h-[85vh]">
          {selectedSpellDetail && (
            <ScrollArea className="h-full pr-4">
              <SheetHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-left text-lg">{selectedSpellDetail.name}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{selectedSpellDetail.originalName}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedSpellDetail.level === 0 ? "Truque" : `${selectedSpellDetail.level}º Círculo`}
                      </Badge>
                      {SPELL_SCHOOLS[selectedSpellDetail.school] && (
                        <Badge className={`text-xs ${SPELL_SCHOOLS[selectedSpellDetail.school].color}`}>
                          {SPELL_SCHOOLS[selectedSpellDetail.school].name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="glass rounded-lg p-3"><p className="text-xs text-muted-foreground">Tempo</p><p className="text-sm font-medium">{selectedSpellDetail.castingTime}</p></div>
                <div className="glass rounded-lg p-3"><p className="text-xs text-muted-foreground">Alcance</p><p className="text-sm font-medium">{selectedSpellDetail.range}</p></div>
                <div className="glass rounded-lg p-3"><p className="text-xs text-muted-foreground">Duração</p><p className="text-sm font-medium">{selectedSpellDetail.duration}</p></div>
                <div className="glass rounded-lg p-3"><p className="text-xs text-muted-foreground">Componentes</p><p className="text-sm font-medium">{[selectedSpellDetail.components.verbal && "V", selectedSpellDetail.components.somatic && "S", selectedSpellDetail.components.material && "M"].filter(Boolean).join(", ")}</p></div>
              </div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selectedSpellDetail.description}</p>
              </div>
              {selectedSpellDetail.higherLevels && (
                <div className="glass rounded-lg p-3 mb-6">
                  <p className="text-xs text-primary font-medium mb-1">Em Níveis Superiores</p>
                  <p className="text-sm text-muted-foreground">{selectedSpellDetail.higherLevels}</p>
                </div>
              )}
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Rest Dialog */}
      <AlertDialog open={showRestDialog !== null} onOpenChange={(open) => !open && setShowRestDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {showRestDialog === 'short' ? (
                <>
                  <Moon className="w-5 h-5 text-amber-400" />
                  Descanso Curto
                </>
              ) : (
                <>
                  <Sunrise className="w-5 h-5 text-indigo-400" />
                  Descanso Longo
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                {showRestDialog === 'short' ? (
                  <>
                    <p>Durante um descanso curto (1 hora), você pode gastar dados de vida para recuperar HP ou apenas restaurar recursos de classe.</p>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-foreground mb-2">
                        Dados de vida disponíveis: <span className="font-bold text-primary">{hitDice.current}/{hitDice.total}</span> ({hitDice.diceType})
                      </p>
                      <p className="text-sm text-foreground mb-3">
                        Modificador de Constituição: <span className="font-bold text-primary">{conMod >= 0 ? '+' : ''}{conMod}</span>
                      </p>
                      <div className="flex items-center gap-3">
                        <label className="text-sm">Gastar dados:</label>
                        <Input
                          type="number"
                          value={hitDiceToSpend}
                          onChange={(e) => setHitDiceToSpend(Math.max(0, Math.min(hitDice.current, parseInt(e.target.value) || 0)))}
                          className="w-20 text-center"
                          min={0}
                          max={hitDice.current}
                        />
                        <span className="text-xs text-muted-foreground">
                          {hitDiceToSpend > 0 
                            ? `(Recupera ${hitDiceToSpend}${hitDice.diceType} + ${conMod >= 0 ? '+' : ''}${conMod} por dado)`
                            : '(0 = só restaurar recursos)'
                          }
                        </span>
                      </div>
                    </div>
                    {character.current_hp === character.max_hp && hitDiceToSpend === 0 && (
                      <p className="text-xs text-amber-400 italic">
                        Você está com HP cheio. Descanso curto pode ser usado para restaurar habilidades de classe.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p>Durante um descanso longo (8 horas), você recupera todo o HP e metade dos dados de vida gastos.</p>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <p className="text-sm text-foreground">
                        HP atual: <span className="font-bold">{character.current_hp}/{character.max_hp}</span> → <span className="font-bold text-green-500">{character.max_hp}/{character.max_hp}</span>
                      </p>
                      <p className="text-sm text-foreground">
                        Dados de vida: <span className="font-bold">{hitDice.current}/{hitDice.total}</span> → <span className="font-bold text-green-500">{Math.min(hitDice.total, hitDice.current + Math.max(1, Math.floor(hitDice.total / 2)))}/{hitDice.total}</span>
                      </p>
                      {character.temporary_hp > 0 && (
                        <p className="text-sm text-foreground">
                          HP temporário: <span className="font-bold">{character.temporary_hp}</span> → <span className="font-bold text-muted-foreground">0</span>
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRestDialog(null);
              setHitDiceToSpend(0);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={showRestDialog === 'short' ? handleShortRest : handleLongRest}
              className={showRestDialog === 'short' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-500 hover:bg-indigo-600'}
            >
              {showRestDialog === 'short' ? 'Descansar' : 'Descansar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Inventory Management Sheet */}
      <InventoryManagementSheet
        open={showInventory}
        onOpenChange={setShowInventory}
        character={character}
      />

      {/* Spell Cast Dialog */}
      <SpellCastDialog
        open={showSpellCastDialog}
        onOpenChange={setShowSpellCastDialog}
        spell={spellToCast}
        spellSlots={spellSlots}
        usedSlots={usedSlots}
        onCast={handleCastSpell}
        characterLevel={character.level}
        activeConcentration={activeConcentration}
        onDropConcentration={handleDropConcentration}
      />

      {/* Private Chat with Master - only show if character is in a campaign */}
      {characterCampaign && (
        <PrivateMasterChat 
          campaignId={characterCampaign.id} 
          campaignName={characterCampaign.name}
          masterId={characterCampaign.master_id}
        />
      )}

      {/* Trade Offer Modal - shows pending shop offers */}
      <TradeOfferModal
        characterId={character.id}
        characterCurrency={{
          gold: (character.currency as any)?.gold || 0,
          silver: (character.currency as any)?.silver || 0,
          copper: (character.currency as any)?.copper || 0,
        }}
      />

      {/* Player Trade Modal - shows pending trades and gifts */}
      <PlayerTradeModal
        characterId={character.id}
        characterInventory={(character.inventory as any[]) || []}
      />

      {/* Initiate Trade Sheet - for players to start trades */}
      {characterCampaign && (
        <InitiateTradeSheet
          open={showTradeSheet}
          onOpenChange={setShowTradeSheet}
          campaignId={characterCampaign.id}
          characterId={character.id}
          characterInventory={(character.inventory as any[]) || []}
          campaignPlayers={campaignPlayers || []}
        />
      )}

      {/* Documents Sheet - for players to view received documents */}
      {characterCampaign && (
        <DocumentsSheet
          open={showDocuments}
          onOpenChange={setShowDocuments}
          characterId={character.id}
          characterName={character.name}
        />
      )}
    </div>
  );
}
