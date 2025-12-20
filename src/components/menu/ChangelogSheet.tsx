import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Bug, Wrench, Zap } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: "feature" | "fix" | "improvement" | "breaking";
    description: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2025-01-20",
    changes: [
      { type: "feature", description: "Lançamento inicial da plataforma" },
      { type: "feature", description: "Sistema de criação de personagens D&D 5e" },
      { type: "feature", description: "Gerenciamento de campanhas" },
      { type: "feature", description: "Tracker de combate em tempo real" },
      { type: "feature", description: "Sistema de chat por campanha" },
      { type: "feature", description: "Notas de campanha públicas e privadas" },
      { type: "feature", description: "Grimório de magias e compêndio de itens mágicos" },
      { type: "feature", description: "Rolador de dados integrado" },
    ],
  },
];

const typeConfig = {
  feature: {
    icon: Sparkles,
    label: "Novo",
    className: "bg-green-500/20 text-green-400",
  },
  fix: {
    icon: Bug,
    label: "Correção",
    className: "bg-red-500/20 text-red-400",
  },
  improvement: {
    icon: Zap,
    label: "Melhoria",
    className: "bg-blue-500/20 text-blue-400",
  },
  breaking: {
    icon: Wrench,
    label: "Mudança",
    className: "bg-amber-500/20 text-amber-400",
  },
};

interface ChangelogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangelogSheet({ open, onOpenChange }: ChangelogSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-darker">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="text-lg font-bold text-foreground">
            Novidades & Atualizações
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-8rem)] py-4">
          <div className="space-y-6">
            {changelog.map((entry) => (
              <div key={entry.version} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-sm font-bold rounded-full bg-primary/20 text-primary">
                    v{entry.version}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="space-y-2 pl-2">
                  {entry.changes.map((change, index) => {
                    const config = typeConfig[change.type];
                    const Icon = config.icon;
                    
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 py-2 px-3 rounded-xl bg-dark/50"
                      >
                        <div className={`px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1 ${config.className}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </div>
                        <p className="text-sm text-foreground flex-1">
                          {change.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
