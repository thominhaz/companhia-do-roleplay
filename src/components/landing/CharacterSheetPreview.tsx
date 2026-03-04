import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";
import { DiceSVG } from "./DiceSVG";

// Character images
import elfaMaga from "@/assets/landing/elfa-maga.png";
import guerreiroPaladino from "@/assets/landing/guerreiro-paladino.png";
import anaoClerigo from "@/assets/landing/anao-clerigo.png";

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
    theme: "Clérigo",
    character: {
      name: "Thorin Barbavermelhão",
      race: "Anão",
      class: "Clérigo",
      background: "Acólito",
      imageUrl: anaoClerigo,
      attributes: { forca: 13, destreza: 10, constituicao: 15, inteligencia: 12, sabedoria: 16, carisma: 8 },
    },
  },
  {
    theme: "Maga",
    character: {
      name: "Elara Luavante",
      race: "Elfa",
      class: "Maga",
      background: "Sábio",
      imageUrl: elfaMaga,
      attributes: { forca: 8, destreza: 14, constituicao: 12, inteligencia: 17, sabedoria: 13, carisma: 10 },
    },
  },
  {
    theme: "Paladino",
    character: {
      name: "Aldric Punoférreo",
      race: "Humano",
      class: "Paladino",
      background: "Soldado",
      imageUrl: guerreiroPaladino,
      attributes: { forca: 16, destreza: 10, constituicao: 14, inteligencia: 10, sabedoria: 12, carisma: 15 },
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
    <div className="bg-surface-1 rounded-xl p-3 text-center border border-border hover:border-primary/50 transition-all">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className={`text-sm font-semibold ${modifierColor}`}>
        {modifier >= 0 ? "+" : ""}{modifier}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

const diceTypes: ("d20" | "d8" | "d6")[] = ["d20", "d8", "d6"];
const diceMaxValues = { d20: 20, d8: 8, d6: 6 };

export function CharacterSheetPreview() {
  const [activeTheme, setActiveTheme] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [diceResults, setDiceResults] = useState<number[]>([20, 8, 6]);
  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentChar = demoCharacters[activeTheme].character;

  const handleRoll = useCallback(() => {
    if (isRolling) return;
    
    setIsRolling(true);

    // Clear any existing interval
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
    }

    // Animate dice values during roll
    rollIntervalRef.current = setInterval(() => {
      setDiceResults([
        Math.floor(Math.random() * 20) + 1,
        Math.floor(Math.random() * 8) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 80);

    // Stop rolling after animation
    setTimeout(() => {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }
      
      // Set final results
      setDiceResults([
        Math.floor(Math.random() * 20) + 1,
        Math.floor(Math.random() * 8) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
      
      setIsRolling(false);
    }, 1000);
  }, [isRolling]);

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-solar-orange/10 to-primary/20 blur-3xl rounded-3xl" />
      
      <motion.div 
        className="relative bg-surface-0 rounded-2xl border border-border overflow-hidden shadow-depth-lg"
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
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
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
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-solar-orange p-1">
                  <div className="w-full h-full rounded-full bg-surface-0 p-1">
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
              <h3 className="text-xl font-bold text-foreground mt-3">{currentChar.name}</h3>
            </div>

            {/* Info Section */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Informações</div>
              <div className="bg-surface-1 rounded-xl p-3 border border-border">
                <div className="text-sm text-foreground/80">{currentChar.race} • {currentChar.class}</div>
              </div>
              <div className="bg-surface-1 rounded-xl p-3 border border-border">
                <div className="text-sm text-foreground/80">{currentChar.background}</div>
              </div>
            </div>

            {/* Attributes */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Atributos</div>
              <div className="grid grid-cols-3 gap-2">
                <AttributeBox value={currentChar.attributes.forca} label="Força" />
                <AttributeBox value={currentChar.attributes.destreza} label="Destreza" />
                <AttributeBox value={currentChar.attributes.constituicao} label="Constituição" />
                <AttributeBox value={currentChar.attributes.inteligencia} label="Inteligência" />
                <AttributeBox value={currentChar.attributes.sabedoria} label="Sabedoria" />
                <AttributeBox value={currentChar.attributes.carisma} label="Carisma" />
              </div>
            </div>

            {/* Dice Display with SVG Dice */}
            <div className="flex justify-center gap-4 py-2">
              {diceTypes.map((dieType, index) => (
                <DiceSVG
                  key={dieType}
                  type={dieType}
                  value={diceResults[index]}
                  isRolling={isRolling}
                  size={52}
                />
              ))}
            </div>

            {/* Roll Button */}
            <Button 
              onClick={handleRoll}
              disabled={isRolling}
              className="w-full bg-gradient-to-r from-primary to-solar-orange hover:opacity-90 text-primary-foreground font-semibold gap-2 disabled:opacity-70"
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
