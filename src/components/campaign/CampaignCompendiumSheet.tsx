import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCampaignHomebrew } from "@/hooks/useHomebrew";
import { 
  Sparkles, 
  Gem, 
  Users, 
  Skull, 
  BookOpen, 
  Star,
  Loader2,
  Library,
  ChevronLeft,
  Wand2,
  Shield,
  Sword,
  Clock,
  Target,
  Zap,
  Heart,
  Eye,
  Languages,
  Footprints,
  Dumbbell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HomebrewContentType, HomebrewContent } from "@/types";

interface CampaignCompendiumSheetProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const contentTypes: { type: HomebrewContentType; label: string; singular: string; icon: React.ElementType; color: string }[] = [
  { type: 'spell', label: 'Magias', singular: 'magia', icon: Sparkles, color: 'from-accent to-accent/70' },
  { type: 'item', label: 'Itens', singular: 'item', icon: Gem, color: 'from-gold to-gold/70' },
  { type: 'race', label: 'Raças', singular: 'raça', icon: Users, color: 'from-primary to-primary/70' },
  { type: 'monster', label: 'Monstros', singular: 'monstro', icon: Skull, color: 'from-destructive to-destructive/70' },
  { type: 'background', label: 'Antecedentes', singular: 'antecedente', icon: BookOpen, color: 'from-secondary to-secondary/70' },
  { type: 'feat', label: 'Talentos', singular: 'talento', icon: Star, color: 'from-gold to-gold/70' },
];

// Helper to format attribute bonuses
const formatAttributeBonus = (attr: string) => {
  const map: Record<string, string> = {
    strength: 'Força',
    dexterity: 'Destreza',
    constitution: 'Constituição',
    intelligence: 'Inteligência',
    wisdom: 'Sabedoria',
    charisma: 'Carisma',
  };
  return map[attr] || attr;
};

