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
  MoreVertical
} from "lucide-react";
import { useCharacter } from "@/hooks/useCharacters";
import { getModifier, getModifierString, getAttributeAbbr, getAttributeName } from "@/data/srd";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const classGradients: Record<string, string> = {
  'Guerreiro': 'from-purple-900 to-purple-700',
  'Mago': 'from-blue-900 to-blue-700',
  'Ladino': 'from-gray-800 to-gray-600',
  'Feiticeiro': 'from-red-900 to-red-700',
  'Bardo': 'from-pink-900 to-pink-700',
  'Clérigo': 'from-yellow-900 to-yellow-700',
  'Druida': 'from-green-900 to-green-700',
  'Monge': 'from-amber-900 to-amber-700',
  'Paladino': 'from-cyan-900 to-cyan-700',
  'Patrulheiro': 'from-emerald-900 to-emerald-700',
  'Bruxo': 'from-violet-900 to-violet-700',
  'Bárbaro': 'from-orange-900 to-orange-700',
};

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

export function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading } = useCharacter(id || '');
  const [activeTab, setActiveTab] = useState('stats');

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

  const gradient = classGradients[character.class] || 'from-purple-900 to-purple-700';
  const hpPercent = (character.current_hp / character.max_hp) * 100;
  const attributes = character.attributes as Record<string, number>;

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className={`bg-gradient-to-br ${gradient} px-4 pt-4 pb-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-60 h-60 bg-foreground opacity-5 rounded-full -mr-20 -mt-20" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-background/20 flex items-center justify-center">
              {character.image_url ? (
                <img src={character.image_url} alt={character.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <User className="w-10 h-10 opacity-60" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{character.name}</h1>
              <p className="text-sm opacity-80">
                {character.race}{character.subrace ? ` (${character.subrace})` : ''} • {character.class}
              </p>
              <p className="text-xs opacity-60 mt-1">
                Nível {character.level} • {character.experience} XP
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-background/20 rounded-xl p-3 text-center">
              <Heart className="w-4 h-4 mx-auto mb-1 opacity-80" />
              <p className="text-lg font-bold">{character.current_hp}/{character.max_hp}</p>
              <p className="text-[10px] opacity-60 uppercase">HP</p>
            </div>
            <div className="bg-background/20 rounded-xl p-3 text-center">
              <Shield className="w-4 h-4 mx-auto mb-1 opacity-80" />
              <p className="text-lg font-bold">{character.armor_class}</p>
              <p className="text-[10px] opacity-60 uppercase">CA</p>
            </div>
            <div className="bg-background/20 rounded-xl p-3 text-center">
              <Zap className="w-4 h-4 mx-auto mb-1 opacity-80" />
              <p className="text-lg font-bold">{character.initiative >= 0 ? '+' : ''}{character.initiative}</p>
              <p className="text-[10px] opacity-60 uppercase">Iniciativa</p>
            </div>
            <div className="bg-background/20 rounded-xl p-3 text-center">
              <Footprints className="w-4 h-4 mx-auto mb-1 opacity-80" />
              <p className="text-lg font-bold">{character.speed}m</p>
              <p className="text-[10px] opacity-60 uppercase">Deslocamento</p>
            </div>
          </div>
        </div>
      </header>

      {/* HP Bar */}
      <div className="px-4 -mt-2 relative z-20">
        <div className="bg-dark rounded-xl p-3 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Pontos de Vida</span>
            <span className="text-sm text-muted-foreground">
              {character.temporary_hp > 0 && `+${character.temporary_hp} temp`}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${
                hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, hpPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 mt-4">
        <TabsList className="grid grid-cols-4 bg-dark">
          <TabsTrigger value="stats" className="text-xs">Atributos</TabsTrigger>
          <TabsTrigger value="combat" className="text-xs">Combate</TabsTrigger>
          <TabsTrigger value="spells" className="text-xs">Magias</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs">Inventário</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-4 space-y-4">
          {/* Attributes */}
          <div className="bg-dark rounded-xl p-4 border border-border/50">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Atributos
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {ATTRIBUTES.map((attr) => {
                const score = attributes[attr] || 10;
                const mod = getModifier(score);
                return (
                  <div key={attr} className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase mb-1">{getAttributeAbbr(attr)}</p>
                    <p className="text-2xl font-bold">{mod >= 0 ? '+' : ''}{mod}</p>
                    <p className="text-xs text-muted-foreground">{score}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Proficiency Bonus */}
          <div className="bg-dark rounded-xl p-4 border border-border/50 flex items-center justify-between">
            <span className="text-sm">Bônus de Proficiência</span>
            <span className="text-xl font-bold text-primary">+{character.proficiency_bonus}</span>
          </div>

          {/* Saving Throws */}
          <div className="bg-dark rounded-xl p-4 border border-border/50">
            <h3 className="text-sm font-semibold mb-3">Testes de Resistência</h3>
            <div className="grid grid-cols-2 gap-2">
              {ATTRIBUTES.map((attr) => {
                const score = attributes[attr] || 10;
                const mod = getModifier(score);
                const saves = character.saving_throws as Record<string, { proficient: boolean }>;
                const isProficient = saves?.[attr]?.proficient || false;
                const total = mod + (isProficient ? character.proficiency_bonus : 0);
                return (
                  <div key={attr} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <div className={`w-3 h-3 rounded-full border-2 ${isProficient ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                    <span className="text-xs flex-1">{getAttributeAbbr(attr)}</span>
                    <span className="text-sm font-medium">{total >= 0 ? '+' : ''}{total}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-dark rounded-xl p-4 border border-border/50">
            <h3 className="text-sm font-semibold mb-3">Perícias</h3>
            <div className="space-y-1">
              {SKILLS.map((skill) => {
                const attrScore = attributes[skill.attr] || 10;
                const mod = getModifier(attrScore);
                const skills = character.skills as Record<string, { proficient?: boolean; expertise?: boolean }>;
                const skillData = skills?.[skill.id];
                const isProficient = skillData?.proficient || false;
                const hasExpertise = skillData?.expertise || false;
                const total = mod + (isProficient ? character.proficiency_bonus : 0) + (hasExpertise ? character.proficiency_bonus : 0);
                return (
                  <div key={skill.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      hasExpertise ? 'bg-yellow-500 border-yellow-500' :
                      isProficient ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`} />
                    <span className="text-sm flex-1">{skill.name}</span>
                    <span className="text-xs text-muted-foreground">{getAttributeAbbr(skill.attr)}</span>
                    <span className="text-sm font-medium w-8 text-right">{total >= 0 ? '+' : ''}{total}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Languages & Proficiencies */}
          <div className="bg-dark rounded-xl p-4 border border-border/50">
            <h3 className="text-sm font-semibold mb-3">Idiomas</h3>
            <div className="flex flex-wrap gap-2">
              {(character.languages as string[])?.map((lang, i) => (
                <span key={i} className="px-3 py-1 bg-muted/50 rounded-full text-xs">{lang}</span>
              ))}
              {(!character.languages || (character.languages as string[]).length === 0) && (
                <span className="text-muted-foreground text-sm">Nenhum idioma definido</span>
              )}
            </div>
          </div>

          {/* Background */}
          {(character.background || character.alignment) && (
            <div className="bg-dark rounded-xl p-4 border border-border/50">
              <h3 className="text-sm font-semibold mb-3">Antecedente</h3>
              {character.background && (
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="text-foreground font-medium">Antecedente:</span> {character.background}
                </p>
              )}
              {character.alignment && (
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">Alinhamento:</span> {character.alignment}
                </p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="combat" className="mt-4 space-y-4">
          {/* Hit Dice & Death Saves */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark rounded-xl p-4 border border-border/50">
              <h3 className="text-sm font-semibold mb-2">Dados de Vida</h3>
              <p className="text-2xl font-bold">{(character.hit_dice as any)?.current || 0}/{(character.hit_dice as any)?.total || character.level}</p>
              <p className="text-xs text-muted-foreground">{(character.hit_dice as any)?.diceType || 'd8'}</p>
            </div>
            <div className="bg-dark rounded-xl p-4 border border-border/50">
              <h3 className="text-sm font-semibold mb-2">Testes contra Morte</h3>
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

          {/* Equipment */}
          <div className="bg-dark rounded-xl p-4 border border-border/50">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Swords className="w-4 h-4 text-primary" />
              Equipamento
            </h3>
            {(character.equipment as any[])?.length > 0 ? (
              <div className="space-y-2">
                {(character.equipment as any[]).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.damage && (
                        <p className="text-xs text-muted-foreground">{item.damage} {item.damageType}</p>
                      )}
                    </div>
                    {item.equipped && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Equipado</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum equipamento</p>
            )}
          </div>

          {/* Features */}
          <div className="bg-dark rounded-xl p-4 border border-border/50">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Habilidades e Traços
            </h3>
            {(character.features as any[])?.length > 0 ? (
              <div className="space-y-2">
                {(character.features as any[]).map((feature, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{feature.name}</p>
                      {feature.source && (
                        <span className="text-xs text-muted-foreground">{feature.source}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma habilidade</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="spells" className="mt-4 space-y-4">
          {character.spellcasting ? (
            <>
              <div className="bg-dark rounded-xl p-4 border border-border/50">
                <h3 className="text-sm font-semibold mb-3">Conjuração</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">CD de Resistência</p>
                    <p className="text-xl font-bold">{(character.spellcasting as any)?.spellSaveDC || 8 + character.proficiency_bonus}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bônus de Ataque</p>
                    <p className="text-xl font-bold">+{(character.spellcasting as any)?.spellAttackBonus || character.proficiency_bonus}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark rounded-xl p-4 border border-border/50">
                <h3 className="text-sm font-semibold mb-3">Magias Conhecidas</h3>
                {(character.spells as any[])?.length > 0 ? (
                  <div className="space-y-2">
                    {(character.spells as any[]).map((spell, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
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
            <div className="bg-dark rounded-xl p-8 border border-border/50 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Este personagem não é um conjurador</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="mt-4 space-y-4">
          {/* Currency */}
          <div className="bg-dark rounded-xl p-4 border border-border/50">
            <h3 className="text-sm font-semibold mb-3">Moedas</h3>
            <div className="grid grid-cols-5 gap-2">
              {[
                { key: 'platinum', label: 'PL', color: 'text-gray-300' },
                { key: 'gold', label: 'PO', color: 'text-yellow-500' },
                { key: 'electrum', label: 'PE', color: 'text-blue-300' },
                { key: 'silver', label: 'PP', color: 'text-gray-400' },
                { key: 'copper', label: 'PC', color: 'text-orange-600' },
              ].map(({ key, label, color }) => (
                <div key={key} className="text-center">
                  <p className={`text-lg font-bold ${color}`}>
                    {(character.currency as any)?.[key] || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-dark rounded-xl p-4 border border-border/50">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Backpack className="w-4 h-4 text-primary" />
              Inventário
            </h3>
            {(character.inventory as any[])?.length > 0 ? (
              <div className="space-y-2">
                {(character.inventory as any[]).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
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
      </Tabs>
    </div>
  );
}
