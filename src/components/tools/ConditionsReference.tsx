import { useState } from "react";
import { ArrowLeft, Search, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ConditionsReferenceProps {
  onBack: () => void;
}

interface Condition {
  id: string;
  name: string;
  name_en: string;
  icon: string;
  color: string;
  description: string;
  effects: string[];
}

const CONDITIONS: Condition[] = [
  {
    id: "blinded",
    name: "Cego",
    name_en: "Blinded",
    icon: "👁️",
    color: "from-muted-foreground/60 to-muted-foreground/80",
    description: "Uma criatura cega não pode ver e falha automaticamente em qualquer teste de habilidade que exija visão.",
    effects: [
      "Falha automaticamente em testes que requerem visão",
      "Jogadas de ataque contra a criatura têm vantagem",
      "Jogadas de ataque da criatura têm desvantagem",
    ],
  },
  {
    id: "charmed",
    name: "Enfeitiçado",
    name_en: "Charmed",
    icon: "💕",
    color: "from-secondary to-secondary/80",
    description: "Uma criatura enfeitiçada não pode atacar quem a enfeitiçou ou alvejá-lo com habilidades ou efeitos mágicos nocivos.",
    effects: [
      "Não pode atacar ou prejudicar quem a enfeitiçou",
      "Quem enfeitiçou tem vantagem em testes sociais contra a criatura",
    ],
  },
  {
    id: "deafened",
    name: "Surdo",
    name_en: "Deafened",
    icon: "🔇",
    color: "from-gold to-gold/80",
    description: "Uma criatura surda não pode ouvir e falha automaticamente em qualquer teste de habilidade que exija audição.",
    effects: ["Falha automaticamente em testes que requerem audição"],
  },
  {
    id: "frightened",
    name: "Amedrontado",
    name_en: "Frightened",
    icon: "😨",
    color: "from-accent to-accent/80",
    description: "Uma criatura amedrontada tem desvantagem em testes de habilidade e jogadas de ataque enquanto a fonte de seu medo estiver em sua linha de visão.",
    effects: [
      "Desvantagem em testes de habilidade e ataques enquanto vê a fonte do medo",
      "Não pode se mover voluntariamente para mais perto da fonte do medo",
    ],
  },
  {
    id: "grappled",
    name: "Agarrado",
    name_en: "Grappled",
    icon: "🤝",
    color: "from-gold/80 to-gold/60",
    description: "A velocidade de uma criatura agarrada se torna 0, e ela não pode se beneficiar de nenhum bônus de velocidade.",
    effects: [
      "Velocidade se torna 0",
      "Não recebe bônus de velocidade",
      "Termina se quem agarra ficar incapacitado",
      "Termina se sair do alcance de quem agarra",
    ],
  },
  {
    id: "incapacitated",
    name: "Incapacitado",
    name_en: "Incapacitated",
    icon: "💫",
    color: "from-destructive to-destructive/80",
    description: "Uma criatura incapacitada não pode realizar ações ou reações.",
    effects: ["Não pode realizar ações", "Não pode realizar reações"],
  },
  {
    id: "invisible",
    name: "Invisível",
    name_en: "Invisible",
    icon: "👻",
    color: "from-primary to-primary/80",
    description: "Uma criatura invisível é impossível de ser vista sem o auxílio de magia ou um sentido especial.",
    effects: [
      "Considerada oculta para propósitos de se esconder",
      "Pode ser detectada por barulho ou rastros",
      "Ataques contra a criatura têm desvantagem",
      "Ataques da criatura têm vantagem",
    ],
  },
  {
    id: "paralyzed",
    name: "Paralisado",
    name_en: "Paralyzed",
    icon: "⚡",
    color: "from-gold to-gold/80",
    description: "Uma criatura paralisada está incapacitada e não pode se mover ou falar.",
    effects: [
      "Incapacitada (não pode agir ou reagir)",
      "Não pode se mover ou falar",
      "Falha automaticamente em testes de Força e Destreza",
      "Ataques contra têm vantagem",
      "Ataques corpo a corpo são críticos automáticos",
    ],
  },
  {
    id: "petrified",
    name: "Petrificado",
    name_en: "Petrified",
    icon: "🗿",
    color: "from-muted-foreground to-muted-foreground/80",
    description: "Uma criatura petrificada é transformada, junto com objetos não mágicos que esteja vestindo ou carregando, em uma substância sólida inanimada.",
    effects: [
      "Peso aumenta 10 vezes",
      "Para de envelhecer",
      "Incapacitada, não pode mover ou falar",
      "Inconsciente do que acontece ao redor",
      "Ataques contra têm vantagem",
      "Falha em testes de Força e Destreza",
      "Resistência a todo dano",
      "Imune a veneno e doença",
    ],
  },
  {
    id: "poisoned",
    name: "Envenenado",
    name_en: "Poisoned",
    icon: "☠️",
    color: "from-secondary to-secondary/80",
    description: "Uma criatura envenenada tem desvantagem em jogadas de ataque e testes de habilidade.",
    effects: [
      "Desvantagem em jogadas de ataque",
      "Desvantagem em testes de habilidade",
    ],
  },
  {
    id: "prone",
    name: "Caído",
    name_en: "Prone",
    icon: "🛌",
    color: "from-gold/80 to-gold/60",
    description: "Uma criatura caída só pode se arrastar a menos que se levante, terminando a condição.",
    effects: [
      "Só pode se mover rastejando",
      "Desvantagem em jogadas de ataque",
      "Ataques à distância têm desvantagem",
      "Ataques corpo a corpo têm vantagem (a 1,5m)",
      "Levantar custa metade do movimento",
    ],
  },
  {
    id: "restrained",
    name: "Impedido",
    name_en: "Restrained",
    icon: "⛓️",
    color: "from-muted-foreground/60 to-muted-foreground/80",
    description: "A velocidade de uma criatura impedida se torna 0, e ela não pode se beneficiar de nenhum bônus de velocidade.",
    effects: [
      "Velocidade se torna 0",
      "Ataques contra têm vantagem",
      "Ataques da criatura têm desvantagem",
      "Desvantagem em testes de Destreza",
    ],
  },
  {
    id: "stunned",
    name: "Atordoado",
    name_en: "Stunned",
    icon: "💥",
    color: "from-primary to-primary/80",
    description: "Uma criatura atordoada está incapacitada, não pode se mover e só pode falar balbuciando.",
    effects: [
      "Incapacitada (não pode agir ou reagir)",
      "Não pode se mover",
      "Só pode balbuciar",
      "Falha em testes de Força e Destreza",
      "Ataques contra têm vantagem",
    ],
  },
  {
    id: "unconscious",
    name: "Inconsciente",
    name_en: "Unconscious",
    icon: "😴",
    color: "from-accent to-accent/80",
    description: "Uma criatura inconsciente está incapacitada, não pode se mover ou falar, e está inconsciente do que acontece ao redor.",
    effects: [
      "Incapacitada (não pode agir ou reagir)",
      "Não pode se mover ou falar",
      "Inconsciente do ambiente",
      "Larga o que estiver segurando e cai caída",
      "Falha em testes de Força e Destreza",
      "Ataques contra têm vantagem",
      "Ataques corpo a corpo são críticos automáticos",
    ],
  },
  {
    id: "exhaustion",
    name: "Exaustão",
    name_en: "Exhaustion",
    icon: "😩",
    color: "from-destructive to-destructive/80",
    description: "Exaustão é medida em seis níveis. Um efeito pode dar a uma criatura um ou mais níveis de exaustão.",
    effects: [
      "Nível 1: Desvantagem em testes de habilidade",
      "Nível 2: Velocidade reduzida à metade",
      "Nível 3: Desvantagem em ataques e testes de resistência",
      "Nível 4: Máximo de pontos de vida reduzido à metade",
      "Nível 5: Velocidade reduzida a 0",
      "Nível 6: Morte",
    ],
  },
];

export function ConditionsReference({ onBack }: ConditionsReferenceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredConditions = CONDITIONS.filter(
    (condition) =>
      condition.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      condition.name_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Condições</h1>
            <p className="text-xs text-muted-foreground">Referência rápida de status</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar condições..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </header>

      {/* Conditions List */}
      <main className="px-4 py-4 max-w-lg mx-auto">
        <div className="space-y-2">
          {filteredConditions.map((condition, index) => {
            const isExpanded = expandedId === condition.id;

            return (
              <div
                key={condition.id}
                className={cn(
                  "glass rounded-xl overflow-hidden transition-all animate-fade-in",
                  isExpanded && "border-primary/50"
                )}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : condition.id)}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl flex-shrink-0",
                      condition.color
                    )}
                  >
                    {condition.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{condition.name}</h3>
                    <p className="text-xs text-muted-foreground">{condition.name_en}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 animate-fade-in">
                    <p className="text-sm text-foreground/80">{condition.description}</p>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Efeitos
                      </h4>
                      <ul className="space-y-1">
                        {condition.effects.map((effect, i) => (
                          <li
                            key={i}
                            className="text-sm text-foreground/70 flex items-start gap-2"
                          >
                            <span className="text-primary mt-1">•</span>
                            <span>{effect}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredConditions.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma condição encontrada</p>
          </div>
        )}
      </main>
    </div>
  );
}
