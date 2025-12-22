import { useState, useEffect, useRef } from "react";
import { Combatant } from "@/hooks/useCombat";
import { cn } from "@/lib/utils";
import { Heart, Shield, Skull, Sparkles, Zap, TrendingDown, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CombatantHpBarProps {
  combatant: Combatant;
  isCurrentTurn: boolean;
  showAnimation?: boolean;
}

export function CombatantHpBar({ combatant, isCurrentTurn, showAnimation = true }: CombatantHpBarProps) {
  const [prevHp, setPrevHp] = useState(combatant.current_hp);
  const [hpChange, setHpChange] = useState<{ amount: number; type: 'damage' | 'heal' } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const hpPercent = Math.max(0, Math.min(100, (combatant.current_hp / combatant.max_hp) * 100));
  const isDead = combatant.current_hp === 0;
  const isCritical = hpPercent <= 25 && !isDead;
  const isLow = hpPercent <= 50 && hpPercent > 25;

  // Detect HP changes
  useEffect(() => {
    if (combatant.current_hp !== prevHp && showAnimation) {
      const diff = combatant.current_hp - prevHp;
      setHpChange({
        amount: Math.abs(diff),
        type: diff < 0 ? 'damage' : 'heal'
      });

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Auto-hide after animation
      timeoutRef.current = setTimeout(() => {
        setHpChange(null);
      }, 2000);

      setPrevHp(combatant.current_hp);
    }
  }, [combatant.current_hp, prevHp, showAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getHpColor = () => {
    if (isDead) return "bg-gray-600";
    if (isCritical) return "bg-red-500";
    if (isLow) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getHpGlow = () => {
    if (isDead) return "";
    if (isCritical) return "shadow-[0_0_15px_rgba(239,68,68,0.5)]";
    if (isLow) return "shadow-[0_0_10px_rgba(234,179,8,0.3)]";
    return "";
  };

  return (
    <div className="relative">
      {/* HP Change Indicator */}
      <AnimatePresence>
        {hpChange && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.5 }}
            className={cn(
              "absolute -top-2 right-0 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
              hpChange.type === 'damage' 
                ? "bg-red-500/20 text-red-400" 
                : "bg-green-500/20 text-green-400"
            )}
          >
            {hpChange.type === 'damage' ? (
              <>
                <TrendingDown className="w-3 h-3" />
                -{hpChange.amount}
              </>
            ) : (
              <>
                <TrendingUp className="w-3 h-3" />
                +{hpChange.amount}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HP Bar Container */}
      <div className={cn(
        "relative h-6 rounded-full overflow-hidden bg-muted/50",
        isCurrentTurn && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        getHpGlow()
      )}>
        {/* HP Fill */}
        <motion.div
          className={cn("h-full transition-colors", getHpColor())}
          initial={false}
          animate={{ width: `${hpPercent}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        />

        {/* Pulse effect for critical HP */}
        {isCritical && (
          <motion.div
            className="absolute inset-0 bg-red-500/30"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {/* HP Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-lg flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {combatant.current_hp} / {combatant.max_hp}
          </span>
        </div>

        {/* Death overlay */}
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Skull className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* AC Badge */}
      <div className="absolute -right-2 -top-2 flex items-center gap-0.5 bg-slate-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
        <Shield className="w-3 h-3" />
        {combatant.armor_class}
      </div>
    </div>
  );
}

interface ProCombatantCardProps {
  combatant: Combatant;
  index: number;
  isCurrentTurn: boolean;
  isMaster: boolean;
  isOwnCombatant: boolean;
  onHpChange: (combatant: Combatant, mode: 'damage' | 'heal') => void;
  onConditionToggle: (combatant: Combatant, condition: string) => void;
  onRemove: (combatant: Combatant) => void;
  conditions: Array<{ name: string; icon: string; color: string }>;
}

export function ProCombatantCard({
  combatant,
  index,
  isCurrentTurn,
  isMaster,
  isOwnCombatant,
  onHpChange,
  onConditionToggle,
  onRemove,
  conditions
}: ProCombatantCardProps) {
  const isDead = combatant.current_hp === 0;
  const canEditHp = isMaster || isOwnCombatant;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "rounded-xl p-4 border transition-all relative overflow-hidden",
        isCurrentTurn 
          ? "bg-gradient-to-r from-primary/20 to-primary/5 border-primary shadow-lg shadow-primary/20" 
          : "bg-card border-border",
        isDead && "opacity-50",
        isOwnCombatant && !isMaster && "ring-2 ring-blue-500/50"
      )}
    >
      {/* Turn Indicator Glow */}
      {isCurrentTurn && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Initiative Badge */}
          <motion.div 
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl relative",
              combatant.is_player 
                ? "bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-400 border border-blue-500/30" 
                : "bg-gradient-to-br from-red-500/30 to-red-600/20 text-red-400 border border-red-500/30"
            )}
            animate={isCurrentTurn ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: isCurrentTurn ? Infinity : 0 }}
          >
            {combatant.initiative}
            {isCurrentTurn && (
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-gold" />
            )}
          </motion.div>

          {/* Name & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold truncate text-lg">{combatant.name}</h4>
              {isCurrentTurn && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full"
                >
                  ATIVO
                </motion.span>
              )}
            </div>

            {/* Conditions */}
            {combatant.conditions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {combatant.conditions.map((condition) => {
                  const conditionData = conditions.find(c => c.name === condition);
                  return (
                    <motion.span
                      key={condition}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                        conditionData?.color || "bg-muted text-muted-foreground"
                      )}
                    >
                      {conditionData?.icon} {condition}
                    </motion.span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {canEditHp && (
            <div className="flex gap-1">
              <button
                onClick={() => onHpChange(combatant, 'damage')}
                className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition-colors"
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                onClick={() => onHpChange(combatant, 'heal')}
                className="w-8 h-8 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 flex items-center justify-center transition-colors"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* HP Bar */}
        <CombatantHpBar 
          combatant={combatant} 
          isCurrentTurn={isCurrentTurn}
        />
      </div>
    </motion.div>
  );
}

interface RealTimeStatusIndicatorProps {
  isConnected: boolean;
}

export function RealTimeStatusIndicator({ isConnected }: RealTimeStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <motion.div
        className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-green-500" : "bg-red-500"
        )}
        animate={isConnected ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className={cn(
        "font-medium",
        isConnected ? "text-green-500" : "text-red-500"
      )}>
        {isConnected ? "Tempo Real" : "Desconectado"}
      </span>
    </div>
  );
}
