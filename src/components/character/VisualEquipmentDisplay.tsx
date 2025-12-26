import { useState } from "react";
import { 
  User, 
  Shield, 
  Sword, 
  Shirt,
  Crown,
  Footprints,
  Hand,
  Circle,
  Gem,
  Package,
  X,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUpdateCharacter } from "@/hooks/useCharacters";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EquipmentItem {
  id: string;
  name: string;
  type?: string;
  damage?: string;
  armorClass?: number;
  isEquipped?: boolean;
  description?: string;
  rarity?: string;
}

interface VisualEquipmentDisplayProps {
  character: {
    id: string;
    name: string;
    race: string;
    class: string;
    level: number;
    armor_class: number;
    equipment: any;
    inventory: any;
  };
  onEquipItem?: (item: EquipmentItem, slot: string) => void;
  onUnequipItem?: (slot: string) => void;
}

// Equipment slot configuration
const EQUIPMENT_SLOTS = {
  helmet: { label: "Elmo", icon: Crown, position: "top-0 left-1/2 -translate-x-1/2" },
  armor: { label: "Armadura", icon: Shirt, position: "top-20 left-1/2 -translate-x-1/2" },
  mainHand: { label: "Mão Principal", icon: Sword, position: "top-24 -left-4" },
  offHand: { label: "Mão Secundária", icon: Shield, position: "top-24 -right-4" },
  gloves: { label: "Luvas", icon: Hand, position: "top-44 -left-8" },
  ring1: { label: "Anel 1", icon: Circle, position: "top-52 -left-4" },
  ring2: { label: "Anel 2", icon: Circle, position: "top-52 -right-4" },
  boots: { label: "Botas", icon: Footprints, position: "bottom-4 left-1/2 -translate-x-1/2" },
  amulet: { label: "Amuleto", icon: Gem, position: "top-14 left-1/2 -translate-x-1/2" },
  cloak: { label: "Capa", icon: Package, position: "top-36 -right-8" },
};

const RARITY_COLORS: Record<string, string> = {
  comum: "border-muted-foreground/50",
  incomum: "border-green-500",
  raro: "border-blue-500",
  "muito raro": "border-purple-500",
  lendário: "border-orange-500",
  artefato: "border-red-500",
};

