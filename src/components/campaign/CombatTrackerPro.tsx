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
