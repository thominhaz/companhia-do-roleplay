import { Dice6, Scroll, Swords, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    id: "roll-dice",
    label: "Rolar Dados",
    icon: Dice6,
    color: "orange",
    gradient: "from-solar-orange to-solar-orange/70",
  },
  {
    id: "new-character",
    label: "Novo Personagem",
    icon: Scroll,
    color: "purple",
    gradient: "from-cosmic-purple to-cosmic-purple/70",
  },
  {
    id: "combat",
    label: "Combate",
    icon: Swords,
    color: "red",
    gradient: "from-magenta-red to-magenta-red/70",
  },
  {
    id: "compendium",
    label: "Compêndio",
    icon: BookOpen,
    color: "cyan",
    gradient: "from-cyan-blue to-cyan-blue/70",
  },
];

interface QuickActionsProps {
  onAction?: (actionId: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Ações Rápidas
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction?.(action.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl",
                "bg-gradient-to-br",
                action.gradient,
                "transition-all duration-300 hover:scale-105 active:scale-95",
                "shadow-lg hover:shadow-xl"
              )}
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <Icon className="w-6 h-6 text-foreground mb-1" />
              <span className="text-[10px] font-medium text-foreground/90 text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
