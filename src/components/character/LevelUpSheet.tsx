import { useState, useMemo } from "react";
import { TrendingUp, Sparkles, Heart, Dices, Award, Check, Search, Gem } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useUpdateCharacter, CharacterDB } from "@/hooks/useCharacters";
import { useHomebrew } from "@/hooks/useHomebrew";
import advancementData from "@/data/rules/avanco-personagem.json";
import { cn } from "@/lib/utils";

interface LevelUpSheetProps {
  character: CharacterDB;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CLASS_HIT_DICE: Record<string, { dice: string; avg: number }> = {
  Bárbaro: { dice: "d12", avg: 7 },
  Guerreiro: { dice: "d10", avg: 6 },
  Paladino: { dice: "d10", avg: 6 },
  Patrulheiro: { dice: "d10", avg: 6 },
  Bardo: { dice: "d8", avg: 5 },
  Clérigo: { dice: "d8", avg: 5 },
  Druida: { dice: "d8", avg: 5 },
  Monge: { dice: "d8", avg: 5 },
  Ladino: { dice: "d8", avg: 5 },
  Bruxo: { dice: "d8", avg: 5 },
  Feiticeiro: { dice: "d6", avg: 4 },
  Mago: { dice: "d6", avg: 4 },
};

// Feat levels (4, 8, 12, 16, 19 for most classes)
const FEAT_LEVELS = [4, 8, 12, 16, 19];

// Standard feats from SRD
const STANDARD_FEATS = [
  { id: "alert", name: "Alerta", description: "Bônus +5 na iniciativa e não pode ser surpreendido" },
  { id: "athlete", name: "Atleta", description: "Aumenta FOR ou DES em 1 e vantagens em acrobacias" },
  { id: "actor", name: "Ator", description: "Aumenta CAR em 1 e vantagem em disfarces" },
  { id: "charger", name: "Investidor", description: "Após Disparada, pode fazer ataque bônus" },
  { id: "crossbow_expert", name: "Especialista em Besta", description: "Ignora recarga e penalidades de combate próximo" },
  { id: "defensive_duelist", name: "Duelista Defensivo", description: "Reação para aumentar CA com arma de acuidade" },
  { id: "dual_wielder", name: "Combatente com Duas Armas", description: "+1 CA e armas não-leves em ambas as mãos" },
  { id: "dungeon_delver", name: "Explorador de Masmorras", description: "Vantagem em armadilhas e passagens secretas" },
  { id: "durable", name: "Durão", description: "Aumenta CON em 1 e recupera mais HP em descansos" },
  { id: "grappler", name: "Lutador", description: "Vantagem em agarrar e pode restringir criaturas" },
  { id: "great_weapon_master", name: "Mestre em Armas Grandes", description: "-5 ataque/+10 dano e ataque bônus ao derrubar" },
  { id: "healer", name: "Curandeiro", description: "Kit de cura restaura 1d6+4+nível HP" },
  { id: "heavily_armored", name: "Armadura Pesada", description: "Proficiência em armaduras pesadas e +1 FOR" },
  { id: "inspiring_leader", name: "Líder Inspirador", description: "Concede HP temporário aos aliados" },
  { id: "lucky", name: "Sortudo", description: "3 pontos de sorte para re-rolar d20s" },
  { id: "mage_slayer", name: "Matador de Magos", description: "Reações contra conjuradores adjacentes" },
  { id: "mobile", name: "Mobilidade", description: "+3m de deslocamento e esquiva após ataques" },
  { id: "observant", name: "Observador", description: "+5 em percepção e investigação passivas" },
  { id: "resilient", name: "Resiliente", description: "+1 em atributo e proficiência na salvaguarda" },
  { id: "sentinel", name: "Sentinela", description: "Reações de oportunidade param inimigos" },
  { id: "sharpshooter", name: "Atirador Aguçado", description: "-5 ataque/+10 dano à distância" },
  { id: "shield_master", name: "Mestre dos Escudos", description: "Empurrar com escudo e bônus em salvaguardas" },
  { id: "skilled", name: "Habilidoso", description: "Proficiência em 3 perícias ou ferramentas" },
  { id: "skulker", name: "Furtivo", description: "Pode se esconder com pouca obscuridade" },
  { id: "spell_sniper", name: "Atirador Mágico", description: "Dobra alcance de ataques mágicos" },
  { id: "tavern_brawler", name: "Brigão de Taverna", description: "Armas improvisadas e agarrar como bônus" },
  { id: "tough", name: "Robusto", description: "+2 HP por nível" },
  { id: "war_caster", name: "Conjurador de Guerra", description: "Vantagem em concentração e magias como reação" },
];

export function LevelUpSheet({ character, open, onOpenChange }: LevelUpSheetProps) {
  const updateCharacter = useUpdateCharacter();
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const [useAverage, setUseAverage] = useState(false);
  const [selectedFeat, setSelectedFeat] = useState<string | null>(null);
  const [featSearch, setFeatSearch] = useState("");
  
  // Fetch homebrew feats
  const { homebrewContent: homebrewFeats, isLoading: loadingFeats } = useHomebrew('feat');

  const levels = advancementData.character_advancement.levels;
  const currentLevel = character.level;
  const nextLevel = Math.min(currentLevel + 1, 20);
  const currentLevelData = levels.find(l => l.level === currentLevel);
  const nextLevelData = levels.find(l => l.level === nextLevel);

  const xpForNext = nextLevelData?.xp_required || 0;
  const canLevelUp = character.experience >= xpForNext && currentLevel < 20;
  
  // Check if next level grants a feat
  const grantsFeat = FEAT_LEVELS.includes(nextLevel);
  
  // Filter feats by search
  const filteredFeats = useMemo(() => {
    const allFeats = [
      ...homebrewFeats.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description || '',
        isHomebrew: true,
        icon: f.icon,
      })),
      ...STANDARD_FEATS.map(f => ({ ...f, isHomebrew: false })),
    ];
    
