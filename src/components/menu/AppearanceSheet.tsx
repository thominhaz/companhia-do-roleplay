import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Moon, Sun, Monitor } from "lucide-react";
import { useState } from "react";

interface AppearanceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Theme = "dark" | "light" | "system";

export function AppearanceSheet({ open, onOpenChange }: AppearanceSheetProps) {
  const [theme, setTheme] = useState<Theme>("dark");

  const themes = [
    { id: "dark" as Theme, label: "Escuro", icon: Moon, description: "Tema escuro para ambientes com pouca luz" },
    { id: "light" as Theme, label: "Claro", icon: Sun, description: "Tema claro para ambientes bem iluminados" },
    { id: "system" as Theme, label: "Sistema", icon: Monitor, description: "Seguir configuração do dispositivo" },
  ];

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    // Note: Theme switching functionality would need to be connected to a theme provider
    // For now, we just update the local state
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Aparência
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3 pb-8">
          {themes.map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                  isSelected 
                    ? "bg-primary/20 border-2 border-primary" 
                    : "bg-muted border-2 border-transparent hover:border-primary/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSelected ? "bg-primary" : "bg-background"
                }`}>
                  <Icon className={`w-5 h-5 ${isSelected ? "text-foreground" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-foreground" />
                  </div>
                )}
              </button>
            );
          })}
          
          <p className="text-xs text-muted-foreground text-center pt-4">
            O tema escuro está ativo por padrão. Mais opções de personalização em breve!
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}