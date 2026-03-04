import { useState } from "react";
import { Combatant } from "@/hooks/useCombat";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Zap,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Eye,
  TrendingDown,
  TrendingUp,
  ChevronRight
} from "lucide-react";

interface CombatantCardProps {
  combatant: Combatant;
  index: number;
  isCurrentTurn: boolean;
  isMaster: boolean;
  isOwnCombatant: boolean;
  onHpChange: (combatant: Combatant, mode: 'damage' | 'heal') => void;
  onConditionToggle: (combatant: Combatant, condition: string) => void;
  onRemove: (combatant: Combatant) => void;
  onViewDetails: (combatant: Combatant) => void;
  conditions: Array<{ name: string; icon: string; color: string }>;
}

export function CombatantCard({
  combatant,
  index,
  isCurrentTurn,
  isMaster,
  isOwnCombatant,
  onHpChange,
  onConditionToggle,
  onRemove,
  onViewDetails,
  conditions
}: CombatantCardProps) {
  const [prevHp, setPrevHp] = useState(combatant.current_hp);
  const [hpChange, setHpChange] = useState<{ amount: number; type: 'damage' | 'heal' } | null>(null);
  
  const hpPercent = Math.max(0, Math.min(100, (combatant.current_hp / combatant.max_hp) * 100));
  const isDead = combatant.current_hp === 0;
  const isCritical = hpPercent <= 25 && !isDead;
  const isLow = hpPercent <= 50 && hpPercent > 25;
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

  const getHpColor = () => {
    if (isDead) return "bg-muted-foreground";
    if (isCritical) return "bg-destructive";
    if (isLow) return "bg-gold";
    return "bg-secondary";
  };

  const getHpGradient = () => {
    if (isDead) return "from-muted-foreground to-muted-foreground/80";
    if (isCritical) return "from-destructive to-destructive/80";
    if (isLow) return "from-gold to-gold/80";
    return "from-secondary to-secondary/80";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 20 }}
      onClick={() => onViewDetails(combatant)}
      className={cn(
        "relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group",
        isCurrentTurn 
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/20" 
          : "hover:ring-1 hover:ring-primary/30",
        isDead && "opacity-60",
        isOwnCombatant && !isMaster && "ring-2 ring-primary/50"
      )}
    >
      {/* Background gradient based on type */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-100 transition-opacity",
        combatant.is_player 
          ? isCurrentTurn ? "from-primary/30 to-primary/10" : "from-primary/20 to-primary/5"
          : isCurrentTurn ? "from-destructive/30 to-destructive/10" : "from-destructive/20 to-destructive/5"
      )} />

      {/* Pulsing current turn effect */}
      {isCurrentTurn && (
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-r",
            combatant.is_player ? "from-primary/20 to-transparent" : "from-destructive/20 to-transparent"
          )}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* HP Change Popup */}
      <AnimatePresence>
        {hpChange && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.5 }}
            className={cn(
              "absolute top-2 right-2 z-20 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold shadow-lg",
              hpChange.type === 'damage' 
                ? "bg-destructive text-destructive-foreground" 
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {hpChange.type === 'damage' ? (
              <>
                <TrendingDown className="w-4 h-4" />
                -{hpChange.amount}
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                +{hpChange.amount}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative p-4">
        <div className="flex items-start gap-4">
          {/* Initiative Circle */}
          <motion.div 
            className={cn(
              "relative flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all",
              combatant.is_player 
                ? "bg-gradient-to-br from-primary/30 to-primary/10 border-primary/50" 
                : "bg-gradient-to-br from-destructive/30 to-destructive/10 border-destructive/50"
            )}
            animate={isCurrentTurn ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: isCurrentTurn ? Infinity : 0 }}
          >
            <span className={cn(
              "text-2xl font-bold",
              combatant.is_player ? "text-primary" : "text-destructive"
            )}>
              {combatant.initiative}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">Init</span>
            
            {isCurrentTurn && (
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-gold" />
              </motion.div>
            )}
          </motion.div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-bold text-lg truncate">{combatant.name}</h4>
              {combatant.is_player ? (
                <User className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <Skull className="w-4 h-4 text-destructive flex-shrink-0" />
              )}
              {isCurrentTurn && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase"
                >
                  Ativo
                </motion.span>
              )}
            </div>

            {/* HP Bar */}
            <div className="relative h-8 rounded-xl overflow-hidden bg-black/30 mb-2">
              <motion.div
                className={cn("h-full bg-gradient-to-r", getHpGradient())}
                initial={false}
                animate={{ width: `${hpPercent}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              />
              
              {/* Critical pulse effect */}
              {isCritical && (
                <motion.div
                  className="absolute inset-0 bg-destructive/40"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
              
              {/* HP Text */}
              <div className="absolute inset-0 flex items-center justify-between px-3">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white drop-shadow-lg">
                    {combatant.current_hp} / {combatant.max_hp}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-sm font-medium text-white/70">{combatant.armor_class}</span>
                </div>
              </div>
              
              {/* Death overlay */}
              {isDead && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <Skull className="w-5 h-5 text-muted-foreground" />
                   <span className="ml-2 text-sm font-bold text-muted-foreground">Caído</span>
                </div>
              )}
            </div>

            {/* Conditions */}
            <div className="flex flex-wrap items-center gap-1">
              {combatant.conditions.map((condition) => {
                const condData = conditions.find(c => c.name === condition);
                return (
                  <motion.span
                    key={condition}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMaster) onConditionToggle(combatant, condition);
                    }}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium cursor-pointer transition-opacity",
                      condData?.color || "bg-muted text-muted-foreground",
                      isMaster && "hover:opacity-70"
                    )}
                  >
                    {condData?.icon} {condition}
                  </motion.span>
                );
              })}
              
              {/* Add Condition Button (Master only) */}
              {isMaster && (
                <Popover>
                  <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Badge 
                      variant="outline" 
                      className="text-[10px] cursor-pointer hover:bg-muted transition-colors"
                    >
                      <Plus className="w-2 h-2 mr-1" />
                      Condição
                    </Badge>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-2 gap-1">
                      {conditions.map(cond => (
                        <Button
                          key={cond.name}
                          variant={combatant.conditions.includes(cond.name) ? "default" : "ghost"}
                          size="sm"
                          className="justify-start text-xs h-8"
                          onClick={() => onConditionToggle(combatant, cond.name)}
                        >
                          <span className="mr-1">{cond.icon}</span>
                          {cond.name}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {canEditHp && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 bg-secondary/20 hover:bg-secondary/40 text-secondary rounded-xl"
                  onClick={() => onHpChange(combatant, 'heal')}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 bg-destructive/20 hover:bg-destructive/40 text-destructive rounded-xl"
                  onClick={() => onHpChange(combatant, 'damage')}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </>
            )}
            {isMaster && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-xl"
                onClick={() => onRemove(combatant)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* View details hint */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            Ver ficha
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
