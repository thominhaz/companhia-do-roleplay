import { useState } from "react";
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  Shield, 
  Heart,
  Wand2,
  Target,
  Flame,
  Sparkles,
  Lock
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type FilterTab = "all" | "active" | "archived";

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  isActive: boolean;
  lastActivity: string;
  gradient: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: typeof Shield;
}

const mockCharacters: Character[] = [
  {
    id: "1",
    name: "Thorin Escudo de Ferro",
    race: "Anão",
    class: "Guerreiro",
    level: 7,
    currentHp: 68,
    maxHp: 85,
    armorClass: 18,
    isActive: true,
    lastActivity: "Última sessão: há 2 dias",
    gradient: "from-purple-900 to-purple-700",
    bgColor: "bg-purple-500",
    textColor: "text-purple-200",
    borderColor: "border-purple-600",
    icon: Shield,
  },
  {
    id: "2",
    name: "Elara Luz da Lua",
    race: "Elfa",
    class: "Maga",
    level: 5,
    currentHp: 42,
    maxHp: 42,
    armorClass: 14,
    isActive: true,
    lastActivity: "Última sessão: há 5 dias",
    gradient: "from-blue-900 to-blue-700",
    bgColor: "bg-blue-500",
    textColor: "text-blue-200",
    borderColor: "border-blue-600",
    icon: Wand2,
  },
  {
    id: "3",
    name: "Kael Sombra Noturna",
    race: "Humano",
    class: "Paladino",
    level: 3,
    currentHp: 45,
    maxHp: 45,
    armorClass: 16,
    isActive: false,
    lastActivity: "Arquivado há 2 meses",
    gradient: "from-green-600 to-green-800",
    bgColor: "bg-green-600",
    textColor: "text-gray-400",
    borderColor: "border-gray-800",
    icon: Target,
  },
  {
    id: "4",
    name: "Zara Chama Ardente",
    race: "Tiefling",
    class: "Feiticeira",
    level: 8,
    currentHp: 58,
    maxHp: 58,
    armorClass: 13,
    isActive: false,
    lastActivity: "Arquivado há 4 meses",
    gradient: "from-red-600 to-red-800",
    bgColor: "bg-red-600",
    textColor: "text-gray-400",
    borderColor: "border-gray-800",
    icon: Flame,
  },
  {
    id: "5",
    name: "Finn Pés Ligeiros",
    race: "Halfling",
    class: "Ladino",
    level: 4,
    currentHp: 32,
    maxHp: 32,
    armorClass: 15,
    isActive: false,
    lastActivity: "Arquivado há 6 meses",
    gradient: "from-amber-600 to-amber-800",
    bgColor: "bg-amber-600",
    textColor: "text-gray-400",
    borderColor: "border-gray-800",
    icon: Sparkles,
  },
];

export function CharactersScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const canCreateCharacter = subscription?.canCreateCharacter ?? false;

  const handleCreateCharacter = () => {
    if (!user) {
      toast.error("Faça login para criar personagens");
      return;
    }
    if (!canCreateCharacter) {
      toast.error("Limite de personagens atingido. Faça upgrade para Premium!");
      return;
    }
    console.log("Create character");
  };

  const activeCharacters = mockCharacters.filter((c) => c.isActive);
  const archivedCharacters = mockCharacters.filter((c) => !c.isActive);

  const tabs = [
    { id: "all" as FilterTab, label: `Todos (${mockCharacters.length})` },
    { id: "active" as FilterTab, label: `Ativos (${activeCharacters.length})` },
    { id: "archived" as FilterTab, label: `Arquivados (${archivedCharacters.length})` },
  ];

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 bg-gradient-to-b from-dark to-darker sticky top-0 z-50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Personagens</h1>
            {user && subscription && !subscription.limits.maxCharacters && (
              <p className="text-xs text-muted-foreground mt-1">
                {subscription.characterCount}/{subscription.limits.maxCharacters === 'unlimited' ? '∞' : subscription.limits.maxCharacters} personagens
              </p>
            )}
          </div>
          <button 
            onClick={handleCreateCharacter}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${
              canCreateCharacter 
                ? "bg-gradient-to-br from-primary to-purple-700" 
                : "bg-muted"
            }`}
          >
            {canCreateCharacter ? <Plus className="w-5 h-5" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "bg-dark text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Active Characters Section */}
      {(activeTab === "all" || activeTab === "active") && activeCharacters.length > 0 && (
        <section className="px-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400">PERSONAGENS ATIVOS</h2>
            <span className="text-xs text-gray-500">{activeCharacters.length} personagens</span>
          </div>

          {activeCharacters.map((character) => (
            <div
              key={character.id}
              className={`bg-gradient-to-br ${character.gradient} rounded-2xl p-5 mb-4 relative overflow-hidden`}
            >
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-12 -mb-12" />
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-xl ${character.bgColor} flex items-center justify-center`}>
                      <character.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{character.name}</h3>
                      <p className={`text-sm ${character.textColor}`}>
                        {character.race} {character.class}
                      </p>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-lg bg-black bg-opacity-20 flex items-center justify-center">
                    <MoreVertical className={`w-4 h-4 ${character.textColor}`} />
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-black bg-opacity-20 rounded-lg p-2.5">
                    <p className={`text-xs ${character.textColor} mb-0.5`}>Nível</p>
                    <p className="text-xl font-bold">{character.level}</p>
                  </div>
                  <div className="bg-black bg-opacity-20 rounded-lg p-2.5">
                    <p className={`text-xs ${character.textColor} mb-0.5`}>HP</p>
                    <p className="text-xl font-bold">{character.currentHp}/{character.maxHp}</p>
                  </div>
                  <div className="bg-black bg-opacity-20 rounded-lg p-2.5">
                    <p className={`text-xs ${character.textColor} mb-0.5`}>CA</p>
                    <p className="text-xl font-bold">{character.armorClass}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-between pt-3 border-t ${character.borderColor} border-opacity-40`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${character.textColor}`} />
                    <span className={`text-xs ${character.textColor}`}>{character.lastActivity}</span>
                  </div>
                  <button className="px-3 py-1.5 bg-white text-purple-900 rounded-lg text-xs font-semibold">
                    Jogar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Archived Characters Section */}
      {(activeTab === "all" || activeTab === "archived") && archivedCharacters.length > 0 && (
        <section className="px-5 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400">ARQUIVADOS</h2>
            <span className="text-xs text-gray-500">{archivedCharacters.length} personagens</span>
          </div>

          {archivedCharacters.map((character) => (
            <div
              key={character.id}
              className="bg-dark rounded-xl p-4 mb-3 border border-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${character.gradient} flex items-center justify-center`}>
                  <character.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-0.5">{character.name}</h3>
                  <p className="text-xs text-gray-400">
                    {character.race} {character.class} • Nv {character.level}
                  </p>
                </div>
                <button className="w-8 h-8 rounded-lg bg-darker flex items-center justify-center">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{character.currentHp}/{character.maxHp}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">CA {character.armorClass}</span>
                </div>
                <div className="flex-1" />
                <span className="text-xs text-gray-500">{character.lastActivity}</span>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
