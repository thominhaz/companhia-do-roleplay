import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Moon, Sun, Monitor, Sparkles, Lock, Crown, Palette } from "lucide-react";
import { useTheme, ThemeMode, ThemeStyle } from "@/hooks/useTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";

interface AppearanceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ThemeModeOption {
  id: ThemeMode;
  label: string;
  icon: typeof Moon;
  description: string;
}

interface ThemeStyleOption {
  id: ThemeStyle;
  label: string;
  description: string;
  premium: boolean;
  colors: string[];
}

export function AppearanceSheet({ open, onOpenChange }: AppearanceSheetProps) {
  const { mode, style, setMode, setStyle, canUseTheme } = useTheme();
  const { data: subscription } = useSubscription();

  const modes: ThemeModeOption[] = [
    { id: "dark", label: "Escuro", icon: Moon, description: "Tema escuro para ambientes com pouca luz" },
    { id: "light", label: "Claro", icon: Sun, description: "Tema claro para ambientes bem iluminados" },
    { id: "system", label: "Sistema", icon: Monitor, description: "Seguir configuração do dispositivo" },
  ];

  const styles: ThemeStyleOption[] = [
    { 
      id: "default", 
      label: "Go20 Clássico", 
      description: "O tema padrão com cores do logo",
      premium: false,
      colors: ["hsl(27, 100%, 67%)", "hsl(271, 76%, 53%)", "hsl(195, 93%, 70%)"]
    },
    { 
      id: "neon", 
      label: "Neon", 
      description: "Visual cyberpunk com cores vibrantes",
      premium: true,
      colors: ["hsl(280, 100%, 65%)", "hsl(180, 100%, 50%)", "hsl(320, 100%, 60%)"]
    },
    { 
      id: "vintage", 
      label: "Vintage", 
      description: "Estilo pergaminho antigo e rústico",
      premium: true,
      colors: ["hsl(45, 90%, 55%)", "hsl(35, 80%, 45%)", "hsl(25, 60%, 35%)"]
    },
    { 
      id: "dark-elf", 
      label: "Dark Elf", 
      description: "Inspirado nos Drow do Underdark",
      premium: true,
      colors: ["hsl(270, 80%, 60%)", "hsl(300, 70%, 45%)", "hsl(200, 80%, 55%)"]
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Aparência
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-6rem)] pb-8">
          {/* Mode Selection */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Moon className="w-4 h-4" />
              Modo
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {modes.map((m) => {
                const Icon = m.icon;
                const isSelected = mode === m.id;
                
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      isSelected 
                        ? "bg-primary/20 border-2 border-primary" 
                        : "bg-muted border-2 border-transparent hover:border-primary/30"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Styles */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Tema
            </h4>
            <div className="space-y-3">
              {styles.map((t) => {
                const isSelected = style === t.id;
                const canUse = canUseTheme(t.id);
                const isLocked = t.premium && !canUse;
                
                return (
                  <button
                    key={t.id}
                    onClick={() => !isLocked && setStyle(t.id)}
                    disabled={isLocked}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                      isSelected 
                        ? "bg-primary/20 border-2 border-primary" 
                        : isLocked
                          ? "bg-muted/50 border-2 border-transparent opacity-60 cursor-not-allowed"
                          : "bg-muted border-2 border-transparent hover:border-primary/30"
                    }`}
                  >
                    {/* Color Preview */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex shrink-0">
                      {t.colors.map((color, i) => (
                        <div 
                          key={i} 
                          className="flex-1 h-full" 
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{t.label}</p>
                        {t.premium && (
                          <Badge 
                            variant={canUse ? "secondary" : "outline"} 
                            className={`text-[10px] px-1.5 py-0 ${canUse ? "bg-gold/20 text-gold border-gold/30" : ""}`}
                          >
                            {canUse ? <Crown className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                            {canUse ? "Premium" : "Bloqueado"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </div>
                    
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Premium Notice */}
          {!subscription?.limits.hasThemes && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-gold/10 to-amber-500/10 border border-gold/20">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-gold" />
                <div>
                  <p className="text-sm font-medium text-foreground">Temas Exclusivos</p>
                  <p className="text-xs text-muted-foreground">
                    Desbloqueie todos os temas com o plano Herói ou Mestre
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
