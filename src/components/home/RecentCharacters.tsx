import { ChevronRight, Plus, Cloud, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface CharacterPreview {
  id: string;
  name: string;
  class: string;
  level: number;
  imageUrl?: string;
  isLocal: boolean;
}

interface RecentCharactersProps {
  characters: CharacterPreview[];
  onCharacterClick?: (id: string) => void;
  onViewAll?: () => void;
  onCreateNew?: () => void;
}

export function RecentCharacters({
  characters,
  onCharacterClick,
  onViewAll,
  onCreateNew,
}: RecentCharactersProps) {
  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Personagens Recentes
        </h2>
        <button
          onClick={onViewAll}
          className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
        >
          Ver Todos
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {/* Create New Card */}
        <button
          onClick={onCreateNew}
          className="flex-shrink-0 w-[100px] h-[130px] rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/10 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-primary">Novo</span>
        </button>

        {/* Character Cards */}
        {characters.map((character, index) => (
          <button
            key={character.id}
            onClick={() => onCharacterClick?.(character.id)}
            className={cn(
              "flex-shrink-0 w-[100px] h-[130px] rounded-2xl overflow-hidden relative group",
              "bg-gradient-card border border-border/50",
              "hover:border-primary/50 hover:shadow-neon transition-all duration-300"
            )}
            style={{ animationDelay: `${0.3 + index * 0.05}s` }}
          >
            {/* Character Image/Avatar */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-darker/90" />
            {character.imageUrl ? (
              <img
                src={character.imageUrl}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-3xl font-bold text-primary/50">
                  {character.name[0]}
                </span>
              </div>
            )}

            {/* Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <p className="text-xs font-semibold text-foreground truncate">
                {character.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {character.class} • Nv.{character.level}
              </p>
            </div>

            {/* Sync Status */}
            <div className="absolute top-2 right-2">
              {character.isLocal ? (
                <Smartphone className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Cloud className="w-3 h-3 text-primary" />
              )}
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}

        {/* Empty State */}
        {characters.length === 0 && (
          <div className="flex-1 min-h-[130px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Nenhum personagem ainda
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
