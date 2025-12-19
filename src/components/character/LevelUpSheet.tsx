import { useState } from "react";
import { TrendingUp, Sparkles, Heart, Dices } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpdateCharacter, CharacterDB } from "@/hooks/useCharacters";
import advancementData from "@/data/rules/avanco-personagem.json";

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

export function LevelUpSheet({ character, open, onOpenChange }: LevelUpSheetProps) {
  const updateCharacter = useUpdateCharacter();
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const [useAverage, setUseAverage] = useState(false);

  const levels = advancementData.character_advancement.levels;
  const currentLevel = character.level;
  const nextLevel = Math.min(currentLevel + 1, 20);
  const currentLevelData = levels.find(l => l.level === currentLevel);
  const nextLevelData = levels.find(l => l.level === nextLevel);

  const xpForNext = nextLevelData?.xp_required || 0;
  const canLevelUp = character.experience >= xpForNext && currentLevel < 20;

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

    const hpGain = calculateHpGain();
    const newProficiencyBonus = nextLevelData?.proficiency_bonus || character.proficiency_bonus;

    await updateCharacter.mutateAsync({
      id: character.id,
      level: nextLevel,
      max_hp: character.max_hp + hpGain,
      current_hp: character.current_hp + hpGain,
      proficiency_bonus: newProficiencyBonus,
      hit_dice: {
        ...(character.hit_dice as any),
        total: nextLevel,
        current: (character.hit_dice as any)?.current + 1 || nextLevel,
      },
    });

    setHpRoll(null);
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

                {/* Confirm */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={hpRoll === null || updateCharacter.isPending}
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