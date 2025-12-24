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
  Star
} from "lucide-react";
import advancementData from "@/data/rules/avanco-personagem.json";
import { useCharacter, useUpdateCharacter } from "@/hooks/useCharacters";
import { useCharacterActiveCombat } from "@/hooks/useCharacterCombat";
import { useUpdateCombatant } from "@/hooks/useCombat";
import { getModifier, getAttributeAbbr } from "@/data/srd";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
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

interface SpellData {
  id: string;
  name: string;
  name_en: string;
  level: number;
  school: string;
  casting_time: string;
  range: number;
  range_type: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    material_description?: string;
  };
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description_markdown: string;
  at_higher_levels?: string;
}

const spellFiles = [
  () => import("@/data/spells/a-c.json"),
  () => import("@/data/spells/d-f.json"),
  () => import("@/data/spells/g-i.json"),
  () => import("@/data/spells/j-l.json"),
  () => import("@/data/spells/n-p.json"),
  () => import("@/data/spells/q-s.json"),
  () => import("@/data/spells/t-z.json"),
];

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
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
        hasExpertise ? 'bg-yellow-500 border-yellow-500' :
        isProficient ? 'bg-primary border-primary' : 'border-muted-foreground/50'
      }`} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{skill.name}</span>
        <span className="text-xs text-primary ml-2">{attrAbbr}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{base}</span>
        <span>+</span>
        <span>{bonus}</span>
        <span>=</span>
        <span className="bg-primary/20 text-primary font-bold px-2 py-1 rounded-lg min-w-[32px] text-center">
          {total}
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
  const [activeTab, setActiveTab] = useState('geral');
  const [skillsTab, setSkillsTab] = useState('pericias');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showEditStats, setShowEditStats] = useState(false);
  const [showSpells, setShowSpells] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [hpModifier, setHpModifier] = useState('');
  const [tempHpInput, setTempHpInput] = useState('');
  const [showRestDialog, setShowRestDialog] = useState<'short' | 'long' | null>(null);
  const [hitDiceToSpend, setHitDiceToSpend] = useState(0);
  const [allSpellsData, setAllSpellsData] = useState<SpellData[]>([]);
  const [selectedSpellDetail, setSelectedSpellDetail] = useState<SpellData | null>(null);
  const [spellsLoading, setSpellsLoading] = useState(true);
  const [xpInput, setXpInput] = useState('');

  const hasHistoryAccess = subscription?.limits.hasHistorico ?? false;

  // Load all spells data
  useEffect(() => {
    const loadSpells = async () => {
      try {
        const results = await Promise.all(spellFiles.map(fn => fn()));
        const spells: SpellData[] = [];
        results.forEach((mod: any) => {
          if (mod.default?.magias) {
            spells.push(...mod.default.magias);
          } else if (mod.magias) {
            spells.push(...mod.magias);
          }
        });
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
      const spellId = typeof spell === 'string' ? spell : spell.id || spell.name;
      const fullData = allSpellsData.find(s => s.id === spellId || s.name_en?.toLowerCase().replace(/\s+/g, '_') === spellId);
      return {
        id: spellId,
        fullData,
        displayName: fullData?.name || (typeof spellId === 'string' 
          ? spellId.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
          : spellId),
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
  const saves = character.saving_throws as Record<string, { proficient: boolean }>;
  const skills = character.skills as Record<string, { proficient?: boolean; expertise?: boolean }>;
  
  // Calculate passive scores
  const wisdomMod = getModifier(attributes.wisdom || 10);
  const intMod = getModifier(attributes.intelligence || 10);
  const perceptionProf = skills?.perception?.proficient ? character.proficiency_bonus : 0;
  const investigationProf = skills?.investigation?.proficient ? character.proficiency_bonus : 0;
  const insightProf = skills?.insight?.proficient ? character.proficiency_bonus : 0;
  
  const passivePerception = 10 + wisdomMod + perceptionProf;
  const passiveInvestigation = 10 + intMod + investigationProf;
  const passiveInsight = 10 + wisdomMod + insightProf;

  const hpPercent = Math.max(0, Math.min(100, (character.current_hp / character.max_hp) * 100));

  // Get proficiencies
  const proficiencies = character.proficiencies as { armor?: string[]; weapons?: string[]; tools?: string[] } || {};
  const languages = character.languages as string[] || [];

  // HP modification handlers
  const handleHpChange = async (delta: number) => {
    if (delta === 0) return;
    const newHp = Math.max(0, Math.min(character.max_hp, character.current_hp + delta));
    try {
      await updateCharacter.mutateAsync({
        id: character.id,
        current_hp: newHp
      });
      // Sync with combat
      await syncHpWithCombat(newHp);
      toast.success(delta > 0 ? `+${delta} HP` : `${delta} HP`);
      setHpModifier('');
    } catch (error) {
      toast.error('Erro ao atualizar HP');
    }
  };

  const handleHpModifierSubmit = (isDamage: boolean) => {
    const value = parseInt(hpModifier, 10);
    if (isNaN(value) || value <= 0) {
      toast.error('Digite um valor válido');
      return;
    }
    handleHpChange(isDamage ? -value : value);
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

  // Short rest handler
  const handleShortRest = async () => {
    if (hitDiceToSpend <= 0 || hitDiceToSpend > hitDice.current) {
      toast.error('Selecione uma quantidade válida de dados de vida');
      return;
    }

    // Roll hit dice
    const diceValue = parseInt(hitDice.diceType.replace('d', ''), 10);
    let totalHealing = 0;
    
    for (let i = 0; i < hitDiceToSpend; i++) {
      const roll = Math.floor(Math.random() * diceValue) + 1;
      totalHealing += Math.max(1, roll + conMod);
    }

    const newHp = Math.min(character.max_hp, character.current_hp + totalHealing);
    const newHitDice = { ...hitDice, current: hitDice.current - hitDiceToSpend };

    try {
      await updateCharacter.mutateAsync({
        id: character.id,
        current_hp: newHp,
        hit_dice: newHitDice
      });
      // Sync with combat
      await syncHpWithCombat(newHp);
      toast.success(`Descanso Curto: +${totalHealing} HP (${hitDiceToSpend}${hitDice.diceType})`);
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowEditStats(true)}
              className="gap-1"
            >
              <Edit3 className="w-4 h-4" />
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowLevelUp(true)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Subir de Nível
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNotes(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Notas e Anotações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowHistory(true)}>
                  <History className="w-4 h-4 mr-2" />
                  Histórico de Alterações
                  {!hasHistoryAccess && <span className="ml-auto text-[10px] text-gold">PRO</span>}
                </DropdownMenuItem>
                {character.spellcasting && (
                  <DropdownMenuItem onClick={() => setShowSpells(true)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerenciar Magias
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

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
                    disabled={hitDice.current === 0 || character.current_hp === character.max_hp}
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
                  <p className="text-lg font-bold">{character.armor_class}</p>
                  <p className="text-[10px] text-muted-foreground">CA</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-2 text-center">
                  <Zap className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{character.initiative >= 0 ? '+' : ''}{character.initiative}</p>
                  <p className="text-[10px] text-muted-foreground">Iniciativa</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-2 text-center">
                  <Footprints className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{character.speed}m</p>
                  <p className="text-[10px] text-muted-foreground">Desl.</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-2 text-center">
                  <Sparkles className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">+{character.proficiency_bonus}</p>
                  <p className="text-[10px] text-muted-foreground">Prof.</p>
                </div>
              </div>

              {/* XP & Level Up Section */}
              {(() => {
                const levels = advancementData.character_advancement.levels;
                const currentLevel = character.level;
                const nextLevel = Math.min(currentLevel + 1, 20);
                const currentLevelData = levels.find(l => l.level === currentLevel);
                const nextLevelData = levels.find(l => l.level === nextLevel);
                const xpForNext = nextLevelData?.xp_required || 0;
                const xpForCurrent = currentLevelData?.xp_required || 0;
                const canLevelUp = character.experience >= xpForNext && currentLevel < 20;
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
                  <div className={`mt-4 rounded-xl p-3 border ${
                    canLevelUp 
                      ? 'bg-yellow-500/10 border-yellow-500/50' 
                      : 'bg-primary/10 border-primary/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-semibold flex items-center gap-2 ${
                        canLevelUp ? 'text-yellow-400' : 'text-primary'
                      }`}>
                        <Star className="w-4 h-4" />
                        Experiência
                      </h3>
                      <div className="text-right">
                        <span className="text-lg font-bold">{character.experience.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-1">XP</span>
                      </div>
                    </div>

                    {/* XP Progress Bar */}
                    {currentLevel < 20 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Nível {currentLevel}</span>
                          <span>{xpForNext.toLocaleString()} XP</span>
                        </div>
                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${canLevelUp ? 'bg-yellow-500' : 'bg-primary'}`}
                            style={{ width: `${xpProgress}%` }}
                          />
                        </div>
                        {!canLevelUp && (
                          <p className="text-[10px] text-muted-foreground mt-1 text-center">
                            Faltam {(xpForNext - character.experience).toLocaleString()} XP para nível {nextLevel}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Add XP Input */}
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        type="number"
                        placeholder="Adicionar XP"
                        value={xpInput}
                        onChange={(e) => setXpInput(e.target.value)}
                        className="flex-1 text-center h-9 text-sm"
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
                        <Plus className="w-4 h-4 mr-1" />
                        XP
                      </Button>
                    </div>

                    {/* Level Up Button */}
                    {canLevelUp && (
                      <Button
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold"
                        size="sm"
                        onClick={() => setShowLevelUp(true)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Subir para Nível {nextLevel}!
                      </Button>
                    )}

                    {currentLevel >= 20 && (
                      <div className="text-center py-1">
                        <span className="text-xs text-yellow-400 font-medium">Nível Máximo Alcançado!</span>
                      </div>
                    )}
                  </div>
                );
              })()}

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
                    <div key={attr} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        isProficient ? 'bg-primary border-primary' : 'border-muted-foreground/50'
                      }`} />
                      <span className="text-xs flex-1">{ATTR_NAMES[attr]}</span>
                      <span className="text-sm font-bold">{total >= 0 ? '+' : ''}{total}</span>
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
                        const isProficient = skillData?.proficient || false;
                        const hasExpertise = skillData?.expertise || false;
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
                    {(character.features as any[])?.length > 0 ? (
                      (character.features as any[]).map((feature: any, i: number) => (
                        <div key={i} className="p-3 bg-muted/30 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold">{feature.name}</p>
                            {feature.source && (
                              <span className="text-xs text-primary">{feature.source}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhuma habilidade</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </SheetCard>

            {/* Inventory Section */}
            <SheetCard>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Backpack className="w-4 h-4 text-primary" />
                Inventário
              </h3>
              
              {/* Equipment with damage */}
              {(character.equipment as any[])?.filter((item: any) => item.damage).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl mb-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-primary font-mono">{item.damage}</span>
                </div>
              ))}
              
              {/* Other equipment */}
              {(character.equipment as any[])?.filter((item: any) => !item.damage).slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl mb-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.equipped && <span className="text-xs text-primary">Equipado</span>}
                </div>
              ))}

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

              {/* Death Saves */}
              <div className="p-3 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">Testes contra Morte</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-500 w-14">Sucessos</span>
                    {[0, 1, 2].map(i => (
                      <div 
                        key={i}
                        className={`w-4 h-4 rounded-full border-2 ${
                          i < ((character.death_saves as any)?.successes || 0) ? 'bg-green-500 border-green-500' : 'border-muted-foreground/50'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-500 w-14">Falhas</span>
                    {[0, 1, 2].map(i => (
                      <div 
                        key={i}
                        className={`w-4 h-4 rounded-full border-2 ${
                          i < ((character.death_saves as any)?.failures || 0) ? 'bg-red-500 border-red-500' : 'border-muted-foreground/50'
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs text-primary"
                    onClick={() => setShowSpells(true)}
                  >
                    Gerenciar
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 bg-muted/30 rounded-xl text-center">
                    <p className="text-lg font-bold">{(character.spellcasting as any)?.spellSaveDC || 8 + character.proficiency_bonus}</p>
                    <p className="text-[10px] text-muted-foreground">CD Resistência</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-xl text-center">
                    <p className="text-lg font-bold">+{(character.spellcasting as any)?.spellAttackBonus || character.proficiency_bonus}</p>
                    <p className="text-[10px] text-muted-foreground">Ataque</p>
                  </div>
                </div>

                <ScrollArea className="h-[180px]">
                  <div className="space-y-1">
                    {characterSpellsWithData.length > 0 ? (
                      characterSpellsWithData.slice(0, 10).map((spell, i) => {
                        const levelLabel = spell.fullData?.level === 0 ? "Truque" : `${spell.fullData?.level || '?'}º`;
                        const school = spell.fullData?.school;
                        const schoolInfo = school ? SPELL_SCHOOLS[school] : null;
                        
                        return (
                          <button
                            key={i}
                            onClick={() => spell.fullData && setSelectedSpellDetail(spell.fullData)}
                            className="w-full flex items-center gap-2 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
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
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </button>
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
                    <p className="text-xs text-muted-foreground">{selectedSpellDetail.name_en}</p>
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
                <div className="glass rounded-lg p-3"><p className="text-xs text-muted-foreground">Tempo</p><p className="text-sm font-medium">{selectedSpellDetail.casting_time}</p></div>
                <div className="glass rounded-lg p-3"><p className="text-xs text-muted-foreground">Alcance</p><p className="text-sm font-medium">{selectedSpellDetail.range_type === "self" ? "Pessoal" : selectedSpellDetail.range_type === "touch" ? "Toque" : `${selectedSpellDetail.range}m`}</p></div>
                <div className="glass rounded-lg p-3"><p className="text-xs text-muted-foreground">Duração</p><p className="text-sm font-medium">{selectedSpellDetail.duration}</p></div>
                <div className="glass rounded-lg p-3"><p className="text-xs text-muted-foreground">Componentes</p><p className="text-sm font-medium">{[selectedSpellDetail.components.verbal && "V", selectedSpellDetail.components.somatic && "S", selectedSpellDetail.components.material && "M"].filter(Boolean).join(", ")}</p></div>
              </div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selectedSpellDetail.description_markdown.replace(/\*\*/g, "").replace(/###\s*/g, "\n").replace(/\n-\s/g, "\n• ")}</p>
              </div>
              {selectedSpellDetail.at_higher_levels && (
                <div className="glass rounded-lg p-3 mb-6">
                  <p className="text-xs text-primary font-medium mb-1">Em Níveis Superiores</p>
                  <p className="text-sm text-muted-foreground">{selectedSpellDetail.at_higher_levels.replace(/\*\*/g, "")}</p>
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
                    <p>Durante um descanso curto (1 hora), você pode gastar dados de vida para recuperar HP.</p>
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
                          value={hitDiceToSpend || ''}
                          onChange={(e) => setHitDiceToSpend(Math.max(0, Math.min(hitDice.current, parseInt(e.target.value) || 0)))}
                          className="w-20 text-center"
                          min={0}
                          max={hitDice.current}
                        />
                        <span className="text-xs text-muted-foreground">
                          (Recupera {hitDiceToSpend}{hitDice.diceType} + {conMod >= 0 ? '+' : ''}{conMod} por dado)
                        </span>
                      </div>
                    </div>
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
              disabled={showRestDialog === 'short' && hitDiceToSpend === 0}
              className={showRestDialog === 'short' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-500 hover:bg-indigo-600'}
            >
              {showRestDialog === 'short' ? 'Descansar' : 'Descansar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
