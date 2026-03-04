import { Combatant } from "@/hooks/useCombat";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Shield,
  Skull,
  User,
  Sparkles
} from "lucide-react";

interface CompactCombatantCardProps {
  combatant: Combatant;
  index: number;
  isCurrentTurn: boolean;
  isOwnCombatant: boolean;
  onViewDetails: (combatant: Combatant) => void;
}

export function CompactCombatantCard({
  combatant,
  index,
  isCurrentTurn,
  isOwnCombatant,
  onViewDetails
}: CompactCombatantCardProps) {
  const hpPercent = Math.max(0, Math.min(100, (combatant.current_hp / combatant.max_hp) * 100));
  const isDead = combatant.current_hp === 0;
  const isCritical = hpPercent <= 25 && !isDead;

  const getHpColor = () => {
    if (isDead) return "bg-muted-foreground";
    if (hpPercent <= 25) return "bg-destructive";
    if (hpPercent <= 50) return "bg-gold";
    return "bg-secondary";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.02 }}
      onClick={() => onViewDetails(combatant)}
      className={cn(
        "relative rounded-xl p-3 cursor-pointer transition-all border-2",
        isCurrentTurn 
          ? "ring-2 ring-primary ring-offset-1 ring-offset-background border-primary bg-primary/10" 
          : "border-border bg-card hover:border-primary/30",
        isDead && "opacity-50",
        isOwnCombatant && "ring-1 ring-primary/50"
      )}
    >
      {/* Current turn indicator */}
      {isCurrentTurn && (
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-4 h-4 text-gold" />
        </motion.div>
      )}

      {/* Initiative */}
      <div className={cn(
        "absolute -top-2 -left-2 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm",
        combatant.is_player 
          ? "bg-primary text-primary-foreground" 
          : "bg-destructive text-destructive-foreground"
      )}>
        {combatant.initiative}
      </div>

      {/* Icon */}
      <div className="flex justify-center mb-2 mt-1">
        {isDead ? (
          <Skull className="w-8 h-8 text-muted-foreground" />
        ) : combatant.is_player ? (
          <User className={cn("w-8 h-8", isCurrentTurn ? "text-primary" : "text-primary/70")} />
        ) : (
          <Skull className={cn("w-8 h-8", isCurrentTurn ? "text-primary" : "text-destructive/70")} />
        )}
      </div>

      {/* Name */}
      <div className="text-center mb-2">
        <h4 className="font-bold text-sm truncate" title={combatant.name}>
          {combatant.name.split(' ')[0]}
        </h4>
      </div>

      {/* HP Bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
        <motion.div
          className={getHpColor()}
          initial={false}
          animate={{ width: `${hpPercent}%` }}
          transition={{ type: "spring", stiffness: 100 }}
          style={{ height: '100%' }}
        />
      </div>

      {/* HP and AC */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Heart className="w-3 h-3 text-destructive" />
          {combatant.current_hp}
        </span>
        <span className="flex items-center gap-0.5">
          <Shield className="w-3 h-3 text-primary" />
          {combatant.armor_class}
        </span>
      </div>

      {/* Conditions indicator */}
      {combatant.conditions.length > 0 && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <Badge 
            variant="secondary" 
            className="h-4 px-1.5 text-[8px]"
          >
            {combatant.conditions.length} ⚡
          </Badge>
        </div>
      )}

      {/* Critical HP pulse */}
      {isCritical && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-destructive"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
