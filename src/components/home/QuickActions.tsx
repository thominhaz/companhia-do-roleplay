import { Dice6, Scroll, Swords, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    id: "roll-dice",
    label: "Rolar Dados",
    icon: Dice6,
    color: "primary" as const,
  },
  {
    id: "new-character",
    label: "Novo Personagem",
    icon: Scroll,
    color: "secondary" as const,
  },
  {
    id: "combat",
    label: "Combate",
    icon: Swords,
    color: "primary" as const,
  },
  {
    id: "compendium",
    label: "Compêndio",
    icon: BookOpen,
    color: "secondary" as const,
  },
];

const colorStyles = {
  primary: "border-primary/40 bg-primary/10 text-primary",
  secondary: "border-secondary/40 bg-secondary/10 text-secondary",
};

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
                "flex flex-col items-center justify-center p-3 rounded-2xl border",
                colorStyles[action.color],
                "transition-all duration-300 hover:scale-105 active:scale-95",
                "shadow-depth-sm hover:shadow-depth-md"
              )}
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium text-center leading-tight opacity-80">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
