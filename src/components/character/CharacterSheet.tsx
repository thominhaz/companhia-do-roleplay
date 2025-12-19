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
  Edit3,
  MoreVertical,
  TrendingUp,
  FileText,
  Eye,
  Search,
  Lightbulb,
  Moon,
  Sunrise
} from "lucide-react";
import { useCharacter } from "@/hooks/useCharacters";
import { getModifier, getModifierString, getAttributeAbbr, getAttributeName } from "@/data/srd";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LevelUpSheet } from "./LevelUpSheet";
import { EditStatsSheet } from "./EditStatsSheet";
import { SpellsManagementSheet } from "./SpellsManagementSheet";
import { NotesSheet } from "./NotesSheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const ATTRIBUTES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

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

// Attribute Box Component
function AttributeBox({ 
  name, 
  score, 
  modifier 
}: { 
  name: string; 
  score: number; 
  modifier: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{name}</span>
      <div className="sheet-panel rounded-lg p-2 min-w-[56px] text-center">
        <div className="text-xl font-bold text-foreground">
          {modifier >= 0 ? '+' : ''}{modifier}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{score}</div>
      </div>
    </div>
  );
}

// Stat Box Component 
function StatBox({ 
  label, 
  value, 
  sublabel,
  className = ""
}: { 
  label: string; 
  value: string | number; 
  sublabel?: string;
  className?: string;
}) {
  return (
    <div className={`sheet-panel rounded-lg p-2 text-center min-w-[70px] ${className}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      {sublabel && <div className="text-[9px] text-muted-foreground">{sublabel}</div>}
    </div>
  );
}

// Saving Throw Row Component
function SavingThrowRow({
  attr,
  isProficient,
  total
}: {
  attr: string;
  isProficient: boolean;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
        isProficient ? 'bg-crimson border-crimson' : 'border-muted-foreground'
      }`}>
        {isProficient && <span className="text-[8px] text-white">✓</span>}
      </div>
      <span className="bg-dark-panel text-foreground text-xs font-bold px-2 py-0.5 rounded min-w-[32px] text-center">
        {getAttributeAbbr(attr)}
      </span>
      <span className="text-xs text-muted-foreground flex-1">{total >= 0 ? '+' : ''}{total}</span>
    </div>
  );
}

// Skill Row Component
function SkillRow({
  skill,
  attrAbbr,
  isProficient,
  hasExpertise,
  total
}: {
  skill: { id: string; name: string };
  attrAbbr: string;
  isProficient: boolean;
  hasExpertise: boolean;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className={`w-3 h-3 rounded-full border-2 ${
        hasExpertise ? 'bg-yellow-500 border-yellow-500' :
        isProficient ? 'bg-crimson border-crimson' : 'border-muted-foreground'
      }`} />
      <span className="text-[10px] text-muted-foreground w-7">{attrAbbr}</span>
      <span className="text-xs flex-1">{skill.name}</span>
      <span className="sheet-panel px-2 py-0.5 rounded text-xs font-bold min-w-[32px] text-center">
        {total >= 0 ? '+' : ''}{total}
      </span>
    </div>
  );
}

