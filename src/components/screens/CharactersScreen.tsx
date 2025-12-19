import { Plus, Search, Filter, Cloud, Smartphone, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const mockCharacters = [
  {
    id: "1",
    name: "Thorin Escudo-de-Ferro",
    class: "Guerreiro",
    race: "Anão",
    level: 5,
    currentHp: 38,
    maxHp: 45,
    isLocal: false,
  },
  {
    id: "2",
    name: "Elara Ventoalto",
    class: "Maga",
    race: "Elfa",
    level: 3,
    currentHp: 15,
    maxHp: 18,
    isLocal: true,
  },
  {
    id: "3",
    name: "Kael Sombra Silenciosa",
    class: "Ladino",
    race: "Meio-Elfo",
    level: 4,
    currentHp: 28,
    maxHp: 28,
    isLocal: false,
  },
  {
    id: "4",
    name: "Lyra Coração-Dourado",
    class: "Clériga",
    race: "Humana",
    level: 4,
    currentHp: 30,
    maxHp: 32,
    isLocal: true,
  },
];

export function CharactersScreen() {
  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Personagens</h1>
          <p className="text-xs text-muted-foreground">
            {mockCharacters.length} personagens
          </p>
        </div>

        {/* Search & Filter */}
        <div className="px-4 pb-3 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar personagem..."
              className="w-full h-10 pl-9 pr-4 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button className="h-10 px-3 bg-muted rounded-xl flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Character List */}
      <main className="px-4 py-4 max-w-lg mx-auto">
        <div className="space-y-3">
          {mockCharacters.map((character, index) => {
            const hpPercentage = (character.currentHp / character.maxHp) * 100;
            const getHpColor = () => {
              if (hpPercentage > 50) return "bg-green-500";
              if (hpPercentage > 25) return "bg-yellow-500";
              return "bg-red-500";
            };

            return (
              <button
                key={character.id}
                className={cn(
                  "w-full glass rounded-2xl p-4 flex gap-4 items-center",
                  "hover:border-primary/50 transition-all text-left animate-fade-in"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-foreground">
                    {character.name[0]}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {character.name}
                    </h3>
                    {character.isLocal ? (
                      <Smartphone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Cloud className="w-3 h-3 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {character.race} • {character.class} • Nv.{character.level}
                  </p>

                  {/* HP Bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", getHpColor())}
                        style={{ width: `${hpPercentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {character.currentHp}/{character.maxHp}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </main>

      {/* FAB - Create New */}
      <button className="fixed right-4 bottom-24 w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center shadow-neon hover:scale-110 active:scale-95 transition-transform z-50">
        <Plus className="w-6 h-6 text-foreground" />
      </button>
    </div>
  );
}
