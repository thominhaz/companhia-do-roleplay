import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";

interface DemoCharacter {
  name: string;
  race: string;
  class: string;
  background: string;
  imageUrl: string;
  attributes: {
    forca: number;
    destreza: number;
    constituicao: number;
    inteligencia: number;
    sabedoria: number;
    carisma: number;
  };
}

const demoCharacters: { theme: string; character: DemoCharacter }[] = [
  {
    theme: "Clássico",
    character: {
      name: "Anão Grande",
      race: "Anão",
      class: "Clérigo",
      background: "Acólito",
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=150&fit=crop&crop=face",
      attributes: { forca: 13, destreza: 12, constituicao: 15, inteligencia: 12, sabedoria: 15, carisma: 8 },
    },
  },
  {
    theme: "Mago",
    character: {
      name: "Elara Moonwhisper",
      race: "Elfa",
      class: "Maga",
      background: "Sábio",
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      attributes: { forca: 8, destreza: 14, constituicao: 12, inteligencia: 17, sabedoria: 13, carisma: 10 },
    },
  },
  {
    theme: "Guerreiro",
    character: {
      name: "Thorn Ironfist",
      race: "Humano",
      class: "Guerreiro",
      background: "Soldado",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      attributes: { forca: 16, destreza: 13, constituicao: 14, inteligencia: 10, sabedoria: 11, carisma: 12 },
    },
  },
];

function getModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

function AttributeBox({ value, label }: { value: number; label: string }) {
  const modifier = getModifier(value);
  const modifierColor = modifier >= 0 ? "text-solar-orange" : "text-magenta-red";

  return (
    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10 hover:border-cosmic-purple/50 transition-all">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className={`text-sm font-semibold ${modifierColor}`}>
        {modifier >= 0 ? "+" : ""}{modifier}
      </div>
      <div className="text-xs text-white/50 mt-1">{label}</div>
    </div>
  );
}

export function CharacterSheetPreview() {
  const [activeTheme, setActiveTheme] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [diceResults, setDiceResults] = useState<number[]>([]);

  const currentChar = demoCharacters[activeTheme].character;

  const handleRoll = () => {
    setIsRolling(true);
    setDiceResults([]);

    // Animate dice roll
    const rollInterval = setInterval(() => {
      setDiceResults([
        Math.floor(Math.random() * 20) + 1,
        Math.floor(Math.random() * 12) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 100);

    setTimeout(() => {
      clearInterval(rollInterval);
      setDiceResults([
        Math.floor(Math.random() * 20) + 1,
        Math.floor(Math.random() * 12) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
      setIsRolling(false);
    }, 800);
  };

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-cosmic-purple/20 via-solar-orange/10 to-cosmic-purple/20 blur-3xl rounded-3xl" />
      
      <motion.div 
        className="relative bg-[#1a1a2e] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Theme Tabs */}
        <div className="flex gap-2 p-4 pb-0">
          {demoCharacters.map((item, index) => (
            <button
              key={item.theme}
              onClick={() => setActiveTheme(index)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTheme === index
                  ? "bg-cosmic-purple text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
              }`}
            >
              {item.theme}
            </button>
          ))}
        </div>

        {/* Character Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTheme}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-6 space-y-5"
          >
            {/* Avatar and Name */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cosmic-purple to-solar-orange p-1">
                  <div className="w-full h-full rounded-full bg-[#1a1a2e] p-1">
                    <img
                      src={currentChar.imageUrl}
                      alt={currentChar.name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentChar.name) + "&background=8B5CF6&color=fff&size=150";
                      }}
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mt-3">{currentChar.name}</h3>
            </div>

            {/* Info Section */}
            <div className="space-y-2">
              <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Informações</div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-sm text-white/80">{currentChar.race} • {currentChar.class}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-sm text-white/80">{currentChar.background}</div>
              </div>
            </div>

            {/* Attributes */}
            <div className="space-y-2">
              <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Atributos</div>
              <div className="grid grid-cols-3 gap-2">
                <AttributeBox value={currentChar.attributes.forca} label="Força" />
                <AttributeBox value={currentChar.attributes.destreza} label="Destreza" />
                <AttributeBox value={currentChar.attributes.constituicao} label="Constituição" />
                <AttributeBox value={currentChar.attributes.inteligencia} label="Inteligência" />
                <AttributeBox value={currentChar.attributes.sabedoria} label="Sabedoria" />
                <AttributeBox value={currentChar.attributes.carisma} label="Carisma" />
              </div>
            </div>

            {/* Dice Display */}
            <div className="flex justify-center gap-3">
              {[20, 12, 6].map((die, index) => (
                <motion.div
                  key={die}
                  animate={isRolling ? { rotate: [0, 360], scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3, repeat: isRolling ? Infinity : 0 }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border-2 ${
                    index === 0 
                      ? "bg-cosmic-purple/30 border-cosmic-purple text-cosmic-purple" 
                      : index === 1 
                        ? "bg-solar-orange/30 border-solar-orange text-solar-orange"
                        : "bg-cyan-blue/30 border-cyan-blue text-cyan-blue"
                  }`}
                >
                  {diceResults[index] || die}
                </motion.div>
              ))}
            </div>

            {/* Roll Button */}
            <Button 
              onClick={handleRoll}
              disabled={isRolling}
              className="w-full bg-gradient-to-r from-cosmic-purple to-solar-orange hover:opacity-90 text-white font-semibold gap-2"
            >
              <Dices className="w-4 h-4" />
              {isRolling ? "ROLANDO..." : "ROLAR"}
            </Button>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
