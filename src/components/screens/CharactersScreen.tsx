import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  Lock,
  Loader2
} from "lucide-react";
import { useCharacters } from "@/hooks/useCharacters";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { CharacterWizard } from "@/components/character/CharacterWizard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type FilterTab = "all" | "active" | "archived";

const classIcons: Record<string, typeof Shield> = {
  'Guerreiro': Shield,
  'Mago': Wand2,
  'Ladino': Target,
  'Feiticeiro': Flame,
  'Bardo': Sparkles,
  'Clérigo': Shield,
  'Druida': Sparkles,
  'Monge': Target,
  'Paladino': Shield,
  'Patrulheiro': Target,
  'Bruxo': Flame,
  'Bárbaro': Shield,
};

const classGradients: Record<string, string> = {
  'Guerreiro': 'from-purple-900 to-purple-700',
  'Mago': 'from-blue-900 to-blue-700',
  'Ladino': 'from-gray-800 to-gray-600',
  'Feiticeiro': 'from-red-900 to-red-700',
  'Bardo': 'from-pink-900 to-pink-700',
  'Clérigo': 'from-yellow-900 to-yellow-700',
  'Druida': 'from-green-900 to-green-700',
  'Monge': 'from-amber-900 to-amber-700',
  'Paladino': 'from-cyan-900 to-cyan-700',
  'Patrulheiro': 'from-emerald-900 to-emerald-700',
  'Bruxo': 'from-violet-900 to-violet-700',
  'Bárbaro': 'from-orange-900 to-orange-700',
};

export function CharactersScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [showWizard, setShowWizard] = useState(false);
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: characters, isLoading } = useCharacters();

  // Open wizard if ?create=true in URL
  useEffect(() => {
    if (searchParams.get('create') === 'true' && user && subscription?.canCreateCharacter) {
      setShowWizard(true);
      setSearchParams({});
    }
  }, [searchParams, user, subscription?.canCreateCharacter, setSearchParams]);

  const canCreateCharacter = subscription?.canCreateCharacter ?? false;

  const handleCreateCharacter = () => {
    if (!user) return;
    if (!canCreateCharacter) return;
    setShowWizard(true);
  };

  const tabs = [
    { id: "all" as FilterTab, label: `Todos (${characters?.length || 0})` },
    { id: "active" as FilterTab, label: `Ativos (${characters?.length || 0})` },
    { id: "archived" as FilterTab, label: `Arquivados (0)` },
  ];

  if (showWizard) {
    return <CharacterWizard onClose={() => setShowWizard(false)} />;
  }

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 bg-gradient-to-b from-dark to-darker sticky top-0 z-50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Personagens</h1>
            {user && subscription && (
              <p className="text-xs text-muted-foreground mt-1">
                {subscription.characterCount}/{subscription.limits.maxCharacters === 'unlimited' ? '∞' : subscription.limits.maxCharacters} personagens
              </p>
            )}
          </div>
          <button 
            onClick={handleCreateCharacter}
            disabled={!user || !canCreateCharacter}
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
                  ? "bg-primary text-foreground"
                  : "bg-dark text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="px-5 mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Faça login para ver seus personagens</p>
          </div>
        ) : characters?.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum personagem</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Crie seu primeiro personagem para começar sua aventura!
            </p>
            {canCreateCharacter && (
              <button
                onClick={handleCreateCharacter}
                className="px-6 py-3 bg-gradient-primary rounded-xl font-medium"
              >
                Criar Personagem
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {characters?.map((character) => {
              const Icon = classIcons[character.class] || Shield;
              const gradient = classGradients[character.class] || 'from-purple-900 to-purple-700';
              const hpPercent = (character.current_hp / character.max_hp) * 100;

              return (
                <div
                  key={character.id}
                  className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-foreground opacity-5 rounded-full -mr-16 -mt-16" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-foreground/20 flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{character.name}</h3>
                          <p className="text-sm opacity-80">
                            {character.race} {character.class}
                          </p>
                        </div>
                      </div>
                      <button className="w-8 h-8 rounded-lg bg-background/20 flex items-center justify-center">
                        <MoreVertical className="w-4 h-4 opacity-80" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-background/20 rounded-lg p-2.5">
                        <p className="text-xs opacity-80 mb-0.5">Nível</p>
                        <p className="text-xl font-bold">{character.level}</p>
                      </div>
                      <div className="bg-background/20 rounded-lg p-2.5">
                        <p className="text-xs opacity-80 mb-0.5">HP</p>
                        <p className="text-xl font-bold">{character.current_hp}/{character.max_hp}</p>
                      </div>
                      <div className="bg-background/20 rounded-lg p-2.5">
                        <p className="text-xs opacity-80 mb-0.5">CA</p>
                        <p className="text-xl font-bold">{character.armor_class}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-foreground/20">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 opacity-80" />
                        <span className="text-xs opacity-80">
                          Atualizado {formatDistanceToNow(new Date(character.updated_at), { locale: ptBR, addSuffix: true })}
                        </span>
                      </div>
                      <button className="px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-semibold">
                        Jogar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
