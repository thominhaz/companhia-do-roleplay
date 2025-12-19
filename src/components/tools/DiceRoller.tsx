import { useState } from "react";
import { ArrowLeft, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, Plus, Minus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DiceRollerProps {
  onBack: () => void;
}

type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

interface RollResult {
  dice: DiceType;
  results: number[];
  total: number;
  modifier: number;
  timestamp: Date;
}

const DICE_CONFIG: { type: DiceType; max: number; color: string }[] = [
  { type: "d4", max: 4, color: "from-emerald-500 to-emerald-600" },
  { type: "d6", max: 6, color: "from-blue-500 to-blue-600" },
  { type: "d8", max: 8, color: "from-purple-500 to-purple-600" },
  { type: "d10", max: 10, color: "from-orange-500 to-orange-600" },
  { type: "d12", max: 12, color: "from-pink-500 to-pink-600" },
  { type: "d20", max: 20, color: "from-primary to-primary/80" },
  { type: "d100", max: 100, color: "from-gold to-gold/80" },
];

export function DiceRoller({ onBack }: DiceRollerProps) {
  const [selectedDice, setSelectedDice] = useState<DiceType>("d20");
  const [diceCount, setDiceCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [currentResult, setCurrentResult] = useState<RollResult | null>(null);

  const rollDice = () => {
    const diceConfig = DICE_CONFIG.find((d) => d.type === selectedDice);
    if (!diceConfig) return;

    setIsRolling(true);

    // Simulate rolling animation
    setTimeout(() => {
      const results: number[] = [];
      for (let i = 0; i < diceCount; i++) {
        results.push(Math.floor(Math.random() * diceConfig.max) + 1);
      }

      const result: RollResult = {
        dice: selectedDice,
        results,
        total: results.reduce((a, b) => a + b, 0) + modifier,
        modifier,
        timestamp: new Date(),
      };

      setCurrentResult(result);
      setRollHistory((prev) => [result, ...prev.slice(0, 9)]);
      setIsRolling(false);
    }, 500);
  };

  const clearHistory = () => {
    setRollHistory([]);
    setCurrentResult(null);
  };

  const getDiceConfig = () => DICE_CONFIG.find((d) => d.type === selectedDice);

  const isCritical = currentResult?.dice === "d20" && currentResult.results.length === 1 && currentResult.results[0] === 20;
  const isCriticalFail = currentResult?.dice === "d20" && currentResult.results.length === 1 && currentResult.results[0] === 1;

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Rolador de Dados</h1>
            <p className="text-xs text-muted-foreground">Role qualquer combinação de dados</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Current Result */}
        <section className="glass rounded-2xl p-6 text-center">
          <div
            className={cn(
              "text-6xl font-bold mb-2 transition-all duration-300",
              isRolling && "animate-pulse scale-110",
              isCritical && "text-gold animate-bounce",
              isCriticalFail && "text-destructive"
            )}
          >
            {isRolling ? "..." : currentResult?.total ?? "—"}
          </div>
          {currentResult && !isRolling && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {currentResult.results.length}
                {currentResult.dice} = [{currentResult.results.join(", ")}]
                {currentResult.modifier !== 0 && (
                  <span className={currentResult.modifier > 0 ? "text-emerald-400" : "text-destructive"}>
                    {" "}
                    {currentResult.modifier > 0 ? "+" : ""}
                    {currentResult.modifier}
                  </span>
                )}
              </p>
              {isCritical && (
                <p className="text-gold font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  CRÍTICO!
                  <Sparkles className="w-4 h-4" />
                </p>
              )}
              {isCriticalFail && (
                <p className="text-destructive font-bold">FALHA CRÍTICA!</p>
              )}
            </div>
          )}
        </section>

        {/* Dice Selection */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Tipo de Dado
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {DICE_CONFIG.map((dice) => (
              <button
                key={dice.type}
                onClick={() => setSelectedDice(dice.type)}
                className={cn(
                  "p-3 rounded-xl font-bold transition-all",
                  selectedDice === dice.type
                    ? `bg-gradient-to-br ${dice.color} text-white shadow-lg scale-105`
                    : "glass hover:border-primary/50"
                )}
              >
                {dice.type.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Dice Count */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quantidade de Dados
          </h2>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDiceCount((c) => Math.max(1, c - 1))}
              disabled={diceCount <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-3xl font-bold w-16 text-center">{diceCount}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDiceCount((c) => Math.min(20, c + 1))}
              disabled={diceCount >= 20}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {/* Modifier */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Modificador
          </h2>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setModifier((m) => m - 1)}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span
              className={cn(
                "text-3xl font-bold w-20 text-center",
                modifier > 0 && "text-emerald-400",
                modifier < 0 && "text-destructive"
              )}
            >
              {modifier > 0 ? `+${modifier}` : modifier}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setModifier((m) => m + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {/* Roll Button */}
        <Button
          onClick={rollDice}
          disabled={isRolling}
          className={cn(
            "w-full h-14 text-lg font-bold bg-gradient-to-r",
            getDiceConfig()?.color
          )}
        >
          <Dice6 className={cn("w-6 h-6 mr-2", isRolling && "animate-spin")} />
          {isRolling ? "Rolando..." : `Rolar ${diceCount}${selectedDice.toUpperCase()}`}
          {modifier !== 0 && (modifier > 0 ? ` +${modifier}` : ` ${modifier}`)}
        </Button>

        {/* Roll History */}
        {rollHistory.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Histórico
              </h2>
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            </div>
            <div className="space-y-2">
              {rollHistory.map((roll, index) => (
                <div
                  key={index}
                  className="glass rounded-xl p-3 flex items-center justify-between animate-fade-in"
                >
                  <div>
                    <span className="font-medium">
                      {roll.results.length}
                      {roll.dice}
                    </span>
                    <span className="text-muted-foreground text-sm ml-2">
                      [{roll.results.join(", ")}]
                      {roll.modifier !== 0 && (
                        <span className={roll.modifier > 0 ? "text-emerald-400" : "text-destructive"}>
                          {roll.modifier > 0 ? ` +${roll.modifier}` : ` ${roll.modifier}`}
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-xl font-bold">{roll.total}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
