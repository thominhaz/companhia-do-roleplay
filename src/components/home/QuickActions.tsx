import { Dice6, Scroll, Swords, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    id: "roll-dice",
    label: "Rolar Dados",
    icon: Dice6,
    color: "purple",
    gradient: "from-primary to-primary/70",
  },
  {
    id: "new-character",
    label: "Novo Personagem",
    icon: Scroll,
    color: "pink",
    gradient: "from-secondary to-secondary/70",
  },
  {
    id: "combat",
    label: "Combate",
    icon: Swords,
    color: "blue",
    gradient: "from-neon-blue to-neon-blue/70",
  },
  {
    id: "compendium",
    label: "Compêndio",
    icon: BookOpen,
    color: "gold",
    gradient: "from-gold to-gold/70",
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