export function VisualEquipmentDisplay({ character, onEquipItem, onUnequipItem }: VisualEquipmentDisplayProps) {
  const updateCharacter = useUpdateCharacter();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  const equipment = (character.equipment as EquipmentItem[]) || [];
  
  // Parse equipped items into slots
  const equippedBySlot: Record<string, EquipmentItem | null> = {
    helmet: null,
    armor: null,
    mainHand: null,
    offHand: null,
    gloves: null,
    ring1: null,
    ring2: null,
    boots: null,
    amulet: null,
    cloak: null,
  };
  
  // Map equipment items to slots based on type
  equipment.forEach((item) => {
    if (!item.isEquipped) return;
    
    const type = item.type?.toLowerCase();
    if (type === "armor" || type === "armadura") {
      if (!equippedBySlot.armor) equippedBySlot.armor = item;
    } else if (type === "weapon" || type === "arma") {
      if (!equippedBySlot.mainHand) equippedBySlot.mainHand = item;
      else if (!equippedBySlot.offHand) equippedBySlot.offHand = item;
    } else if (type === "shield" || type === "escudo") {
      if (!equippedBySlot.offHand) equippedBySlot.offHand = item;
    } else if (type === "helmet" || type === "elmo") {
      equippedBySlot.helmet = item;
    } else if (type === "gloves" || type === "luvas") {
      equippedBySlot.gloves = item;
    } else if (type === "boots" || type === "botas") {
      equippedBySlot.boots = item;
    } else if (type === "ring" || type === "anel") {
      if (!equippedBySlot.ring1) equippedBySlot.ring1 = item;
      else if (!equippedBySlot.ring2) equippedBySlot.ring2 = item;
    } else if (type === "amulet" || type === "amuleto") {
      equippedBySlot.amulet = item;
    } else if (type === "cloak" || type === "capa") {
      equippedBySlot.cloak = item;
    }
  });

  const handleUnequip = async (slot: string) => {
    const item = equippedBySlot[slot];
    if (!item) return;
    
    const updatedEquipment = equipment.map((eq) => 
      eq.id === item.id ? { ...eq, isEquipped: false } : eq
    );
    
    try {
      await updateCharacter.mutateAsync({
        id: character.id,
        equipment: updatedEquipment,
      });
      toast.success(`${item.name} desequipado`);
    } catch (error) {
      toast.error("Erro ao desequipar item");
    }
  };

  const getRarityBorder = (rarity?: string) => {
    if (!rarity) return "border-border";
    return RARITY_COLORS[rarity.toLowerCase()] || "border-border";
  };

  return (
    <TooltipProvider>
      <div className="relative w-full max-w-md mx-auto">
        {/* Character Silhouette Container */}
        <div className="relative h-[420px] flex items-center justify-center">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-transparent rounded-3xl" />
          
          {/* Character silhouette */}
          <div className="relative z-10 w-32 h-64 flex items-center justify-center">
            <div className="relative">
              {/* Silhouette body */}
              <svg 
                viewBox="0 0 100 200" 
                className="w-32 h-64 fill-muted-foreground/20 stroke-primary/30"
                strokeWidth="1"
              >
                {/* Head */}
                <circle cx="50" cy="20" r="15" />
                {/* Neck */}
                <rect x="45" y="35" width="10" height="10" />
                {/* Body */}
                <path d="M30 45 L70 45 L75 100 L65 100 L60 80 L55 100 L45 100 L40 80 L35 100 L25 100 Z" />
                {/* Arms */}
                <path d="M30 45 L15 55 L10 90 L20 92 L25 60 L30 60" />
                <path d="M70 45 L85 55 L90 90 L80 92 L75 60 L70 60" />
                {/* Legs */}
                <path d="M35 100 L30 160 L40 165 L45 105" />
                <path d="M55 105 L60 165 L70 160 L65 100" />
                {/* Feet */}
                <ellipse cx="35" cy="175" rx="12" ry="6" />
                <ellipse cx="65" cy="175" rx="12" ry="6" />
              </svg>
              
              {/* Character info overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <User className="w-8 h-8 mx-auto mb-1 text-primary/40" />
                <p className="text-[10px] text-muted-foreground font-medium">
                  {character.name}
                </p>
              </div>
            </div>
          </div>
          
          {/* Equipment Slots */}
          {Object.entries(EQUIPMENT_SLOTS).map(([slotId, slot]) => {
            const equipped = equippedBySlot[slotId];
            const Icon = slot.icon;
            
            return (
              <Tooltip key={slotId}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => equipped ? handleUnequip(slotId) : setSelectedSlot(slotId)}
                    className={`absolute ${slot.position} w-14 h-14 rounded-xl transition-all duration-200
                      ${equipped 
                        ? `bg-card border-2 ${getRarityBorder(equipped.rarity)} shadow-lg hover:scale-105` 
                        : "bg-muted/30 border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
                      }`}
                  >
                    {equipped ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-1">
                        <Icon className="w-5 h-5 text-primary mb-0.5" />
                        <span className="text-[8px] text-center text-muted-foreground leading-tight line-clamp-2 px-0.5">
                          {equipped.name}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground/50" />
                        <span className="text-[8px] text-muted-foreground/50 mt-0.5">{slot.label}</span>
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {equipped ? (
                    <div className="space-y-1">
                      <p className="font-semibold">{equipped.name}</p>
                      {equipped.rarity && (
                        <Badge variant="outline" className="text-[10px]">{equipped.rarity}</Badge>
                      )}
                      {equipped.damage && <p className="text-xs text-muted-foreground">Dano: {equipped.damage}</p>}
                      {equipped.armorClass && <p className="text-xs text-muted-foreground">CA: +{equipped.armorClass}</p>}
                      {equipped.description && <p className="text-xs text-muted-foreground">{equipped.description}</p>}
                      <p className="text-[10px] text-primary mt-1">Clique para desequipar</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">{slot.label}</p>
                      <p className="text-xs text-muted-foreground">Slot vazio</p>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Stats Summary */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-card/80 border border-border/50 rounded-xl p-3 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <p className="text-lg font-bold">{character.armor_class}</p>
            <p className="text-[10px] text-muted-foreground">CA Total</p>
          </div>
          <div className="bg-card/80 border border-border/50 rounded-xl p-3 text-center">
            <Sword className="w-5 h-5 mx-auto mb-1 text-red-400" />
            <p className="text-lg font-bold">
              {equipment.filter(e => e.isEquipped && (e.type === 'weapon' || e.type === 'arma')).length}
            </p>
            <p className="text-[10px] text-muted-foreground">Armas</p>
          </div>
          <div className="bg-card/80 border border-border/50 rounded-xl p-3 text-center">
            <Package className="w-5 h-5 mx-auto mb-1 text-amber-400" />
            <p className="text-lg font-bold">
              {equipment.filter(e => e.isEquipped).length}
            </p>
            <p className="text-[10px] text-muted-foreground">Equipados</p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
