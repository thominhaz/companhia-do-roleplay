import { useState } from "react";
import { Combatant } from "@/hooks/useCombat";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Heart,
  Shield,
  Skull,
  User,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  TrendingDown,
  TrendingUp
} from "lucide-react";

interface InitiativeListCardProps {
  combatant: Combatant;
  index: number;
  isCurrentTurn: boolean;
  isSelected: boolean;
  isMaster: boolean;
  isOwnCombatant: boolean;
  onSelect: (combatant: Combatant) => void;
  onHpChange: (combatant: Combatant, mode: 'damage' | 'heal') => void;
  onRemove: (combatant: Combatant) => void;
  onInitiativeChange?: (combatant: Combatant, newInit: number) => void;
}

export function InitiativeListCard({
  combatant,
  index,
  isCurrentTurn,
  isSelected,
  isMaster,
  isOwnCombatant,
  onSelect,
  onHpChange,
  onRemove,
  onInitiativeChange
}: InitiativeListCardProps) {
  const [prevHp, setPrevHp] = useState(combatant.current_hp);
  const [hpChange, setHpChange] = useState<{ amount: number; type: 'damage' | 'heal' } | null>(null);
  const [editingInit, setEditingInit] = useState(false);
  const [initValue, setInitValue] = useState(combatant.initiative.toString());

  const hpPercent = Math.max(0, Math.min(100, (combatant.current_hp / combatant.max_hp) * 100));
  const isDead = combatant.current_hp === 0;
  const canEditHp = isMaster || isOwnCombatant;

  // Track HP changes for animation
  if (combatant.current_hp !== prevHp) {
    const diff = combatant.current_hp - prevHp;
    setHpChange({
      amount: Math.abs(diff),
      type: diff < 0 ? 'damage' : 'heal'
    });
    setPrevHp(combatant.current_hp);
    setTimeout(() => setHpChange(null), 2000);
  }

  const handleInitSubmit = () => {
    const newInit = parseInt(initValue) || 0;
    if (onInitiativeChange && newInit !== combatant.initiative) {
      onInitiativeChange(combatant, newInit);
    }
    setEditingInit(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onSelect(combatant)}
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2",
        isCurrentTurn 
          ? "bg-primary/10 border-primary shadow-lg shadow-primary/20" 
          : isSelected 
            ? "bg-muted border-primary/50" 
            : "bg-card border-transparent hover:border-muted-foreground/20",
        isDead && "opacity-50",
        isOwnCombatant && !isMaster && "ring-1 ring-blue-500/50"
      )}
    >
      {/* Current turn indicator */}
      {isCurrentTurn && (
        <motion.div
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full"
          layoutId="turn-indicator"
        />
      )}

      {/* Initiative Box */}
      <div 
        className={cn(
          "relative flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center border-2 transition-all",
          combatant.is_player 
            ? "bg-blue-500/10 border-blue-500/50" 
            : "bg-red-500/10 border-red-500/50"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (isMaster) setEditingInit(true);
        }}
      >
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Init
        </span>
        {editingInit && isMaster ? (
          <Input
            type="number"
            value={initValue}
            onChange={(e) => setInitValue(e.target.value)}
            onBlur={handleInitSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleInitSubmit()}
            className="w-10 h-6 text-center text-lg font-bold p-0 border-0 bg-transparent"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={cn(
            "text-xl font-bold",
            combatant.is_player ? "text-blue-400" : "text-red-400"
          )}>
            {combatant.initiative}
          </span>
        )}
        
        {isCurrentTurn && (
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-4 h-4 text-gold" />
          </motion.div>
        )}
      </div>

      {/* Avatar & Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          combatant.is_player ? "bg-blue-500/20" : "bg-red-500/20"
        )}>
          {isDead ? (
            <Skull className="w-5 h-5 text-gray-400" />
          ) : combatant.is_player ? (
            <User className="w-5 h-5 text-blue-400" />
          ) : (
            <Skull className="w-5 h-5 text-red-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm truncate">{combatant.name}</h4>
            {!combatant.is_player && (
              <span className="text-[10px] text-muted-foreground">
                CA {combatant.armor_class}
              </span>
            )}
          </div>
          {combatant.is_player && (
            <p className="text-[10px] text-muted-foreground">Jogador</p>
          )}
          
          {/* Conditions row */}
          {combatant.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {combatant.conditions.slice(0, 3).map((cond) => (
                <span key={cond} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {cond}
                </span>
              ))}
              {combatant.conditions.length > 3 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  +{combatant.conditions.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* HP Display */}
      <div className="relative flex items-center gap-1 text-right" onClick={(e) => e.stopPropagation()}>
        {/* HP Change Popup */}
        <AnimatePresence>
          {hpChange && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -20, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.5 }}
              className={cn(
                "absolute -top-6 right-0 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                hpChange.type === 'damage' 
                  ? "bg-red-500 text-white" 
                  : "bg-green-500 text-white"
              )}
            >
              {hpChange.type === 'damage' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {hpChange.type === 'damage' ? '-' : '+'}{hpChange.amount}
            </motion.div>
          )}
        </AnimatePresence>

        <span className={cn(
          "text-lg font-bold tabular-nums",
          isDead ? "text-gray-400" : hpPercent <= 25 ? "text-red-400" : hpPercent <= 50 ? "text-yellow-400" : "text-foreground"
        )}>
          {combatant.current_hp}
        </span>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground font-medium tabular-nums">{combatant.max_hp}</span>
      </div>

      {/* Quick Actions */}
      {canEditHp && (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20"
            onClick={() => onHpChange(combatant, 'damage')}
          >
            <Minus className="w-3 h-3 text-red-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-green-500/10 hover:bg-green-500/20"
            onClick={() => onHpChange(combatant, 'heal')}
          >
            <Plus className="w-3 h-3 text-green-400" />
          </Button>
          {isMaster && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive/20"
              onClick={() => onRemove(combatant)}
            >
              <Trash2 className="w-3 h-3 text-muted-foreground" />
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