    if (!featSearch) return allFeats;
    return allFeats.filter(f => 
      f.name.toLowerCase().includes(featSearch.toLowerCase())
    );
  }, [homebrewFeats, featSearch]);

  const classData = CLASS_HIT_DICE[character.class] || { dice: "d8", avg: 5 };
  const conMod = Math.floor(((character.attributes as any)?.constitution || 10) - 10) / 2;

  const rollHitDie = () => {
    const diceValue = parseInt(classData.dice.replace("d", ""));
    const roll = Math.floor(Math.random() * diceValue) + 1;
    setHpRoll(roll);
    setUseAverage(false);
  };

  const selectAverage = () => {
    setHpRoll(classData.avg);
    setUseAverage(true);
  };

  const calculateHpGain = () => {
    if (hpRoll === null) return 0;
    return Math.max(1, hpRoll + conMod);
  };

  const handleLevelUp = async () => {
    if (!canLevelUp || hpRoll === null) return;
    if (grantsFeat && !selectedFeat) return; // Must select feat if level grants one

    const hpGain = calculateHpGain();
    const newProficiencyBonus = nextLevelData?.proficiency_bonus || character.proficiency_bonus;
    
    // Get existing features and add the selected feat
    const existingFeatures = (character.features as any[]) || [];
    const updatedFeatures = grantsFeat && selectedFeat
      ? [...existingFeatures, { name: selectedFeat, source: 'feat', level: nextLevel }]
      : existingFeatures;

    await updateCharacter.mutateAsync({
      id: character.id,
      level: nextLevel,
      max_hp: character.max_hp + hpGain,
      current_hp: character.current_hp + hpGain,
      proficiency_bonus: newProficiencyBonus,
      features: updatedFeatures,
      hit_dice: {
        ...(character.hit_dice as any),
        total: nextLevel,
        current: (character.hit_dice as any)?.current + 1 || nextLevel,
      },
    });

    setHpRoll(null);
    setSelectedFeat(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] bg-darker">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Subir de Nível
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full py-4">
          <div className="space-y-6">
            {/* Current Status */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nível Atual</p>
                  <p className="text-3xl font-bold">{currentLevel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Experiência</p>
                  <p className="text-xl font-semibold">{character.experience} XP</p>
                </div>
              </div>

              {/* XP Progress */}
              {currentLevel < 20 && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{currentLevelData?.xp_required || 0} XP</span>
                    <span>{xpForNext} XP</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, ((character.experience - (currentLevelData?.xp_required || 0)) / (xpForNext - (currentLevelData?.xp_required || 0))) * 100)}%`,
                      }}
                    />
                  </div>
                  {!canLevelUp && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Faltam {xpForNext - character.experience} XP para o próximo nível
                    </p>
                  )}
                </div>
              )}
            </div>

            {canLevelUp ? (
              <>
                {/* Level Up Preview */}
                <div className="glass rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Nível {nextLevel}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Bônus de Proficiência</p>
                      <p className="text-xl font-bold text-primary">+{nextLevelData?.proficiency_bonus}</p>
                      {nextLevelData?.proficiency_bonus !== currentLevelData?.proficiency_bonus && (
                        <Badge className="mt-1 bg-green-500/20 text-green-400 text-xs">Aumentou!</Badge>
                      )}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Dados de Vida</p>
                      <p className="text-xl font-bold">{nextLevel}{classData.dice}</p>
                    </div>
                  </div>
                </div>

                {/* HP Roll */}
                <div className="glass rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Pontos de Vida Adicionais
                  </h3>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={rollHitDie}
                      >
                        <Dices className="w-4 h-4 mr-2" />
                        Rolar {classData.dice}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={selectAverage}
                      >
                        Usar Média ({classData.avg})
                      </Button>
                    </div>

                    {hpRoll !== null && (
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          {useAverage ? "Valor Médio" : "Resultado da Rolagem"}
                        </p>
                        <p className="text-3xl font-bold text-primary">{hpRoll}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          + {conMod >= 0 ? conMod : conMod} (CON) = 
                          <span className="text-foreground font-bold ml-1">
                            +{calculateHpGain()} HP
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feat Selection - Only show if level grants a feat */}
                {grantsFeat && (
                  <div className="glass rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      Escolher Talento
                      <Badge variant="secondary" className="ml-auto text-xs">Nível {nextLevel}</Badge>
                    </h3>

                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar talento..."
                          value={featSearch}
                          onChange={(e) => setFeatSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {filteredFeats.map((feat) => (
                            <button
                              key={feat.id}
                              onClick={() => setSelectedFeat(feat.name)}
                              className={cn(
                                "w-full p-3 rounded-lg text-left transition-all flex items-start gap-3",
                                selectedFeat === feat.name
                                  ? feat.isHomebrew 
                                    ? "bg-amber-500/20 border border-amber-500/50"
                                    : "bg-primary/20 border border-primary/50"
                                  : "bg-muted/50 hover:bg-muted"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                                selectedFeat === feat.name
                                  ? feat.isHomebrew 
                                    ? "border-amber-500 bg-amber-500"
                                    : "border-primary bg-primary"
                                  : "border-muted-foreground"
                              )}>
                                {selectedFeat === feat.name && (
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {feat.isHomebrew && (
                                    <Gem className="w-3 h-3 text-amber-500" />
                                  )}
                                  <span className="text-sm font-medium">{feat.name}</span>
                                  {feat.isHomebrew && (
                                    <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500">
                                      Homebrew
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {feat.description}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>

                      {selectedFeat && (
                        <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
                          <p className="text-sm">
                            <span className="text-muted-foreground">Talento selecionado: </span>
                            <span className="font-semibold text-primary">{selectedFeat}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Confirm */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={hpRoll === null || updateCharacter.isPending || (grantsFeat && !selectedFeat)}
                  onClick={handleLevelUp}
                >
                  {updateCharacter.isPending ? "Subindo de nível..." : "Confirmar Level Up"}
                </Button>
              </>
            ) : currentLevel >= 20 ? (
              <div className="glass rounded-xl p-8 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                <p className="text-lg font-semibold">Nível Máximo!</p>
                <p className="text-sm text-muted-foreground">
                  Você alcançou o nível 20, o máximo possível.
                </p>
              </div>
            ) : (
              <div className="glass rounded-xl p-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-lg font-semibold">Continue Aventurando!</p>
                <p className="text-sm text-muted-foreground">
                  Você precisa de mais {xpForNext - character.experience} XP para subir de nível.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}