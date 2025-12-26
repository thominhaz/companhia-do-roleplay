import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Bug, Wrench, Zap, Rocket, Brain, FileText, Store, Users, Swords, Gem, Clock, Flag, Hammer, FileDown } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: "feature" | "fix" | "improvement" | "breaking";
    description: string;
  }[];
}

interface UpcomingFeature {
  icon: React.ElementType;
  title: string;
  description: string;
}

const changelog: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2025-12-26",
    changes: [
      { type: "feature", description: "Timeline de Campanha: linha do tempo visual e interativa para eventos da história" },
      { type: "feature", description: "Sistema de Facções: gerencie facções com reputação, influência e relacionamentos" },
      { type: "feature", description: "Oficina de Documentos: crie contratos, cartas, pergaminhos e documentos personalizados" },
      { type: "feature", description: "Oficina de Lojas: mercadores com inventário, preços e histórico de transações" },
      { type: "feature", description: "Oficina de NPCs: gerencie NPCs com personalidade, motivações e relacionamentos" },
      { type: "feature", description: "Sistema de presentes do mestre: envie itens diretamente aos jogadores" },
      { type: "improvement", description: "Geradores de encontros e tesouros em desenvolvimento" },
    ],
  },
  {
    version: "1.1.0",
    date: "2025-06-26",
    changes: [
      { type: "feature", description: "Sistema de recapitulação pós-sessão com resumo, destaques e recompensas" },
      { type: "feature", description: "Histórico completo de sessões passadas com notas do mestre" },
      { type: "improvement", description: "Melhorias na responsividade do wizard de criação de personagem" },
    ],
  },
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

const upcomingFeatures: UpcomingFeature[] = [
  {
    icon: Brain,
    title: "Sistema de Stress e Sanidade",
    description: "Mecânicas completas para campanhas de horror, incluindo sistema de medo, traumas e loucura inspirado em Call of Cthulhu.",
  },
  {
    icon: Swords,
    title: "Gerador de Encontros",
    description: "Crie combates balanceados com medidor de dificuldade que compara o nível dos jogadores com os monstros selecionados.",
  },
  {
    icon: Gem,
    title: "Gerador de Tesouros",
    description: "Gere loot aleatório baseado no nível de dificuldade, tipo de criatura e raridade dos itens.",
  },
  {
    icon: Hammer,
    title: "Sistema de Crafting",
    description: "Criação de itens, poções, pergaminhos e encantamentos com receitas, materiais e tempo de fabricação.",
  },
  {
    icon: FileDown,
    title: "Exportar para PDF",
    description: "Exporte fichas de personagem em PDF profissional, pronto para impressão ou compartilhamento.",
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
          <div className="space-y-8">
            {/* Próximas Atualizações */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Próximas Atualizações</h3>
              </div>
              
              <div className="grid gap-3">
                {upcomingFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-primary/5 border border-primary/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground text-sm">
                            {feature.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Histórico de Versões */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">Histórico de Versões</h3>
              
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
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
