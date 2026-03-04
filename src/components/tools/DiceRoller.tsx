import { useState, useRef } from "react";
import { ArrowLeft, Dice6, RotateCcw, Sparkles, MessageSquare, Dices, Calculator, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDiscordNotification } from "@/hooks/useDiscordNotification";
import { useAllCampaigns } from "@/hooks/useCampaigns";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedDice } from "@/components/ui/animated-dice";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useHaptics } from "@/hooks/useHaptics";

interface DiceRollerProps {
  onBack: () => void;
  campaignId?: string;
}

type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

interface DiceRollPart {
  type: 'dice' | 'modifier';
  diceType?: DiceType;
  count?: number;
  value?: number;
  results?: number[];
}

type RollMode = 'normal' | 'advantage' | 'disadvantage';

interface RollResult {
  expression: string;
  parts: DiceRollPart[];
  total: number;
  timestamp: Date;
  isCritical?: boolean;
  isCriticalFail?: boolean;
  rollMode?: RollMode;
  advantageRolls?: { roll1: number; roll2: number; chosen: number };
}

const DICE_CONFIG: { type: DiceType; max: number; color: string; gradient: string }[] = [
  { type: "d4", max: 4, color: "text-secondary", gradient: "from-secondary to-secondary/80" },
  { type: "d6", max: 6, color: "text-primary", gradient: "from-primary to-primary/80" },
  { type: "d8", max: 8, color: "text-accent-foreground", gradient: "from-accent to-accent/80" },
  { type: "d10", max: 10, color: "text-gold", gradient: "from-gold to-gold/80" },
  { type: "d12", max: 12, color: "text-destructive", gradient: "from-destructive to-destructive/80" },
  { type: "d20", max: 20, color: "text-primary", gradient: "from-primary to-primary/80" },
  { type: "d100", max: 100, color: "text-gold", gradient: "from-gold to-gold/80" },
];

// Parse dice expression like "4d20 + 1d6 + 20 - 5"
function parseDiceExpression(expression: string): DiceRollPart[] | null {
  const parts: DiceRollPart[] = [];
  const cleaned = expression.replace(/\s+/g, '').toLowerCase();
  
  if (!cleaned) return null;
  
  // Split by + and - while keeping the operators
  const tokens = cleaned.split(/(?=[+-])/);
  
  for (const token of tokens) {
    if (!token) continue;
    
    // Check if it's a dice roll (e.g., 2d20, d6, +3d8)
    const diceMatch = token.match(/^([+-])?(\d*)d(\d+)$/);
    if (diceMatch) {
      const sign = diceMatch[1] === '-' ? -1 : 1;
      const count = Math.min(parseInt(diceMatch[2] || '1', 10), 100); // Max 100 dice
      const sides = parseInt(diceMatch[3], 10);
      
      const validDice = DICE_CONFIG.find(d => d.max === sides);
      if (!validDice || count < 1) continue;
      
      parts.push({
        type: 'dice',
        diceType: validDice.type,
        count: count * sign,
      });
      continue;
    }
    
    // Check if it's a modifier (e.g., +5, -3)
    const modMatch = token.match(/^([+-])?(\d+)$/);
    if (modMatch) {
      const sign = modMatch[1] === '-' ? -1 : 1;
      const value = parseInt(modMatch[2], 10);
      parts.push({
        type: 'modifier',
        value: value * sign,
      });
    }
  }
  
  return parts.length > 0 ? parts : null;
}

// Roll the dice for each part
function rollParts(parts: DiceRollPart[]): { rolledParts: DiceRollPart[], total: number, isCritical: boolean, isCriticalFail: boolean } {
  let total = 0;
  let isCritical = false;
  let isCriticalFail = false;
  
  const rolledParts = parts.map(part => {
    if (part.type === 'modifier') {
      total += part.value || 0;
      return { ...part };
    }
    
    const diceConfig = DICE_CONFIG.find(d => d.type === part.diceType);
    if (!diceConfig) return part;
    
    const isNegative = (part.count || 1) < 0;
    const count = Math.abs(part.count || 1);
    const results: number[] = [];
    
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * diceConfig.max) + 1;
      results.push(roll);
      
      // Check for critical on d20
      if (part.diceType === 'd20' && count === 1) {
        if (roll === 20) isCritical = true;
        if (roll === 1) isCriticalFail = true;
      }
    }
    
    const partTotal = results.reduce((a, b) => a + b, 0);
    total += isNegative ? -partTotal : partTotal;
    
    return { ...part, results, count: isNegative ? -count : count };
  });
  
  return { rolledParts, total, isCritical, isCriticalFail };
}