// Passive Stat Component
function PassiveStat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="sheet-panel rounded-lg p-2 flex items-center gap-2">
      <div className="bg-crimson-dark rounded p-1">
        <span className="text-lg font-bold text-white px-1">{value}</span>
      </div>
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading } = useCharacter(id || '');
  const [activeTab, setActiveTab] = useState('actions');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showEditStats, setShowEditStats] = useState(false);
  const [showSpells, setShowSpells] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-darker p-4">
        <Skeleton className="h-12 w-12 rounded-full mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl mb-4" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-darker flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Personagem não encontrado</p>
          <button 
            onClick={() => navigate('/characters')}
            className="px-4 py-2 bg-primary rounded-lg"
          >
            Voltar
          </button>
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

  const hpPercent = (character.current_hp / character.max_hp) * 100;

  // Get proficiencies
  const proficiencies = character.proficiencies as { armor?: string[]; weapons?: string[]; tools?: string[] } || {};
  const languages = character.languages as string[] || [];

  return (
    <div className="min-h-screen bg-[#1a1a1a] pb-24">
      {/* Header Row */}
      <div className="bg-[#1e1e1e] border-b border-[#333] p-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-dark-panel flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          {/* Avatar */}
          <div className="w-14 h-14 rounded-lg bg-dark-panel border-2 border-crimson overflow-hidden flex-shrink-0">
            {character.image_url ? (
              <img src={character.image_url} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Name & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold truncate">{character.name}</h1>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-[10px] px-2"
                onClick={() => setShowEditStats(true)}
              >
                EDITAR
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {character.race}{character.subrace ? ` (${character.subrace})` : ''} • {character.class} {character.level}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground">NVL {character.level}</span>
              <div className="flex-1 h-1 bg-muted rounded-full max-w-[100px]">
                <div className="h-full bg-crimson rounded-full" style={{ width: `${Math.min(100, (character.experience % 1000) / 10)}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{character.experience} XP</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1.5">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs gap-1 border-green-600 text-green-500 hover:bg-green-900/30"
              onClick={() => setShowLevelUp(true)}
            >
              <Moon className="w-3 h-3" />
              DESCANSO CURTO
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs gap-1 border-crimson text-crimson hover:bg-crimson/20"
            >
              <Sunrise className="w-3 h-3" />
              DESCANSO LONGO
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-dark">
                <DropdownMenuItem onClick={() => setShowLevelUp(true)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Subir de Nível
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNotes(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Notas e Anotações
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
      </div>

      {/* Attributes Row */}
      <div className="bg-[#1e1e1e] border-b border-[#333] p-3">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex gap-2">
            {ATTRIBUTES.map((attr) => {
              const score = attributes[attr] || 10;
              const mod = getModifier(score);
              return (
                <AttributeBox 
                  key={attr}
                  name={getAttributeAbbr(attr)}
                  score={score}
                  modifier={mod}
                />
              );
            })}
          </div>
          
          {/* Core Stats */}
          <div className="flex items-center gap-2">
            <StatBox label="BÔNUS" value={`+${character.proficiency_bonus}`} sublabel="PROFICIÊNCIA" />
            <StatBox label="DESLOCAMENTO" value={`${character.speed}m`} />
            
            {/* HP Section */}
            <div className="sheet-panel rounded-lg p-2 min-w-[150px]">
              <div className="flex items-center gap-1 mb-1">
                <Button variant="ghost" size="icon" className="h-5 w-5 text-green-500">
                  <Heart className="w-3 h-3" />
                </Button>
                <span className="text-[10px] text-green-500">HEAL</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500 ml-auto">
                  <span className="text-[10px]">DMG</span>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[10px] text-muted-foreground">ATUAL</span>
                <span className="text-2xl font-bold">{character.current_hp}</span>
                <span className="text-lg text-muted-foreground">/</span>
                <span className="text-2xl font-bold">{character.max_hp}</span>
                <span className="text-[10px] text-muted-foreground">MÁX</span>
                {character.temporary_hp > 0 && (
                  <span className="text-sm text-blue-400 ml-1">+{character.temporary_hp}</span>
                )}
              </div>
              <div className="text-[10px] text-center text-muted-foreground uppercase">Pontos de Vida</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex p-3 gap-3 h-[calc(100vh-220px)]">
        {/* Left Sidebar */}
        <div className="w-60 flex-shrink-0 space-y-3 overflow-y-auto">
          {/* Saving Throws Grid */}
          <div className="sheet-panel rounded-lg p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-0">
              {ATTRIBUTES.map((attr) => {
                const score = attributes[attr] || 10;
                const mod = getModifier(score);
                const isProficient = saves?.[attr]?.proficient || false;
                const total = mod + (isProficient ? character.proficiency_bonus : 0);
                return (
                  <SavingThrowRow
                    key={attr}
                    attr={attr}
                    isProficient={isProficient}
                    total={total}
                  />
                );
              })}
            </div>
            <div className="text-[10px] text-center text-muted-foreground uppercase mt-2 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              TESTES DE RESISTÊNCIA
            </div>
          </div>

          {/* Passive Scores */}
          <div className="space-y-2">
            <PassiveStat label="PERCEPÇÃO PASSIVA" value={passivePerception} icon={Eye} />
            <PassiveStat label="INVESTIGAÇÃO PASSIVA" value={passiveInvestigation} icon={Search} />
            <PassiveStat label="INTUIÇÃO PASSIVA" value={passiveInsight} icon={Lightbulb} />
          </div>

          {/* Senses */}
          <div className="sheet-panel rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Visão no Escuro 18m</div>
            <div className="text-[10px] text-center text-muted-foreground uppercase mt-2 flex items-center justify-center gap-1">
              <Eye className="w-3 h-3" />
              SENTIDOS
            </div>
          </div>

          {/* Proficiencies */}
          <div className="sheet-panel rounded-lg p-3 space-y-2">
            {proficiencies.armor && proficiencies.armor.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-crimson font-semibold">ARMADURAS</div>
                <div className="text-xs text-muted-foreground">{proficiencies.armor.join(', ')}</div>
              </div>
            )}
            {proficiencies.weapons && proficiencies.weapons.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-crimson font-semibold">ARMAS</div>
                <div className="text-xs text-muted-foreground">{proficiencies.weapons.join(', ')}</div>
              </div>
            )}
            {proficiencies.tools && proficiencies.tools.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-crimson font-semibold">FERRAMENTAS</div>
                <div className="text-xs text-muted-foreground">{proficiencies.tools.join(', ')}</div>
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-crimson font-semibold">IDIOMAS</div>
                <div className="text-xs text-muted-foreground">{languages.join(', ')}</div>
              </div>
            )}
            <div className="text-[10px] text-center text-muted-foreground uppercase mt-2 flex items-center justify-center gap-1">
              <BookOpen className="w-3 h-3" />
              PROFICIÊNCIAS & TREINO
            </div>
          </div>
        </div>

        {/* Skills Column */}
        <div className="w-56 flex-shrink-0">
          <div className="sheet-panel rounded-lg p-3 h-full">
            <ScrollArea className="h-[calc(100%-24px)]">
              <div className="space-y-0.5 pr-2">
                <div className="grid grid-cols-4 text-[9px] text-muted-foreground uppercase mb-1 px-1">
                  <span>PROF</span>
                  <span>MOD</span>
                  <span>PERÍCIA</span>
                  <span className="text-right">BÔNUS</span>
                </div>
                {SKILLS.map((skill) => {
                  const attrScore = attributes[skill.attr] || 10;
                  const mod = getModifier(attrScore);
                  const skillData = skills?.[skill.id];
                  const isProficient = skillData?.proficient || false;
                  const hasExpertise = skillData?.expertise || false;
                  const total = mod + (isProficient ? character.proficiency_bonus : 0) + (hasExpertise ? character.proficiency_bonus : 0);
                  return (
                    <SkillRow
                      key={skill.id}
                      skill={skill}
                      attrAbbr={getAttributeAbbr(skill.attr)}
                      isProficient={isProficient}
                      hasExpertise={hasExpertise}
                      total={total}
                    />
                  );
                })}
              </div>
            </ScrollArea>
            <div className="text-[10px] text-center text-muted-foreground uppercase mt-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              PERÍCIAS
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Initiative, AC, Defenses Row */}
          <div className="flex gap-3 mb-3">
            <StatBox label="INICIATIVA" value={`${character.initiative >= 0 ? '+' : ''}${character.initiative}`} />
            <div className="sheet-panel rounded-lg p-2 text-center">
              <div className="text-lg font-bold">{character.armor_class}</div>
              <div className="text-[10px] uppercase text-muted-foreground">CLASSE DE</div>
              <div className="text-[10px] uppercase text-muted-foreground">ARMADURA</div>
            </div>
            
            {/* Defenses */}
            <div className="sheet-panel rounded-lg p-2 flex-1">
              <div className="text-[10px] uppercase text-muted-foreground mb-1">DEFESAS</div>
              <div className="text-xs text-muted-foreground">Nenhuma</div>
            </div>
            
            {/* Conditions */}
            <div className="sheet-panel rounded-lg p-2 flex-1">
              <div className="text-[10px] uppercase text-muted-foreground mb-1">CONDIÇÕES</div>
              <div className="text-xs text-muted-foreground">Nenhuma condição ativa</div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="bg-[#1e1e1e] border border-[#333] p-0 h-auto flex-wrap justify-start">
              <TabsTrigger value="actions" className="text-xs data-[state=active]:bg-crimson data-[state=active]:text-white rounded-none px-3 py-2">
                AÇÕES
              </TabsTrigger>
              <TabsTrigger value="spells" className="text-xs data-[state=active]:bg-crimson data-[state=active]:text-white rounded-none px-3 py-2">
                MAGIAS
              </TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs data-[state=active]:bg-crimson data-[state=active]:text-white rounded-none px-3 py-2">
                INVENTÁRIO
              </TabsTrigger>
              <TabsTrigger value="features" className="text-xs data-[state=active]:bg-crimson data-[state=active]:text-white rounded-none px-3 py-2">
                HABILIDADES
              </TabsTrigger>
              <TabsTrigger value="background" className="text-xs data-[state=active]:bg-crimson data-[state=active]:text-white rounded-none px-3 py-2">
                HISTÓRIA
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs data-[state=active]:bg-crimson data-[state=active]:text-white rounded-none px-3 py-2">
                NOTAS
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 sheet-panel rounded-t-none rounded-b-lg mt-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                {/* Actions Tab */}
                <TabsContent value="actions" className="mt-0 space-y-4">
                  {/* Equipment as Actions */}
                  <div>
                    <div className="text-xs font-semibold text-crimson mb-2 flex items-center gap-2">
                      <Swords className="w-4 h-4" />
                      ATAQUES
                    </div>
                    {(character.equipment as any[])?.filter((item: any) => item.damage).length > 0 ? (
                      <div className="space-y-2">
                        {(character.equipment as any[])
                          .filter((item: any) => item.damage)
                          .map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-dark-panel rounded-lg border border-border/30">
                            <div className="flex items-center gap-3">
                              <Swords className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground">Arma Corpo a Corpo</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">1,5m</span>
                              <span className="sheet-panel px-2 py-1 rounded font-bold">+{character.proficiency_bonus + getModifier(attributes.strength || 10)}</span>
                              <span className="sheet-panel px-2 py-1 rounded">{item.damage}</span>
                              <span className="text-xs text-muted-foreground">{item.properties?.join(', ') || ''}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum ataque disponível</p>
                    )}
                  </div>

                  {/* Hit Dice & Death Saves */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-dark-panel rounded-lg p-3 border border-border/30">
                      <h3 className="text-xs font-semibold text-crimson mb-2">DADOS DE VIDA</h3>
                      <p className="text-xl font-bold">{(character.hit_dice as any)?.current || character.level}/{(character.hit_dice as any)?.total || character.level}</p>
                      <p className="text-xs text-muted-foreground">{(character.hit_dice as any)?.diceType || 'd8'}</p>
                    </div>
                    <div className="bg-dark-panel rounded-lg p-3 border border-border/30">
                      <h3 className="text-xs font-semibold text-crimson mb-2">TESTES CONTRA MORTE</h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-500 w-16">Sucessos:</span>
                          {[0, 1, 2].map(i => (
                            <div 
                              key={i}
                              className={`w-4 h-4 rounded-full border-2 ${
                                i < ((character.death_saves as any)?.successes || 0) ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-500 w-16">Falhas:</span>
                          {[0, 1, 2].map(i => (
                            <div 
                              key={i}
                              className={`w-4 h-4 rounded-full border-2 ${
                                i < ((character.death_saves as any)?.failures || 0) ? 'bg-red-500 border-red-500' : 'border-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Spells Tab */}
                <TabsContent value="spells" className="mt-0 space-y-4">
                  {character.spellcasting ? (
                    <>
                      <div className="flex gap-4">
                        <div className="bg-dark-panel rounded-lg p-3 border border-border/30">
                          <p className="text-xs text-muted-foreground">CD de Resistência</p>
                          <p className="text-xl font-bold">{(character.spellcasting as any)?.spellSaveDC || 8 + character.proficiency_bonus}</p>
                        </div>
                        <div className="bg-dark-panel rounded-lg p-3 border border-border/30">
                          <p className="text-xs text-muted-foreground">Bônus de Ataque</p>
                          <p className="text-xl font-bold">+{(character.spellcasting as any)?.spellAttackBonus || character.proficiency_bonus}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold text-crimson mb-2">MAGIAS CONHECIDAS</h3>
                        {(character.spells as any[])?.length > 0 ? (
                          <div className="space-y-2">
                            {(character.spells as any[]).map((spell: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-dark-panel rounded-lg border border-border/30">
                                <span className="text-sm">{spell.name || spell}</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhuma magia</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Este personagem não é um conjurador</p>
                    </div>
                  )}
                </TabsContent>

                {/* Inventory Tab */}
                <TabsContent value="inventory" className="mt-0 space-y-4">
                  {/* Currency */}
                  <div>
                    <h3 className="text-xs font-semibold text-crimson mb-2">MOEDAS</h3>
                    <div className="flex gap-4">
                      {[
                        { key: 'platinum', label: 'PL', color: 'text-gray-300' },
                        { key: 'gold', label: 'PO', color: 'text-yellow-500' },
                        { key: 'electrum', label: 'PE', color: 'text-blue-300' },
                        { key: 'silver', label: 'PP', color: 'text-gray-400' },
                        { key: 'copper', label: 'PC', color: 'text-orange-600' },
                      ].map(({ key, label, color }) => (
                        <div key={key} className="text-center bg-dark-panel p-2 rounded-lg border border-border/30">
                          <p className={`text-lg font-bold ${color}`}>
                            {(character.currency as any)?.[key] || 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <h3 className="text-xs font-semibold text-crimson mb-2">EQUIPAMENTO</h3>
                    {(character.equipment as any[])?.length > 0 ? (
                      <div className="space-y-2">
                        {(character.equipment as any[]).map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-dark-panel rounded-lg border border-border/30">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              {item.damage && (
                                <p className="text-xs text-muted-foreground">{item.damage} {item.damageType}</p>
                              )}
                            </div>
                            {item.equipped && (
                              <span className="text-xs bg-crimson/20 text-crimson px-2 py-1 rounded">Equipado</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum equipamento</p>
                    )}
                  </div>

                  {/* Inventory */}
                  <div>
                    <h3 className="text-xs font-semibold text-crimson mb-2">INVENTÁRIO</h3>
                    {(character.inventory as any[])?.length > 0 ? (
                      <div className="space-y-2">
                        {(character.inventory as any[]).map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-dark-panel rounded-lg border border-border/30">
                            <div>
                              <p className="text-sm">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">x{item.quantity || 1}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Inventário vazio</p>
                    )}
                  </div>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="mt-0 space-y-4">
                  <h3 className="text-xs font-semibold text-crimson mb-2">HABILIDADES E TRAÇOS</h3>
                  {(character.features as any[])?.length > 0 ? (
                    <div className="space-y-2">
                      {(character.features as any[]).map((feature: any, i: number) => (
                        <div key={i} className="p-3 bg-dark-panel rounded-lg border border-border/30">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{feature.name}</p>
                            {feature.source && (
                              <span className="text-xs text-muted-foreground">{feature.source}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma habilidade</p>
                  )}
                </TabsContent>

                {/* Background Tab */}
                <TabsContent value="background" className="mt-0 space-y-4">
                  {character.background && (
                    <div className="bg-dark-panel rounded-lg p-3 border border-border/30">
                      <h3 className="text-xs font-semibold text-crimson mb-2">ANTECEDENTE</h3>
                      <p className="text-sm">{character.background}</p>
                    </div>
                  )}
                  {character.alignment && (
                    <div className="bg-dark-panel rounded-lg p-3 border border-border/30">
                      <h3 className="text-xs font-semibold text-crimson mb-2">ALINHAMENTO</h3>
                      <p className="text-sm">{character.alignment}</p>
                    </div>
                  )}
                  {character.backstory && (
                    <div className="bg-dark-panel rounded-lg p-3 border border-border/30">
                      <h3 className="text-xs font-semibold text-crimson mb-2">HISTÓRIA</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{character.backstory}</p>
                    </div>
                  )}
                  {character.personality_traits && (
                    <div className="bg-dark-panel rounded-lg p-3 border border-border/30">
                      <h3 className="text-xs font-semibold text-crimson mb-2">TRAÇOS DE PERSONALIDADE</h3>
                      <p className="text-sm text-muted-foreground">{character.personality_traits}</p>
                    </div>
                  )}
                  {character.ideals && (
                    <div className="bg-dark-panel rounded-lg p-3 border border-border/30">
                      <h3 className="text-xs font-semibold text-crimson mb-2">IDEAIS</h3>
                      <p className="text-sm text-muted-foreground">{character.ideals}</p>
                    </div>
                  )}
                  {character.bonds && (
                    <div className="bg-dark-panel rounded-lg p-3 border border-border/30">
                      <h3 className="text-xs font-semibold text-crimson mb-2">VÍNCULOS</h3>
                      <p className="text-sm text-muted-foreground">{character.bonds}</p>
                    </div>
                  )}
                  {character.flaws && (
                    <div className="bg-dark-panel rounded-lg p-3 border border-border/30">
                      <h3 className="text-xs font-semibold text-crimson mb-2">DEFEITOS</h3>
                      <p className="text-sm text-muted-foreground">{character.flaws}</p>
                    </div>
                  )}
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="mt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-crimson">NOTAS E ANOTAÇÕES</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs border-crimson text-crimson hover:bg-crimson/20"
                      onClick={() => setShowNotes(true)}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Gerenciar Notas
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Use o botão acima para adicionar e gerenciar suas notas.</p>
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>
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
    </div>
  );
}
