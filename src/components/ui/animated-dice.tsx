import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface AnimatedDiceProps {
  isRolling: boolean;
  result?: number;
  diceType?: "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";
  size?: "sm" | "md" | "lg";
  isCritical?: boolean;
  isCriticalFail?: boolean;
}

const sizeMap = {
  sm: "w-16 h-16 text-xl",
  md: "w-24 h-24 text-3xl",
  lg: "w-32 h-32 text-4xl",
};

const diceColors = {
  d4: "from-secondary to-secondary/80",
  d6: "from-primary to-primary/80",
  d8: "from-accent to-accent/80",
  d10: "from-gold to-gold/80",
  d12: "from-destructive to-destructive/80",
  d20: "from-primary to-primary/80",
  d100: "from-gold to-gold/80",
};

export function AnimatedDice({
  isRolling,
  result,
  diceType = "d20",
  size = "lg",
  isCritical = false,
  isCriticalFail = false,
}: AnimatedDiceProps) {
  const [displayValue, setDisplayValue] = useState<number | string>("?");
  const gradient = diceColors[diceType] || diceColors.d20;

  // During rolling, show random numbers
  useEffect(() => {
    if (isRolling) {
      const maxValue = parseInt(diceType.substring(1));
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * maxValue) + 1);
      }, 50);

      return () => clearInterval(interval);
    } else if (result !== undefined) {
      setDisplayValue(result);
    } else {
      setDisplayValue("?");
    }
  }, [isRolling, result, diceType]);

  return (
    <div className="relative inline-flex items-center justify-center perspective-1000">
      {/* Glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-2xl blur-xl ${
          isCritical
            ? "bg-gold/50"
            : isCriticalFail
            ? "bg-destructive/50"
            : `bg-gradient-to-br ${gradient} opacity-30`
        }`}
        animate={
          isRolling
            ? {
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }
            : isCritical
            ? {
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }
            : {}
        }
        transition={
          isRolling
            ? { duration: 0.3, repeat: Infinity }
            : { duration: 1, repeat: Infinity }
        }
      />

      {/* Dice container */}
      <motion.div
        className={`relative ${sizeMap[size]} rounded-2xl bg-gradient-to-br ${gradient} shadow-2xl flex items-center justify-center font-bold`}
        style={{ transformStyle: "preserve-3d" }}
        animate={
          isRolling
            ? {
                rotateX: [0, 360, 720, 1080],
                rotateY: [0, 180, 360, 540],
                rotateZ: [0, 90, 180, 270],
                scale: [1, 1.1, 0.9, 1],
              }
            : isCritical
            ? {
                scale: [1, 1.1, 1],
                rotateZ: [0, -5, 5, 0],
              }
            : isCriticalFail
            ? {
                x: [0, -5, 5, -5, 5, 0],
              }
            : {
                rotateX: 0,
                rotateY: 0,
                rotateZ: 0,
                scale: 1,
              }
        }
        transition={
          isRolling
            ? {
                duration: 0.6,
                repeat: Infinity,
                ease: "linear",
              }
            : isCritical
            ? {
                duration: 0.5,
                repeat: 2,
              }
            : isCriticalFail
            ? {
                duration: 0.4,
              }
            : {
                type: "spring",
                stiffness: 300,
                damping: 20,
              }
        }
      >
        {/* Face highlights */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tl from-black/20 via-transparent to-transparent" />

        {/* Value display */}
        <motion.span
          className={`relative z-10 font-black drop-shadow-lg ${
            isCritical
              ? "text-background"
              : isCriticalFail
              ? "text-background"
              : "text-background"
          }`}
          animate={
            !isRolling && result !== undefined
              ? {
                  scale: [0.5, 1.2, 1],
                  opacity: [0, 1],
                }
              : {}
          }
          transition={{ duration: 0.3 }}
        >
          {displayValue}
        </motion.span>

        {/* Dice type label */}
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-background/70 uppercase">
          {diceType}
        </span>
      </motion.div>

      {/* Critical effects */}
      {isCritical && !isRolling && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Sparkle particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gold rounded-full"
              style={{
                left: "50%",
                top: "50%",
              }}
              animate={{
                x: [0, Math.cos((i * Math.PI) / 4) * 60],
                y: [0, Math.sin((i * Math.PI) / 4) * 60],
                opacity: [1, 0],
                scale: [1, 0],
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.05,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// Animated HP Bar Component
interface AnimatedHPBarProps {
  currentHp: number;
  maxHp: number;
  tempHp?: number;
  showNumbers?: boolean;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  onDamage?: boolean;
  onHeal?: boolean;
}

const hpBarSizes = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

export function AnimatedHPBar({
  currentHp,
  maxHp,
  tempHp = 0,
  showNumbers = true,
  size = "md",
  animate = true,
  onDamage = false,
  onHeal = false,
}: AnimatedHPBarProps) {
  const percent = maxHp > 0 ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : 0;
  const tempPercent = maxHp > 0 ? Math.max(0, Math.min(100 - percent, (tempHp / maxHp) * 100)) : 0;

  const getBarColor = () => {
    if (percent <= 25) return "bg-gradient-to-r from-destructive to-destructive/80";
    if (percent <= 50) return "bg-gradient-to-r from-gold to-gold/80";
    return "bg-gradient-to-r from-secondary to-secondary/80";
  };

  const getGlowColor = () => {
    if (percent <= 25) return "shadow-destructive/50";
    if (percent <= 50) return "shadow-gold/50";
    return "shadow-secondary/50";
  };

  return (
    <div className="w-full space-y-1">
      {showNumbers && (
        <div className="flex justify-between items-center text-sm">
          <motion.span
            className={`font-bold ${
              percent <= 25
                ? "text-destructive"
                : percent <= 50
                ? "text-gold"
                : "text-secondary"
            }`}
            animate={
              onDamage
                ? { scale: [1, 1.3, 1], color: ["", "#ef4444", ""] }
                : onHeal
                ? { scale: [1, 1.3, 1], color: ["", "#22c55e", ""] }
                : {}
            }
            transition={{ duration: 0.3 }}
          >
            {currentHp}
            {tempHp > 0 && (
              <span className="text-primary ml-1">(+{tempHp})</span>
            )}
          </motion.span>
          <span className="text-muted-foreground">/ {maxHp}</span>
        </div>
      )}

      <div
        className={`relative ${hpBarSizes[size]} bg-muted/50 rounded-full overflow-hidden`}
      >
        {/* Damage flash overlay */}
        {onDamage && (
          <motion.div
            className="absolute inset-0 bg-destructive z-20"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Heal flash overlay */}
        {onHeal && (
          <motion.div
            className="absolute inset-0 bg-secondary z-20"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Background glow for low HP */}
        {percent <= 25 && (
          <motion.div
            className="absolute inset-0 bg-destructive/20"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {/* Main HP bar */}
        <motion.div
          className={`absolute inset-y-0 left-0 ${getBarColor()} rounded-full shadow-lg ${getGlowColor()}`}
          initial={animate ? { width: 0 } : { width: `${percent}%` }}
          animate={{ width: `${percent}%` }}
          transition={
            animate
              ? {
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }
              : { duration: 0.3 }
          }
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full" />
          
          {/* Animated shine */}
          <motion.div
            className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ["-100%", "400%"] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          />
        </motion.div>

        {/* Temp HP bar */}
        {tempHp > 0 && (
          <motion.div
            className="absolute inset-y-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
            style={{ left: `${percent}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${tempPercent}%` }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
