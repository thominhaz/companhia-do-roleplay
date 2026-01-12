import { motion } from "framer-motion";

interface AnimatedHeroTitleProps {
  className?: string;
}

export const AnimatedHeroTitle = ({ className }: AnimatedHeroTitleProps) => {
  return (
    <div className={`space-y-0 ${className}`}>
      {/* Top text line */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase tracking-tight">
        Jogue RPG com
      </h1>
      
      {/* Animated SVG word */}
      <div className="relative -mt-2 md:-mt-4">
        <motion.svg
          viewBox="0 0 600 200"
          className="w-full max-w-[600px] h-auto overflow-visible"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <defs>
            {/* Animated gradient */}
            <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9F55">
                <animate
                  attributeName="stop-color"
                  values="#FF9F55;#FF4E50;#8A2BE2;#FF9F55"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#FF4E50">
                <animate
                  attributeName="stop-color"
                  values="#FF4E50;#8A2BE2;#FF9F55;#FF4E50"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#8A2BE2">
                <animate
                  attributeName="stop-color"
                  values="#8A2BE2;#FF9F55;#FF4E50;#8A2BE2"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
            
            {/* Glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Script-style "Liberdade" text */}
          <motion.text
            x="0"
            y="140"
            fill="url(#heroGradient)"
            filter="url(#glow)"
            className="font-handwritten"
            style={{
              fontFamily: "'Shantell Sans', cursive",
              fontSize: "140px",
              fontWeight: 700,
              fontStyle: "italic",
            }}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Liberdade
          </motion.text>
        </motion.svg>
      </div>
      
      {/* Bottom text line */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase tracking-tight -mt-4 md:-mt-8">
        Total.
      </h1>
    </div>
  );
};
