import { motion } from "framer-motion";

interface DiceSVGProps {
  type: "d20" | "d12" | "d8" | "d6" | "d4";
  value?: number;
  isRolling?: boolean;
  color?: string;
  size?: number;
}

// D20 - Icosahedron (20-sided)
function D20Shape({ color = "var(--cosmic-purple)" }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="d20Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* D20 hexagonal shape with triangular facets */}
      <path
        d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z"
        fill="url(#d20Gradient)"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner lines for facets */}
      <path
        d="M50 5 L50 50 M85 25 L50 50 M85 75 L50 50 M50 95 L50 50 M15 75 L50 50 M15 25 L50 50"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      {/* Top and bottom triangular facets */}
      <path
        d="M50 5 L85 25 L15 25 Z"
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      <path
        d="M50 95 L85 75 L15 75 Z"
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
    </svg>
  );
}

// D12 - Dodecahedron (12-sided) - Pentagon shape
function D12Shape({ color = "var(--solar-orange)" }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="d12Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Pentagon shape */}
      <path
        d="M50 8 L88 38 L73 88 L27 88 L12 38 Z"
        fill="url(#d12Gradient)"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner pentagon */}
      <path
        d="M50 28 L70 42 L63 68 L37 68 L30 42 Z"
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      {/* Lines connecting inner and outer */}
      <path
        d="M50 8 L50 28 M88 38 L70 42 M73 88 L63 68 M27 88 L37 68 M12 38 L30 42"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
    </svg>
  );
}

// D8 - Octahedron (8-sided) - Diamond/rhombus shape
function D8Shape({ color = "var(--solar-orange)" }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="d8Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Diamond shape */}
      <path
        d="M50 5 L90 50 L50 95 L10 50 Z"
        fill="url(#d8Gradient)"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Horizontal center line */}
      <path
        d="M10 50 L90 50"
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      {/* Diagonal facet lines */}
      <path
        d="M50 5 L50 95"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
    </svg>
  );
}

// D6 - Cube (6-sided) - Square with perspective
function D6Shape({ color = "var(--cyan-blue)" }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="d6Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Front face */}
      <rect
        x="15"
        y="25"
        width="55"
        height="55"
        rx="8"
        fill="url(#d6Gradient)"
        stroke={color}
        strokeWidth="2.5"
      />
      {/* Top face (perspective) */}
      <path
        d="M15 25 L30 12 L85 12 L70 25"
        fill={color}
        fillOpacity="0.2"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Right face (perspective) */}
      <path
        d="M70 25 L85 12 L85 67 L70 80"
        fill={color}
        fillOpacity="0.15"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// D4 - Tetrahedron (4-sided) - Triangle
function D4Shape({ color = "var(--magenta-red)" }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="d4Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Triangle */}
      <path
        d="M50 10 L90 85 L10 85 Z"
        fill="url(#d4Gradient)"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner lines */}
      <path
        d="M50 10 L50 60 M50 60 L10 85 M50 60 L90 85"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

const diceColors: Record<string, string> = {
  d20: "#8A2BE2", // cosmic-purple
  d12: "#FF9F55", // solar-orange
  d8: "#FF9F55", // solar-orange
  d6: "#6DD5FA", // cyan-blue
  d4: "#FF4E50", // magenta-red
};

export function DiceSVG({ type, value, isRolling = false, color, size = 48 }: DiceSVGProps) {
  const dieColor = color || diceColors[type];

  const DiceShape = {
    d20: D20Shape,
    d12: D12Shape,
    d8: D8Shape,
    d6: D6Shape,
    d4: D4Shape,
  }[type];

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={isRolling ? { 
        rotate: [0, 180, 360],
        scale: [1, 1.15, 1],
      } : { rotate: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        repeat: isRolling ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      <DiceShape color={dieColor} />
      {value !== undefined && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center font-bold"
          style={{ 
            color: dieColor,
            fontSize: size * 0.35,
            textShadow: `0 0 10px ${dieColor}50`
          }}
          animate={isRolling ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.2, repeat: isRolling ? Infinity : 0 }}
        >
          {value}
        </motion.div>
      )}
    </motion.div>
  );
}