export function CampaignCompendiumSheet({ campaignId, open, onOpenChange }: CampaignCompendiumSheetProps) {
  const [selectedType, setSelectedType] = useState<HomebrewContentType>('spell');
  const [selectedItem, setSelectedItem] = useState<HomebrewContent | null>(null);
  const { sharedContent, isLoading } = useCampaignHomebrew(campaignId);

  const homebrewContent = sharedContent.map(item => item.content);
  const filteredContent = homebrewContent.filter(item => item.type === selectedType);
  const selectedTypeInfo = contentTypes.find(t => t.type === selectedType);

  const renderFullItemDetails = (item: HomebrewContent) => {
    const data = item.data as Record<string, any>;
    
    switch (item.type) {
      case 'spell':
        return (
          <div className="space-y-4">
            {/* Spell Header Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Wand2 className="w-3 h-3" />
                  Nível
                </div>
                <p className="font-semibold">{data.level === 0 ? 'Truque' : `${data.level}º Círculo`}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <BookOpen className="w-3 h-3" />
                  Escola
                </div>
                <p className="font-semibold">{data.school}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="w-3 h-3" />
                  Tempo de Conjuração
                </div>
                <p className="font-semibold">{data.casting_time}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Target className="w-3 h-3" />
                  Alcance
                </div>
                <p className="font-semibold">{data.range}</p>
              </div>
            </div>

            {/* Components */}
            {data.components && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Componentes</p>
                <p className="font-medium">{data.components}</p>
              </div>
            )}

            {/* Duration */}
            {data.duration && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Duração</p>
                <p className="font-medium">{data.duration}</p>
              </div>
            )}

            {/* Classes */}
            {data.classes && data.classes.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Classes</p>
                <div className="flex flex-wrap gap-1">
                  {data.classes.map((cls: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {cls}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Descrição</p>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {data.description || item.description || 'Sem descrição'}
                </p>
              </div>
            </div>

            {/* Higher Levels */}
            {data.higher_levels && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Em Níveis Superiores</p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">{data.higher_levels}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'item':
        return (
          <div className="space-y-4">
            {/* Item Header Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Gem className="w-3 h-3" />
                  Tipo
                </div>
                <p className="font-semibold">{data.type || data.tipo || 'Item'}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Star className="w-3 h-3" />
                  Raridade
                </div>
                <p className="font-semibold capitalize">{data.rarity || data.raridade || 'Comum'}</p>
              </div>
            </div>

            {/* Damage / AC / Weight */}
            <div className="flex flex-wrap gap-2">
              {data.damage && (
                <div className="bg-red-500/10 text-red-500 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Sword className="w-4 h-4" />
                  <span className="font-semibold">{data.damage}</span>
                </div>
              )}
              {(data.ac || data.armor_class) && (
                <div className="bg-blue-500/10 text-blue-500 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-semibold">CA +{data.ac || data.armor_class}</span>
                </div>
              )}
              {data.weight && (
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="font-semibold">{data.weight}</span>
                </div>
              )}
            </div>

            {/* Attunement */}
            {data.attunement && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-sm text-purple-500 font-medium">
                  <Zap className="w-4 h-4 inline mr-2" />
                  Requer Sintonização {typeof data.attunement === 'string' ? `(${data.attunement})` : ''}
                </p>
              </div>
            )}

            {/* Properties */}
            {data.properties && data.properties.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Propriedades</p>
                <div className="flex flex-wrap gap-1">
                  {data.properties.map((prop: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {prop}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Descrição</p>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {data.description || item.description || 'Sem descrição'}
                </p>
              </div>
            </div>

            {/* Effect */}
            {data.effect && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Efeito</p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.effect}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'race':
        return (
          <div className="space-y-4">
            {/* Race Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Footprints className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Velocidade</p>
                <p className="font-bold text-lg">{data.speed}m</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Tamanho</p>
                <p className="font-bold text-lg">{data.size}</p>
              </div>
              {data.darkvision && (
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Eye className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Visão no Escuro</p>
                  <p className="font-bold text-lg">{data.darkvision}m</p>
                </div>
              )}
            </div>

            {/* Attribute Bonuses */}
            {data.attribute_bonuses && Object.keys(data.attribute_bonuses).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Bônus de Atributos</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.attribute_bonuses).map(([attr, bonus]) => (
                    <div key={attr} className="bg-primary/10 text-primary rounded-lg px-3 py-2">
                      <span className="font-semibold">+{bonus as number} {formatAttributeBonus(attr)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {data.languages && data.languages.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  Idiomas
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.languages.map((lang: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {(data.description || item.description) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Descrição</p>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {data.description || item.description}
                  </p>
                </div>
              </div>
            )}

            {/* Traits */}
            {data.traits && data.traits.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Traços Raciais</p>
                <div className="space-y-3">
                  {data.traits.map((trait: any, idx: number) => (
                    <div key={idx} className="bg-card border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2">{trait.name}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {trait.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'monster':
        return (
          <div className="space-y-4">
            {/* Monster Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-500/10 rounded-lg p-3 text-center">
                <Skull className="w-4 h-4 mx-auto mb-1 text-red-500" />
                <p className="text-xs text-muted-foreground">ND</p>
                <p className="font-bold text-lg text-red-500">{data.challenge_rating || data.cr}</p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <Heart className="w-4 h-4 mx-auto mb-1 text-green-500" />
                <p className="text-xs text-muted-foreground">PV</p>
                <p className="font-bold text-lg text-green-500">{data.hit_points || data.hp}</p>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <Shield className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                <p className="text-xs text-muted-foreground">CA</p>
                <p className="font-bold text-lg text-blue-500">{data.armor_class || data.ac}</p>
              </div>
            </div>

            {/* Type, Size, Alignment */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{data.size || 'Médio'}</Badge>
              <Badge variant="outline">{data.type || data.tipo}</Badge>
              {data.alignment && <Badge variant="outline">{data.alignment}</Badge>}
            </div>

            {/* Speed */}
            {data.speed && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Velocidade</p>
                <p className="font-medium">{typeof data.speed === 'object' ? JSON.stringify(data.speed) : data.speed}</p>
              </div>
            )}

            {/* Attributes */}
            {data.attributes && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Atributos</p>
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(data.attributes).map(([attr, value]) => (
                    <div key={attr} className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">{attr.slice(0, 3)}</p>
                      <p className="font-bold">{value as number}</p>
                      <p className="text-xs text-muted-foreground">
                        ({Math.floor(((value as number) - 10) / 2) >= 0 ? '+' : ''}{Math.floor(((value as number) - 10) / 2)})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {(data.description || item.description) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Descrição</p>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {data.description || item.description}
                  </p>
                </div>
              </div>
            )}

            {/* Abilities */}
            {data.abilities && data.abilities.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Habilidades</p>
                <div className="space-y-3">
                  {data.abilities.map((ability: any, idx: number) => (
                    <div key={idx} className="bg-card border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2">{ability.name}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {ability.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {data.actions && data.actions.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Ações</p>
                <div className="space-y-3">
                  {data.actions.map((action: any, idx: number) => (
                    <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 text-red-500">{action.name}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'background':
        return (
          <div className="space-y-4">
            {/* Description */}
            {(data.description || item.description) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Descrição</p>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {data.description || item.description}
                  </p>
                </div>
              </div>
            )}

            {/* Skill Proficiencies */}
            {data.skill_proficiencies && data.skill_proficiencies.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" />
                  Proficiências em Perícias
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.skill_proficiencies.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tool Proficiencies */}
            {data.tool_proficiencies && data.tool_proficiencies.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Proficiências em Ferramentas</p>
                <div className="flex flex-wrap gap-1">
                  {data.tool_proficiencies.map((tool: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {data.languages && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Idiomas</p>
                <p className="font-medium">{data.languages}</p>
              </div>
            )}

            {/* Equipment */}
            {data.equipment && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Equipamento</p>
                <p className="font-medium">{data.equipment}</p>
              </div>
            )}

            {/* Feature */}
            {data.feature_name && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Característica</p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 text-primary">{data.feature_name}</h4>
                  <p className="text-sm leading-relaxed">{data.feature_description}</p>
                </div>
              </div>
            )}

            {/* Personality Suggestions */}
            {(data.personality_traits || data.ideals || data.bonds || data.flaws) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Sugestões de Personalidade</p>
                <div className="space-y-3">
                  {data.personality_traits && data.personality_traits.length > 0 && (
                    <div className="bg-card border border-border rounded-lg p-3">
                      <h5 className="font-medium text-xs mb-1">Traços de Personalidade</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {data.personality_traits.map((t: string, idx: number) => (
                          <li key={idx}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.ideals && data.ideals.length > 0 && (
                    <div className="bg-card border border-border rounded-lg p-3">
                      <h5 className="font-medium text-xs mb-1">Ideais</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {data.ideals.map((t: string, idx: number) => (
                          <li key={idx}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.bonds && data.bonds.length > 0 && (
                    <div className="bg-card border border-border rounded-lg p-3">
                      <h5 className="font-medium text-xs mb-1">Vínculos</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {data.bonds.map((t: string, idx: number) => (
                          <li key={idx}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.flaws && data.flaws.length > 0 && (
                    <div className="bg-card border border-border rounded-lg p-3">
                      <h5 className="font-medium text-xs mb-1">Defeitos</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {data.flaws.map((t: string, idx: number) => (
                          <li key={idx}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'feat':
        return (
          <div className="space-y-4">
            {/* Prerequisite */}
            {data.prerequisite && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-500">
                  <strong>Pré-requisito:</strong> {data.prerequisite}
                </p>
              </div>
            )}

            {/* Description */}
            {(data.description || item.description) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Descrição</p>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {data.description || item.description}
                  </p>
                </div>
              </div>
            )}

            {/* Benefits */}
            {data.benefits && data.benefits.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Benefícios</p>
                <div className="space-y-2">
                  {data.benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                      <Star className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm leading-relaxed">{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {item.description || 'Sem descrição disponível'}
            </p>
          </div>
        );
    }
  };

  // Detail view for selected item
  if (selectedItem) {
    const typeInfo = contentTypes.find(t => t.type === selectedItem.type);
    
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
          {/* Header */}
          <div className={cn(
            "p-4 border-b border-border bg-gradient-to-br",
            typeInfo?.color,
            "bg-opacity-10"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItem(null)}
              className="mb-3 -ml-2 text-white/80 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-white/20"
              )}>
                {selectedItem.icon || '✨'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white">{selectedItem.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {typeInfo?.singular}
                  </Badge>
                  <Badge className="bg-amber-500/80 text-white border-0 text-xs">
                    Homebrew
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[calc(90vh-140px)] px-4 py-4">
            {renderFullItemDetails(selectedItem)}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Library className="w-5 h-5 text-primary" />
            Compêndio da Campanha
          </SheetTitle>
        </SheetHeader>

        {/* Content Type Tabs */}
        <div className="flex gap-2 overflow-x-auto p-4 pb-2 scrollbar-hide">
          {contentTypes.map((type) => {
            const Icon = type.icon;
            const count = homebrewContent?.filter(item => item.type === type.type).length || 0;
            const isSelected = selectedType === type.type;
            return (
              <button
                key={type.type}
                onClick={() => setSelectedType(type.type)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl transition-all flex-shrink-0",
                  isSelected 
                    ? `bg-gradient-to-r ${type.color} text-white` 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{type.label}</span>
                {count > 0 && (
                  <Badge variant="secondary" className={cn(
                    "text-[10px] px-1.5",
                    isSelected ? "bg-white/20 text-white" : ""
                  )}>
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <ScrollArea className="h-[calc(85vh-140px)] px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <div className={cn(
                "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br",
                selectedTypeInfo?.color,
                "opacity-50"
              )}>
                {selectedTypeInfo && <selectedTypeInfo.icon className="w-8 h-8 text-white" />}
              </div>
              <h3 className="font-semibold text-foreground">
                Nenhum {selectedTypeInfo?.singular} compartilhado
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                O mestre ainda não compartilhou conteúdo deste tipo com a campanha.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {filteredContent.map((item) => {
                const data = item.data as Record<string, any>;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className="w-full text-left bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-br",
                        selectedTypeInfo?.color
                      )}>
                        {item.icon || '✨'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30 flex-shrink-0">
                            Homebrew
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {data.description || item.description || 'Toque para ver detalhes'}
                        </p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180 flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
