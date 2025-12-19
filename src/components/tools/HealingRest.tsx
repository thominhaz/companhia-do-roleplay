import { useState } from "react";
import { ArrowLeft, Heart, Moon, Sun, Coffee, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface HealingRestProps {
  onBack: () => void;
}

interface RestSection {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  content: {
    title: string;
    description: string;
  }[];
}

const REST_SECTIONS: RestSection[] = [
  {
    id: "short-rest",
    title: "Descanso Curto",
    icon: Coffee,
    iconColor: "text-yellow-400",
    content: [
      {
        title: "Duração",
        description: "Um descanso curto é um período de inatividade de pelo menos 1 hora, durante o qual você não faz nada mais extenuante do que comer, beber, ler e cuidar de ferimentos."
      },
      {
        title: "Dados de Vida",
        description: "Ao final do descanso curto, você pode gastar um ou mais Dados de Vida (até seu máximo). Para cada Dado de Vida gasto, role o dado e adicione seu modificador de Constituição. Você recupera pontos de vida iguais ao total."
      },
      {
        title: "Recuperação de Habilidades",
        description: "Algumas habilidades de classe são recuperadas após um descanso curto. Consulte as características de sua classe para saber quais."
      }
    ]
  },
  {
    id: "long-rest",
    title: "Descanso Longo",
    icon: Moon,
    iconColor: "text-blue-400",
    content: [
      {
        title: "Duração",
        description: "Um descanso longo é um período de descanso estendido de pelo menos 8 horas. Você pode dormir por no máximo 6 horas e realizar atividade leve (vigiar, ler) por até 2 horas."
      },
      {
        title: "Recuperação de HP",
        description: "Ao final do descanso longo, você recupera todos os pontos de vida perdidos. Você também recupera Dados de Vida gastos, até um número de dados igual à metade do seu total (mínimo 1)."
      },
      {
        title: "Espaços de Magia",
        description: "Conjuradores recuperam todos os espaços de magia gastos ao final de um descanso longo."
      },
      {
        title: "Limitações",
        description: "Você só pode se beneficiar de um descanso longo a cada 24 horas. Você deve ter pelo menos 1 ponto de vida no início do descanso para receber seus benefícios."
      },
      {
        title: "Interrupção",
        description: "Se o descanso for interrompido por combate ou outra atividade extenuante (pelo menos 1 hora de caminhada, combate, ou atividade similar), você deve recomeçar o descanso para obter benefícios."
      }
    ]
  },
  {
    id: "healing",
    title: "Cura",
    icon: Heart,
    iconColor: "text-red-400",
    content: [
      {
        title: "Pontos de Vida",
        description: "Pontos de vida representam uma combinação de resistência física e mental, vontade de viver e sorte. Quando você atinge 0 HP, você cai inconsciente."
      },
      {
        title: "Cura Mágica",
        description: "Magias como Curar Ferimentos restauram pontos de vida instantaneamente. A quantidade de HP recuperada depende da magia e do nível em que é conjurada."
      },
      {
        title: "Poções de Cura",
        description: "Poção de Cura (2d4+2 HP) | Poção de Cura Maior (4d4+4 HP) | Poção de Cura Superior (8d4+8 HP) | Poção de Cura Suprema (10d4+20 HP)"
      },
      {
        title: "Pontos de Vida Temporários",
        description: "HP temporários não são cura real - são uma barreira que absorve dano. Não podem exceder seu HP máximo e desaparecem após um descanso longo. HP temporários de fontes diferentes não se acumulam."
      }
    ]
  },
  {
    id: "death",
    title: "Morte & Estabilização",
    icon: Sparkles,
    iconColor: "text-purple-400",
    content: [
      {
        title: "Caindo a 0 HP",
        description: "Quando você chega a 0 pontos de vida, você cai inconsciente e começa a fazer testes de resistência contra a morte no início de cada um de seus turnos."
      },
      {
        title: "Testes de Resistência contra Morte",
        description: "Role 1d20. Com 10 ou mais, você obtém um sucesso. Com 9 ou menos, uma falha. Três sucessos: você se estabiliza. Três falhas: você morre. Um 20 natural: você recupera 1 HP. Um 1 natural: conta como duas falhas."
      },
      {
        title: "Estabilização",
        description: "Uma criatura estabilizada está inconsciente mas não precisa fazer mais testes. Ela permanece com 0 HP. Após 1d4 horas, recupera 1 HP."
      },
      {
        title: "Primeiros Socorros",
        description: "Com um kit de curandeiro e uma ação, você pode fazer um teste de Sabedoria (Medicina) CD 10 para estabilizar uma criatura com 0 HP."
      },
      {
        title: "Morte Instantânea",
        description: "Se o dano em excesso igualar ou superar seu máximo de pontos de vida, você morre instantaneamente. Ex: com máximo de 12 HP e 0 HP atual, sofrer 12+ de dano = morte."
      }
    ]
  }
];

export function HealingRest({ onBack }: HealingRestProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["short-rest"]);

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
            <h1 className="text-xl font-bold text-foreground">Cura & Descanso</h1>
            <p className="text-xs text-muted-foreground">Regras de recuperação de HP</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 max-w-lg mx-auto">
        <ScrollArea className="h-full">
          <div className="space-y-3">
            {REST_SECTIONS.map((section, index) => {
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className={cn("w-5 h-5", section.iconColor)} />
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