export function DiceRoller({ onBack, campaignId: propCampaignId }: DiceRollerProps) {
  const [expression, setExpression] = useState("");
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [currentResult, setCurrentResult] = useState<RollResult | null>(null);
  const [sendToDiscord, setSendToDiscord] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(propCampaignId || "");
  const [activeTab, setActiveTab] = useState<string>("quick");
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { data: campaigns } = useAllCampaigns();
  const { sendDiceRoll, hasDiscordIntegration } = useDiscordNotification();
  const { playDiceRoll, playSuccess, playClick } = useSoundEffects();
  const { mediumTap, successVibration } = useHaptics();

  const masterCampaigns = campaigns?.master || [];

  // Quick dice buttons - combines same dice types (e.g., 1d4 + 1d4 = 2d4)
  const addDiceToExpression = (diceType: DiceType) => {
    const currentExpr = expression.trim();
    if (!currentExpr) {
      setExpression(`1${diceType}`);
    } else {
      // Check if the last part of the expression is the same dice type
      const regex = new RegExp(`(\\d+)${diceType}$`);
      const match = currentExpr.match(regex);
      
      if (match) {
        // Same dice type at the end - increment the count
        const currentCount = parseInt(match[1], 10);
        const newCount = currentCount + 1;
        const newExpr = currentExpr.replace(regex, `${newCount}${diceType}`);
        setExpression(newExpr);
      } else {
        // Different dice type or modifier - add new dice
        setExpression(`${currentExpr} + 1${diceType}`);
      }
    }
    inputRef.current?.focus();
  };

  const addModifierToExpression = (value: number) => {
    const currentExpr = expression.trim();
    if (!currentExpr) {
      setExpression(value >= 0 ? `${value}` : `${value}`);
    } else {
      setExpression(`${currentExpr} ${value >= 0 ? '+' : '-'} ${Math.abs(value)}`);
    }
    inputRef.current?.focus();
  };

  // Roll with advantage or disadvantage (2d20, take higher or lower)
  const rollWithAdvantage = async (mode: 'advantage' | 'disadvantage', modifier: number = 0) => {
    setIsRolling(true);
    playDiceRoll(); // Sound effect
    mediumTap(); // Haptic feedback

    setTimeout(async () => {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      const chosen = mode === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
      const total = chosen + modifier;
      
      const isCritical = chosen === 20;
      const isCriticalFail = chosen === 1;

      if (isCritical) {
        playSuccess();
        successVibration();
      }

      const modeLabel = mode === 'advantage' ? 'Vantagem' : 'Desvantagem';
      const expressionStr = modifier !== 0 
        ? `1d20 (${modeLabel}) ${modifier >= 0 ? '+' : '-'} ${Math.abs(modifier)}`
        : `1d20 (${modeLabel})`;

      const result: RollResult = {
        expression: expressionStr,
        parts: [{
          type: 'dice',
          diceType: 'd20',
          count: 1,
          results: [chosen],
        }],
        total,
        timestamp: new Date(),
        isCritical,
        isCriticalFail,
        rollMode: mode,
        advantageRolls: { roll1, roll2, chosen },
      };

      setCurrentResult(result);
      setRollHistory((prev) => [result, ...prev.slice(0, 19)]);
      setIsRolling(false);

      // Send to Discord if enabled
      if (sendToDiscord && selectedCampaignId && hasDiscordIntegration) {
        const success = await sendDiceRoll(selectedCampaignId, {
          username: user?.email?.split('@')[0] || 'Jogador',
          diceType: 'd20',
          diceCount: 2,
          modifier,
          results: [roll1, roll2],
          total,
          isCritical,
          isCriticalFail,
        });

        if (success) {
          toast.success("Rolagem enviada ao Discord!");
        }
      }
    }, 600);
  };

  const rollDice = async () => {
    const parts = parseDiceExpression(expression);
    if (!parts) {
      toast.error("Expressão inválida. Use formato como: 2d20 + 1d6 + 5");
      return;
    }

    setIsRolling(true);
    playDiceRoll(); // Sound effect
    mediumTap(); // Haptic feedback

    setTimeout(async () => {
      const { rolledParts, total, isCritical, isCriticalFail } = rollParts(parts);

      if (isCritical) {
        playSuccess();
        successVibration();
      }

      const result: RollResult = {
        expression: expression.trim(),
        parts: rolledParts,
        total,
        timestamp: new Date(),
        isCritical,
        isCriticalFail,
      };

      setCurrentResult(result);
      setRollHistory((prev) => [result, ...prev.slice(0, 19)]);
      setIsRolling(false);

      // Send to Discord if enabled
      if (sendToDiscord && selectedCampaignId && hasDiscordIntegration) {
        const allResults = rolledParts
          .filter(p => p.type === 'dice' && p.results)
          .flatMap(p => p.results || []);
        
        const dicePartsCount = rolledParts.filter(p => p.type === 'dice').length;
        const modifierSum = rolledParts
          .filter(p => p.type === 'modifier')
          .reduce((sum, p) => sum + (p.value || 0), 0);
        
        const success = await sendDiceRoll(selectedCampaignId, {
          username: user?.email?.split('@')[0] || 'Jogador',
          diceType: 'd20',
          diceCount: dicePartsCount,
          modifier: modifierSum,
          results: allResults,
          total,
          isCritical,
          isCriticalFail,
        });

        if (success) {
          toast.success("Rolagem enviada ao Discord!");
        }
      }
    }, 600);
  };

  const clearExpression = () => {
    setExpression("");
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    setRollHistory([]);
    setCurrentResult(null);
  };

  const quickRoll = (expr: string) => {
    setExpression(expr);
    setTimeout(() => {
      const parts = parseDiceExpression(expr);
      if (!parts) return;

      setIsRolling(true);
      playDiceRoll(); // Sound effect
      mediumTap(); // Haptic feedback
      
      setTimeout(() => {
        const { rolledParts, total, isCritical, isCriticalFail } = rollParts(parts);
        
        if (isCritical) {
          playSuccess();
          successVibration();
        }
        
        const result: RollResult = {
          expression: expr,
          parts: rolledParts,
          total,
          timestamp: new Date(),
          isCritical,
          isCriticalFail,
        };
        setCurrentResult(result);
        setRollHistory((prev) => [result, ...prev.slice(0, 19)]);
        setIsRolling(false);
      }, 600);
    }, 50);
  };

  const getDiceColor = (diceType?: DiceType) => {
    return DICE_CONFIG.find(d => d.type === diceType)?.color || 'text-foreground';
  };

  const formatRollDetails = (parts: DiceRollPart[]) => {
    return parts.map((part, i) => {
      if (part.type === 'modifier') {
        const value = part.value || 0;
        return (
          <span key={i} className={cn(value >= 0 ? "text-secondary" : "text-destructive")}>
            {i > 0 && (value >= 0 ? ' + ' : ' - ')}
            {i === 0 ? value : Math.abs(value)}
          </span>
        );
      }
      
      const count = Math.abs(part.count || 1);
      const isNegative = (part.count || 1) < 0;
      return (
        <span key={i} className={getDiceColor(part.diceType)}>
          {i > 0 && (isNegative ? ' - ' : ' + ')}
          {count}{part.diceType}
          <span className="text-muted-foreground text-xs ml-1">
            [{part.results?.join(', ')}]
          </span>
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Dices className="w-6 h-6 text-primary" />
              Rolador de Dados
            </h1>
            <p className="text-xs text-muted-foreground">Role qualquer combinação de dados</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-5">
        {/* Current Result Display with 3D Dice */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <div className="relative flex flex-col items-center">
            {/* Animated 3D Dice */}
            <div className="mb-4">
              <AnimatedDice
                isRolling={isRolling}
                result={currentResult?.total}
                diceType={currentResult?.parts.find(p => p.type === 'dice')?.diceType || 'd20'}
                size="lg"
                isCritical={currentResult?.isCritical}
                isCriticalFail={currentResult?.isCriticalFail}
              />
            </div>

            {/* Total Display */}
            <div
              className={cn(
                "text-5xl font-black mb-3 transition-all duration-300 tabular-nums",
                isRolling && "animate-pulse text-muted-foreground",
                currentResult?.isCritical && "text-gold drop-shadow-[0_0_20px_hsl(var(--gold)/0.5)]",
                currentResult?.isCriticalFail && "text-destructive",
                !isRolling && !currentResult?.isCritical && !currentResult?.isCriticalFail && "text-foreground"
              )}
            >
              {isRolling ? "..." : currentResult?.total ?? "—"}
            </div>
            
            {currentResult && !isRolling && (
              <div className="space-y-2 animate-fade-in text-center">
                {/* Show advantage/disadvantage rolls */}
                {currentResult.advantageRolls && (
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className={cn(
                      "px-3 py-1 rounded-lg font-mono text-lg",
                      currentResult.advantageRolls.roll1 === currentResult.advantageRolls.chosen
                        ? "bg-primary/20 text-primary ring-2 ring-primary/50"
                        : "bg-muted/50 text-muted-foreground line-through"
                    )}>
                      {currentResult.advantageRolls.roll1}
                    </span>
                    <span className={cn(
                      "px-3 py-1 rounded-lg font-mono text-lg",
                      currentResult.advantageRolls.roll2 === currentResult.advantageRolls.chosen
                        ? "bg-primary/20 text-primary ring-2 ring-primary/50"
                        : "bg-muted/50 text-muted-foreground line-through"
                    )}>
                      {currentResult.advantageRolls.roll2}
                    </span>
                    {currentResult.rollMode === 'advantage' && (
                      <TrendingUp className="w-5 h-5 text-secondary" />
                    )}
                    {currentResult.rollMode === 'disadvantage' && (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                )}
                
                <p className="text-sm font-mono">
                  {formatRollDetails(currentResult.parts)}
                </p>
                {currentResult.isCritical && (
                  <p className="text-gold font-bold flex items-center justify-center gap-2 text-lg animate-bounce">
                    <Sparkles className="w-5 h-5" />
                    CRÍTICO!
                    <Sparkles className="w-5 h-5" />
                  </p>
                )}
                {currentResult.isCriticalFail && (
                  <p className="text-destructive font-bold text-lg">FALHA CRÍTICA!</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Expression Input */}
        <section className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="Ex: 2d20 + 1d6 + 5"
                className="pl-10 pr-10 h-12 text-lg font-mono bg-card border-border/50 focus:border-primary"
                onKeyDown={(e) => e.key === 'Enter' && rollDice()}
              />
              {expression && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={clearExpression}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Use: d4, d6, d8, d10, d12, d20, d100 • Operadores: + -
          </p>
        </section>

        {/* Advantage/Disadvantage Quick Buttons */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => rollWithAdvantage('advantage')}
            disabled={isRolling}
            className={cn(
              "relative p-4 rounded-xl font-bold transition-all",
            "bg-gradient-to-br from-secondary/20 to-secondary/10",
            "border border-secondary/40 hover:border-secondary",
              "hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-50"
            )}
          >
            <div className="flex items-center justify-center gap-2 text-secondary">
              <TrendingUp className="w-5 h-5" />
              <span>Vantagem</span>
            </div>
            <p className="text-xs text-secondary/70 mt-1">2d20, pega o maior</p>
          </button>
          
          <button
            onClick={() => rollWithAdvantage('disadvantage')}
            disabled={isRolling}
            className={cn(
              "relative p-4 rounded-xl font-bold transition-all",
              "bg-gradient-to-br from-destructive/20 to-destructive/10",
              "border border-destructive/40 hover:border-destructive",
              "hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-50"
            )}
          >
            <div className="flex items-center justify-center gap-2 text-destructive">
              <TrendingDown className="w-5 h-5" />
              <span>Desvantagem</span>
            </div>
            <p className="text-xs text-destructive/70 mt-1">2d20, pega o menor</p>
          </button>
        </section>

        {/* Quick Add Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-muted/50">
            <TabsTrigger value="quick" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Dados
            </TabsTrigger>
            <TabsTrigger value="presets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Atalhos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="mt-3 space-y-4">
            {/* Dice Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {DICE_CONFIG.map((dice) => (
                <button
                  key={dice.type}
                  onClick={() => addDiceToExpression(dice.type)}
                  className={cn(
                    "relative p-3 rounded-xl font-bold transition-all",
                    "bg-gradient-to-br hover:scale-105 active:scale-95",
                    dice.gradient,
                    "text-white shadow-lg"
                  )}
                >
                  <span className="text-sm opacity-80">+1</span>
                  <span className="block text-lg">{dice.type.toUpperCase()}</span>
                </button>
              ))}
              {/* Modifier buttons */}
              <button
                onClick={() => addModifierToExpression(1)}
                className="p-3 rounded-xl font-bold transition-all bg-secondary/20 border border-secondary/30 text-secondary hover:bg-secondary/30 hover:scale-105 active:scale-95"
              >
                +1
              </button>
            </div>

            {/* Modifier Quick Buttons */}
            <div className="flex justify-center gap-2">
              {[-5, -1, +1, +5].map((mod) => (
                <Button
                  key={mod}
                  variant="outline"
                  size="sm"
                  onClick={() => addModifierToExpression(mod)}
                  className={cn(
                    "px-4 font-mono",
                    mod > 0 ? "text-secondary border-secondary/30" : "text-destructive border-destructive/30"
                  )}
                >
                  {mod > 0 ? `+${mod}` : mod}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="presets" className="mt-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Ataque", expr: "1d20" },
                { label: "Ataque c/ Vantagem", expr: "2d20" },
                { label: "Dano Espada", expr: "1d8" },
                { label: "Dano Adaga", expr: "1d4" },
                { label: "Bola de Fogo", expr: "8d6" },
                { label: "Sneak Attack (5º)", expr: "3d6" },
                { label: "Cura Curar Ferimentos", expr: "1d8 + 3" },
                { label: "Golpe Divino", expr: "2d8" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => quickRoll(preset.expr)}
                  className="p-3 rounded-xl text-left transition-all bg-card border border-border/50 hover:border-primary/50 hover:bg-card/80"
                >
                  <span className="block text-sm font-medium text-foreground">{preset.label}</span>
                  <span className="block text-xs text-muted-foreground font-mono">{preset.expr}</span>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Discord Integration */}
        {hasDiscordIntegration && masterCampaigns.length > 0 && (
          <section className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#5865F2]" />
                <Label htmlFor="discord-toggle" className="text-sm font-medium">
                  Enviar ao Discord
                </Label>
              </div>
              <Switch
                id="discord-toggle"
                checked={sendToDiscord}
                onCheckedChange={setSendToDiscord}
              />
            </div>

            {sendToDiscord && (
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a campanha" />
                </SelectTrigger>
                <SelectContent>
                  {masterCampaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </section>
        )}

        {/* Roll Button */}
        <Button
          onClick={rollDice}
          disabled={isRolling || !expression.trim() || (sendToDiscord && !selectedCampaignId)}
          className={cn(
            "w-full h-14 text-lg font-bold",
            "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%]",
            "hover:bg-[position:100%_0] transition-all duration-500",
            "disabled:opacity-50"
          )}
        >
          <Dice6 className={cn("w-6 h-6 mr-2", isRolling && "animate-spin")} />
          {isRolling ? "Rolando..." : "Rolar Dados"}
        </Button>

        {/* Roll History */}
        {rollHistory.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Histórico ({rollHistory.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {rollHistory.map((roll, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-xl p-3 flex items-center justify-between animate-fade-in",
                    "bg-card/50 border border-border/30",
                    roll.isCritical && "border-gold/50 bg-gold/5",
                    roll.isCriticalFail && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm text-muted-foreground block truncate">
                      {roll.expression}
                    </span>
                    <div className="text-xs text-muted-foreground/70 font-mono truncate">
                      {formatRollDetails(roll.parts)}
                    </div>
                  </div>
                  <span className={cn(
                    "text-2xl font-bold ml-3 tabular-nums",
                    roll.isCritical && "text-gold",
                    roll.isCriticalFail && "text-destructive"
                  )}>
                    {roll.total}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
