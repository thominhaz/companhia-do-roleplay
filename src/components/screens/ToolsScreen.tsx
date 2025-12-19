import { useNavigate } from "react-router-dom";
import { 
  Dice6, 
  BookOpen, 
  Sparkles, 
  Shield, 
  Swords, 
  Heart,
  Search,
  ChevronRight,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const tools = [
  {
    id: "dice-roller",
    name: "Rolador de Dados",
    description: "Role d4, d6, d8, d10, d12 e d20",
    icon: Dice6,
    color: "from-primary to-primary/70",
    featured: true,
  },
  {
    id: "spells",
    name: "Magias",
    description: "Compêndio completo de magias SRD",
    icon: Sparkles,
    color: "from-secondary to-secondary/70",
    featured: true,
    path: "/grimoire",
  },
  {
    id: "conditions",
    name: "Condições",
    description: "Referência rápida de condições",
    icon: Zap,
    color: "from-neon-blue to-neon-blue/70",
    featured: false,
  },
  {
    id: "weapons",
    name: "Armas",
    description: "Lista de armas e propriedades",
    icon: Swords,
    color: "from-gold to-gold/70",
    featured: false,
  },
  {
    id: "armor",
    name: "Armaduras",
    description: "Tipos de armadura e escudos",
    icon: Shield,
    color: "from-emerald-500 to-emerald-500/70",
    featured: false,
  },
  {
    id: "rules",
    name: "Regras Básicas",
    description: "Mecânicas fundamentais do D&D 5e",
    icon: BookOpen,
    color: "from-orange-500 to-orange-500/70",
    featured: false,
  },
  {
    id: "healing",
    name: "Cura & Descanso",
    description: "Regras de recuperação de HP",
    icon: Heart,
    color: "from-red-500 to-red-500/70",
    featured: false,
  },
];

export function ToolsScreen() {
  const navigate = useNavigate();
  const featuredTools = tools.filter((t) => t.featured);
  const otherTools = tools.filter((t) => !t.featured);

  const handleToolClick = (tool: typeof tools[0]) => {
    if (tool.path) {
      navigate(tool.path);
    }
  };

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Ferramentas</h1>
          <p className="text-xs text-muted-foreground">
            Compêndio e utilitários
          </p>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar magias, condições, regras..."
              className="w-full h-10 pl-9 pr-4 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Featured Tools */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Destaques
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {featuredTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  className={cn(
                    "p-4 rounded-2xl bg-gradient-to-br text-left",
                    tool.color,
                    "hover:scale-[1.02] active:scale-[0.98] transition-transform animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Icon className="w-8 h-8 text-foreground mb-3" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-foreground/70 mt-0.5">
                    {tool.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* All Tools */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Compêndio
          </h2>
          <div className="space-y-2">
            {otherTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  className={cn(
                    "w-full glass rounded-xl p-3 flex items-center gap-3",
                    "hover:border-primary/50 transition-all text-left animate-fade-in"
                  )}
                  style={{ animationDelay: `${(featuredTools.length + index) * 0.05}s` }}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                      tool.color
                    )}
                  >
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
