import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Heart,
  Shield,
  Zap,
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
  History
} from "lucide-react";
import { useCharacter, useUpdateCharacter } from "@/hooks/useCharacters";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

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

// Card Component
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

  const hasHistoryAccess = subscription?.limits.hasHistorico ?? false;

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
                
                {character.temporary_hp > 0 && (
                  <p className="text-xs text-blue-400 text-center">+{character.temporary_hp} Temporário</p>
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

                <ScrollArea className="h-[150px]">
                  <div className="space-y-1">
                    {(character.spells as any[])?.length > 0 ? (
                      (character.spells as any[]).slice(0, 8).map((spell: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-sm">{spell.name || spell}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))
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
    </div>
  );
}
