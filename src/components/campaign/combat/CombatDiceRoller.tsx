import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, X, Plus } from "lucide-react";

interface DiceRollResult {
  id: string;
  expression: string;
  label: string;
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: Date;
}

interface CombatDiceRollerProps {
  onRollComplete?: (result: DiceRollResult) => void;
}

const QUICK_ROLLS = [
  { label: "d20", expression: "1d20" },
  { label: "d20+5", expression: "1d20+5" },
  { label: "d20+8", expression: "1d20+8" },
  { label: "2d6", expression: "2d6" },
  { label: "1d8+4", expression: "1d8+4" },
  { label: "2d6+3", expression: "2d6+3" },
];

export function CombatDiceRoller({ onRollComplete }: CombatDiceRollerProps) {
  const [customExpression, setCustomExpression] = useState("");
  const [rollHistory, setRollHistory] = useState<DiceRollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [currentRoll, setCurrentRoll] = useState<DiceRollResult | null>(null);

  const parseDiceExpression = (expression: string): { count: number; sides: number; modifier: number } | null => {
    const match = expression.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
    if (!match) return null;
    
    return {
      count: parseInt(match[1] || '1'),
      sides: parseInt(match[2]),
      modifier: parseInt(match[3] || '0')
    };
  };

  const rollDice = useCallback((expression: string, label?: string) => {
    const parsed = parseDiceExpression(expression.replace(/\s/g, ''));
    if (!parsed) return;

    setIsRolling(true);

    // Simulate rolling animation
    setTimeout(() => {
      const rolls: number[] = [];
      for (let i = 0; i < parsed.count; i++) {
        rolls.push(Math.floor(Math.random() * parsed.sides) + 1);
      }

      const total = rolls.reduce((a, b) => a + b, 0) + parsed.modifier;
      
      const result: DiceRollResult = {
        id: crypto.randomUUID(),
        expression,
        label: label || expression,
        rolls,
        modifier: parsed.modifier,
        total,
        timestamp: new Date()
      };

      setCurrentRoll(result);
      setRollHistory(prev => [result, ...prev.slice(0, 9)]);
      onRollComplete?.(result);
      setIsRolling(false);
    }, 300);
  }, [onRollComplete]);

  const handleCustomRoll = () => {
    if (!customExpression.trim()) return;
    rollDice(customExpression);
    setCustomExpression("");
  };

  const isCritical = (result: DiceRollResult) => {
    return result.rolls.length === 1 && result.rolls[0] === 20;
  };

  const isFumble = (result: DiceRollResult) => {
    return result.rolls.length === 1 && result.rolls[0] === 1;
  };

  return (
    <div className="space-y-4">
      {/* Quick Rolls */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ROLLS.map((roll) => (
          <Button
            key={roll.expression}
            variant="outline"
            size="sm"
            onClick={() => rollDice(roll.expression, roll.label)}
            disabled={isRolling}
            className="h-8"
          >
            <Dices className="w-3 h-3 mr-1" />
            {roll.label}
          </Button>
        ))}
      </div>

      {/* Custom Roll */}
      <div className="flex gap-2">
        <Input
          placeholder="Ex: 2d6+3, 1d20-2"
          value={customExpression}
          onChange={(e) => setCustomExpression(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomRoll()}
          className="flex-1"
        />
        <Button 
          onClick={handleCustomRoll} 
          disabled={isRolling || !customExpression.trim()}
          size="icon"
        >
          <Dices className="w-4 h-4" />
        </Button>
      </div>

      {/* Current Roll Display */}
      <AnimatePresence mode="wait">
        {currentRoll && (
          <motion.div
            key={currentRoll.id}
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={cn(
              "rounded-xl p-4 border-2 text-center relative overflow-hidden",
              isCritical(currentRoll) && "border-gold bg-gold/10",
              isFumble(currentRoll) && "border-red-500 bg-red-500/10",
              !isCritical(currentRoll) && !isFumble(currentRoll) && "border-primary bg-primary/5"
            )}
          >
            {isCritical(currentRoll) && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-gold/20 to-transparent"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            
            <div className="relative z-10">
              <p className="text-sm text-muted-foreground mb-1">{currentRoll.label}</p>
              
              <div className="flex items-center justify-center gap-2 mb-2">
                {currentRoll.rolls.map((roll, i) => (
                  <motion.span
                    key={i}
                    initial={{ rotateY: 180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg",
                      roll === 20 && "bg-gold text-black",
                      roll === 1 && "bg-red-500 text-white",
                      roll !== 20 && roll !== 1 && "bg-muted"
                    )}
                  >
                    {roll}
                  </motion.span>
                ))}
                {currentRoll.modifier !== 0 && (
                  <span className="text-lg font-medium text-muted-foreground">
                    {currentRoll.modifier > 0 ? '+' : ''}{currentRoll.modifier}
                  </span>
                )}
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={cn(
                  "text-4xl font-black",
                  isCritical(currentRoll) && "text-gold",
                  isFumble(currentRoll) && "text-red-500"
                )}
              >
                {currentRoll.total}
              </motion.div>

              {isCritical(currentRoll) && (
                <Badge className="bg-gold text-black mt-2">CRÍTICO!</Badge>
              )}
              {isFumble(currentRoll) && (
                <Badge variant="destructive" className="mt-2">FALHA CRÍTICA!</Badge>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roll History */}
      {rollHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground">Histórico</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setRollHistory([])}
              className="h-6 text-xs"
            >
              Limpar
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {rollHistory.slice(1).map((roll) => (
              <div 
                key={roll.id}
                className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-1.5"
              >
                <span className="text-muted-foreground">{roll.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    [{roll.rolls.join(', ')}]{roll.modifier !== 0 && `${roll.modifier > 0 ? '+' : ''}${roll.modifier}`}
                  </span>
                  <span className={cn(
                    "font-bold",
                    isCritical(roll) && "text-gold",
                    isFumble(roll) && "text-red-500"
                  )}>
                    = {roll.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export a hook for external use
export function useDiceRoller() {
  const [lastResult, setLastResult] = useState<DiceRollResult | null>(null);

  const rollDice = useCallback((expression: string, label?: string): DiceRollResult | null => {
    const match = expression.replace(/\s/g, '').match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
    if (!match) return null;
    
    const count = parseInt(match[1] || '1');
    const sides = parseInt(match[2]);
    const modifier = parseInt(match[3] || '0');

    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const total = rolls.reduce((a, b) => a + b, 0) + modifier;
    
    const result: DiceRollResult = {
      id: crypto.randomUUID(),
      expression,
      label: label || expression,
      rolls,
      modifier,
      total,
      timestamp: new Date()
    };

    setLastResult(result);
    return result;
  }, []);

  return { rollDice, lastResult };
}
