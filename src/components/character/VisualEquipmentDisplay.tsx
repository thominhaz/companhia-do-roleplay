import { useState } from "react";
import { 
  Shield, 
  Sword, 
  Shirt,
  Crown,
  Footprints,
  Hand,
  Circle,
  Gem,
  Package,
} from "lucide-react";
import characterSilhouette from "@/assets/character-silhouette.png";
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
  equipped?: boolean;
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

// Equipment slots organized by side (like WoW style)
const LEFT_SLOTS = [
  { id: "helmet", label: "Elmo", icon: Crown },
  { id: "amulet", label: "Amuleto", icon: Gem },
  { id: "armor", label: "Armadura", icon: Shirt },
  { id: "cloak", label: "Capa", icon: Package },
  { id: "gloves", label: "Luvas", icon: Hand },
];

const RIGHT_SLOTS = [
  { id: "ring1", label: "Anel 1", icon: Circle },
  { id: "ring2", label: "Anel 2", icon: Circle },
  { id: "boots", label: "Botas", icon: Footprints },
  { id: "mainHand", label: "Mão Principal", icon: Sword },
  { id: "offHand", label: "Mão Secundária", icon: Shield },
];

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
  // Note: items can have either 'equipped' or 'isEquipped' flag
  equipment.forEach((item) => {
    if (!item.isEquipped && !item.equipped) return;
    
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
    
    // Support both 'equipped' and 'isEquipped' flags
    const updatedEquipment = equipment.map((eq) => 
      eq.id === item.id ? { ...eq, isEquipped: false, equipped: false } : eq
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

  const renderSlot = (slot: { id: string; label: string; icon: any }) => {
    const equipped = equippedBySlot[slot.id];
    const Icon = slot.icon;
    
    return (
      <Tooltip key={slot.id}>
        <TooltipTrigger asChild>
          <button
            onClick={() => equipped ? handleUnequip(slot.id) : setSelectedSlot(slot.id)}
            className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 lg:w-20 lg:h-20 rounded-xl transition-all duration-200 flex-shrink-0
              ${equipped 
                ? `bg-card border-2 ${getRarityBorder(equipped.rarity)} shadow-lg hover:scale-105` 
                : "bg-muted/30 border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
              }`}
          >
            {equipped ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-1">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary mb-0.5" />
                <span className="text-[8px] sm:text-[9px] lg:text-[10px] text-center text-muted-foreground leading-tight line-clamp-2 px-0.5">
                  {equipped.name}
                </span>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-muted-foreground/50" />
                <span className="text-[8px] sm:text-[9px] lg:text-[10px] text-muted-foreground/50 mt-0.5">{slot.label}</span>
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
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-2xl mx-auto px-2">
        {/* WoW-style layout: left slots | character | right slots */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-6">
          {/* Left column slots */}
          <div className="flex flex-col gap-2 sm:gap-3">
            {LEFT_SLOTS.map(renderSlot)}
          </div>
          
          {/* Character silhouette in center */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent rounded-2xl" />
            <img 
              src={characterSilhouette} 
              alt="Silhueta do personagem"
              className="w-40 h-80 sm:w-48 sm:h-96 lg:w-56 lg:h-[28rem] object-contain opacity-70"
            />
          </div>
          
          {/* Right column slots */}
          <div className="flex flex-col gap-2 sm:gap-3">
            {RIGHT_SLOTS.map(renderSlot)}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-card/80 border border-border/50 rounded-xl p-3 sm:p-4 text-center">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-blue-400" />
            <p className="text-lg sm:text-xl font-bold">{character.armor_class}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">CA Total</p>
          </div>
          <div className="bg-card/80 border border-border/50 rounded-xl p-3 sm:p-4 text-center">
            <Sword className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-red-400" />
            <p className="text-lg sm:text-xl font-bold">
              {equipment.filter(e => (e.isEquipped || e.equipped) && (e.type === 'weapon' || e.type === 'arma')).length}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Armas</p>
          </div>
          <div className="bg-card/80 border border-border/50 rounded-xl p-3 sm:p-4 text-center">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-amber-400" />
            <p className="text-lg sm:text-xl font-bold">
              {equipment.filter(e => e.isEquipped || e.equipped).length}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Equipados</p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
