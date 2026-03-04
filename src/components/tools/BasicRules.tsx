import { useState } from "react";
import { ArrowLeft, BookOpen, Swords, Shield, Dices, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface BasicRulesProps {
  onBack: () => void;
}

interface RuleSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: {
    title: string;
    description: string;
  }[];
}

const RULES_SECTIONS: RuleSection[] = [
  {
    id: "ability-checks",
    title: "Testes de Habilidade",
    icon: Dices,
    content: [
      {
        title: "Como Funciona",
        description: "Role 1d20 + modificador de habilidade + bônus de proficiência (se proficiente). Compare o resultado com a CD (Classe de Dificuldade) definida pelo Mestre."
      },
      {
        title: "Classes de Dificuldade",
        description: "Muito Fácil: CD 5 | Fácil: CD 10 | Moderada: CD 15 | Difícil: CD 20 | Muito Difícil: CD 25 | Quase Impossível: CD 30"
      },
      {
        title: "Vantagem e Desvantagem",
        description: "Com vantagem, role 2d20 e use o maior resultado. Com desvantagem, role 2d20 e use o menor. Vantagem e desvantagem se cancelam."
      },
      {
        title: "Testes de Resistência",
        description: "Funciona igual aos testes de habilidade, mas é usado para resistir a efeitos mágicos, venenos, armadilhas e outros perigos."
      }
    ]
  },
  {
    id: "combat",
    title: "Combate",
    icon: Swords,
    content: [
      {
        title: "Ordem de Iniciativa",
        description: "No início do combate, todos rolam Iniciativa (1d20 + modificador de Destreza). A ordem de turno vai do maior para o menor resultado."
      },
      {
        title: "Seu Turno",
        description: "Em seu turno você pode: Mover-se (até seu deslocamento), realizar 1 Ação, realizar 1 Ação Bônus (se disponível), e 1 Interação gratuita com objeto."
      },
      {
        title: "Ataques",
        description: "Role 1d20 + modificador de habilidade + bônus de proficiência. Se igualar ou superar a CA do alvo, é um acerto. Role o dano da arma + modificador de habilidade."
      },
      {
        title: "Acerto Crítico",
        description: "Rolar 20 natural no d20 é um acerto crítico! Dobre todos os dados de dano. Rolar 1 natural é uma falha automática."
      },
      {
        title: "Ações Comuns",
        description: "Atacar, Conjurar Magia, Correr (dobra movimento), Esquivar (ataques contra você têm desvantagem), Ajudar, Esconder-se, Desengajar, Usar Objeto."
      },
      {
        title: "Reações",
        description: "Uma vez por rodada, você pode usar uma reação (como Ataque de Oportunidade quando inimigo sai do seu alcance sem Desengajar)."
      }
    ]
  },
  {
    id: "armor-class",
    title: "Classe de Armadura",
    icon: Shield,
    content: [
      {
        title: "CA Base",
        description: "Sem armadura: 10 + modificador de Destreza. Com armadura, use a CA base da armadura (algumas limitam o bônus de Destreza)."
      },
      {
        title: "Tipos de Armadura",
        description: "Leve: CA + Des total | Média: CA + Des (máx +2) | Pesada: CA fixa (pode exigir Força mínima)"
      },
      {
        title: "Escudos",
        description: "Empunhar um escudo adiciona +2 à sua CA. Requer proficiência para usar sem penalidades."
      },
      {
        title: "Cobertura",
        description: "Meia cobertura: +2 CA | Três quartos: +5 CA | Cobertura total: não pode ser alvo direto"
      }
    ]
  },
  {
    id: "conditions",
    title: "Condições Comuns",
    icon: Users,
    content: [
      {
        title: "Agarrado",
        description: "Deslocamento reduzido a 0. Termina se o agarrador for incapacitado ou se você for afastado dele."
      },
      {
        title: "Atordoado",
        description: "Incapacitado, não pode se mover, fala vacilante. Falha automática em testes de Força e Destreza. Ataques contra você têm vantagem."
      },
      {
        title: "Cego",
        description: "Falha automática em testes que requerem visão. Ataques contra você têm vantagem, seus ataques têm desvantagem."
      },
      {
        title: "Derrubado",
        description: "Só pode se arrastar ou se levantar. Desvantagem em ataques. Ataques corpo a corpo contra você têm vantagem, à distância têm desvantagem."
      },
      {
        title: "Envenenado",
        description: "Desvantagem em jogadas de ataque e testes de habilidade."
      },
      {
        title: "Paralisado",
        description: "Incapacitado, não pode se mover ou falar. Falha automática em testes de Força e Destreza. Ataques contra você têm vantagem e são críticos se corpo a corpo."
      }
    ]
  }
];

export function BasicRules({ onBack }: BasicRulesProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["ability-checks"]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Regras Básicas</h1>
            <p className="text-xs text-muted-foreground">Mecânicas fundamentais do D&D 5e</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 max-w-lg mx-auto">
        <ScrollArea className="h-full">
          <div className="space-y-3">
            {RULES_SECTIONS.map((section, index) => {
              const Icon = section.icon;
              const isExpanded = expandedSections.includes(section.id);

              return (
                <div
                  key={section.id}
                  className="glass rounded-xl overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                      <p className="text-xs text-muted-foreground">{section.content.length} regras</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                      {section.content.map((rule, ruleIndex) => (
                        <div key={ruleIndex} className="bg-muted/50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-foreground mb-1">{rule.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}