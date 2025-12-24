import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Clock, Target, Component, ChevronUp, AlertTriangle, Focus } from "lucide-react";
import { toast } from "sonner";

interface SpellData {
  name: string;
  name_en?: string;
  level: number;
  school?: string;
  casting_time?: string;
  range?: string | number;
  components?: string | { verbal?: boolean; somatic?: boolean; material?: boolean; material_description?: string };
  duration?: string;
  concentration?: boolean;
  ritual?: boolean;
  description?: string;
  higher_levels?: string;
  at_higher_levels?: string;
}

interface ActiveConcentration {
  spellName: string;
  castAt: string; // ISO timestamp
}

interface SpellCastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spell: SpellData | null;
  spellSlots: number[]; // Max slots per level [1st, 2nd, ..., 9th]
  usedSlots: number[]; // Used slots per level
  onCast: (spellLevel: number, castAtLevel: number, isConcentration: boolean) => void;
  characterLevel: number;
  activeConcentration?: ActiveConcentration | null;
  onDropConcentration?: () => void;
}

const SPELL_SLOTS_BY_LEVEL: Record<string, number[]> = {
  "1": [2, 0, 0, 0, 0, 0, 0, 0, 0],
  "2": [3, 0, 0, 0, 0, 0, 0, 0, 0],
  "3": [4, 2, 0, 0, 0, 0, 0, 0, 0],
  "4": [4, 3, 0, 0, 0, 0, 0, 0, 0],
  "5": [4, 3, 2, 0, 0, 0, 0, 0, 0],
  "6": [4, 3, 3, 0, 0, 0, 0, 0, 0],
  "7": [4, 3, 3, 1, 0, 0, 0, 0, 0],
  "8": [4, 3, 3, 2, 0, 0, 0, 0, 0],
  "9": [4, 3, 3, 3, 1, 0, 0, 0, 0],
  "10": [4, 3, 3, 3, 2, 0, 0, 0, 0],
  "11": [4, 3, 3, 3, 2, 1, 0, 0, 0],
  "12": [4, 3, 3, 3, 2, 1, 0, 0, 0],
  "13": [4, 3, 3, 3, 2, 1, 1, 0, 0],
  "14": [4, 3, 3, 3, 2, 1, 1, 0, 0],
  "15": [4, 3, 3, 3, 2, 1, 1, 1, 0],
  "16": [4, 3, 3, 3, 2, 1, 1, 1, 0],
  "17": [4, 3, 3, 3, 2, 1, 1, 1, 1],
  "18": [4, 3, 3, 3, 3, 1, 1, 1, 1],
  "19": [4, 3, 3, 3, 3, 2, 1, 1, 1],
  "20": [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

const SPELL_SCHOOLS: Record<string, { name: string; color: string; icon: string }> = {
  "abjuration": { name: "Abjuração", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: "🛡️" },
  "conjuration": { name: "Conjuração", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: "✨" },
  "divination": { name: "Adivinhação", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: "👁️" },
  "enchantment": { name: "Encantamento", color: "bg-pink-500/20 text-pink-400 border-pink-500/30", icon: "💫" },
  "evocation": { name: "Evocação", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: "🔥" },
  "illusion": { name: "Ilusão", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", icon: "🌀" },
  "necromancy": { name: "Necromancia", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: "💀" },
  "transmutation": { name: "Transmutação", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: "🔄" },
};

export function SpellCastDialog({
  open,
  onOpenChange,
  spell,
  spellSlots,
  usedSlots,
  onCast,
  characterLevel,
  activeConcentration,
  onDropConcentration,
}: SpellCastDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showConcentrationWarning, setShowConcentrationWarning] = useState(false);

  // Reset selected level when spell changes
  useMemo(() => {
    if (spell && spell.level > 0) {
      setSelectedLevel(spell.level);
    } else {
      setSelectedLevel(null);
    }
  }, [spell]);

  if (!spell) return null;

  const isCantrip = spell.level === 0;
  const isConcentration = spell.concentration || false;
  const schoolInfo = spell.school ? SPELL_SCHOOLS[spell.school.toLowerCase()] : null;
  const hasActiveConcentration = !!activeConcentration;

  // Available levels for upcasting (spell level to 9th)
  const availableLevels = useMemo(() => {
    if (isCantrip) return [];
    const levels: { level: number; available: number; max: number }[] = [];
    for (let i = spell.level; i <= 9; i++) {
      const max = spellSlots[i - 1] || 0;
      const used = usedSlots[i - 1] || 0;
      if (max > 0) {
        levels.push({ level: i, available: max - used, max });
      }
    }
    return levels;
  }, [spell.level, spellSlots, usedSlots, isCantrip]);

  const canCast = isCantrip || (selectedLevel !== null && availableLevels.some(l => l.level === selectedLevel && l.available > 0));

  const handleCast = () => {
    // Check for concentration conflict
    if (isConcentration && hasActiveConcentration) {
      setShowConcentrationWarning(true);
      return;
    }

    executeCast();
  };

  const executeCast = () => {
    if (isCantrip) {
      onCast(0, 0, false);
      toast.success(`${spell.name} lançado!`, {
        description: "Truques podem ser lançados à vontade",
        icon: "✨",
      });
      onOpenChange(false);
      return;
    }

    if (selectedLevel === null) {
      toast.error("Selecione um nível para lançar a magia");
      return;
    }

    const levelData = availableLevels.find(l => l.level === selectedLevel);
    if (!levelData || levelData.available <= 0) {
      toast.error("Sem slots disponíveis neste nível");
      return;
    }

    onCast(spell.level, selectedLevel, isConcentration);
    
    const isUpcast = selectedLevel > spell.level;
    let description = isUpcast 
      ? `Lançado no ${selectedLevel}º nível (upcast)` 
      : `Slot de ${selectedLevel}º nível consumido`;
    
    if (isConcentration) {
      description += " • Concentração ativa";
    }
    
    toast.success(`${spell.name} lançado!`, {
      description,
      icon: "✨",
    });
    onOpenChange(false);
  };

  const handleConcentrationConfirm = () => {
    if (onDropConcentration) {
      onDropConcentration();
    }
    setShowConcentrationWarning(false);
    executeCast();
  };

  const formatRange = (range: SpellData['range']): string => {
    if (!range) return "—";
    if (typeof range === 'string') return range;
    if (typeof range === 'number') return `${range}m`;
    return "—";
  };

  const formatComponents = (components: SpellData['components']): string => {
    if (!components) return "—";
    if (typeof components === 'string') return components;
    const parts: string[] = [];
    if (components.verbal) parts.push('V');
    if (components.somatic) parts.push('S');
    if (components.material) parts.push('M');
    return parts.join(', ') || "—";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Lançar Magia
            </DialogTitle>
            <DialogDescription>
              {isCantrip ? "Truques podem ser lançados à vontade" : "Escolha o nível do slot para lançar"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Active Concentration Warning */}
            {hasActiveConcentration && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-2">
                <Focus className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">Concentração Ativa</p>
                  <p className="text-xs text-muted-foreground">
                    Você está concentrado em <strong>{activeConcentration.spellName}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Spell Info */}
            <div className="p-4 bg-muted/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                {schoolInfo && <span className="text-xl">{schoolInfo.icon}</span>}
                <h3 className="font-semibold text-lg">{spell.name}</h3>
                <Badge variant="outline" className={schoolInfo?.color || ""}>
                  {isCantrip ? "Truque" : `${spell.level}º Nível`}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{spell.casting_time || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Target className="w-3.5 h-3.5" />
                  <span>{formatRange(spell.range)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Component className="w-3.5 h-3.5" />
                  <span>{formatComponents(spell.components)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{spell.duration || "—"}</span>
                </div>
              </div>

              {isConcentration && (
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  <Zap className="w-3 h-3 mr-1" />
                  Concentração
                </Badge>
              )}
            </div>

            {/* Slot Selection for non-cantrips */}
            {!isCantrip && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ChevronUp className="w-4 h-4 text-primary" />
                  Nível do Slot
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableLevels.map(({ level, available, max }) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      disabled={available <= 0}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedLevel === level
                          ? "border-primary bg-primary/20"
                          : available > 0
                          ? "border-border hover:border-primary/50"
                          : "border-border/30 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="text-lg font-bold">{level}º</div>
                      <div className="text-xs text-muted-foreground">
                        {available}/{max} slots
                      </div>
                      {level > spell.level && (
                        <Badge variant="secondary" className="text-[9px] mt-1">
                          Upcast
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>

                {availableLevels.length === 0 && (
                  <p className="text-sm text-destructive text-center py-4">
                    Sem slots de magia disponíveis
                  </p>
                )}
              </div>
            )}

            {/* Higher Level Description */}
            {!isCantrip && selectedLevel && selectedLevel > spell.level && (spell.higher_levels || spell.at_higher_levels) && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl">
                <p className="text-xs font-medium text-primary mb-1">Em Níveis Superiores:</p>
                <p className="text-xs text-muted-foreground">
                  {spell.higher_levels || spell.at_higher_levels}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCast} disabled={!canCast} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {isCantrip ? "Lançar Truque" : "Lançar Magia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Concentration Warning Dialog */}
      <AlertDialog open={showConcentrationWarning} onOpenChange={setShowConcentrationWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Quebrar Concentração?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está concentrado em <strong className="text-foreground">{activeConcentration?.spellName}</strong>.
              </p>
              <p>
                Lançar <strong className="text-foreground">{spell.name}</strong> (que também requer concentração) 
                fará com que você perca a concentração na magia atual.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConcentrationConfirm} className="bg-yellow-600 hover:bg-yellow-700">
              Quebrar e Lançar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export { SPELL_SLOTS_BY_LEVEL };
export type { SpellData, ActiveConcentration };
