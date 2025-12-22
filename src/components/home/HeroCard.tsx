import { Heart, Shield, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroCardProps {
  character?: {
    name: string;
    class: string;
    level: number;
    race: string;
    currentHp: number;
    maxHp: number;
    armorClass: number;
    imageUrl?: string;
  };
  nextSession?: {
    campaignName: string;
    date: string;
    time: string;
  };
}

export function HeroCard({ character, nextSession }: HeroCardProps) {
  const hpPercentage = character
    ? (character.currentHp / character.maxHp) * 100
    : 0;

  const getHpColor = () => {
    if (hpPercentage > 50) return "bg-green-500";
    if (hpPercentage > 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!character) {
    return (
      <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="glass rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-primary/20 to-transparent" />
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum personagem ativo
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie seu primeiro herói para começar a aventura!
            </p>
            <button className="px-6 py-2.5 bg-gradient-accent rounded-full text-sm font-semibold text-foreground shadow-solar hover:scale-105 transition-transform">
              Criar Personagem
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <div className="glass rounded-3xl p-5 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-radial from-primary/30 to-transparent -translate-y-10 translate-x-10" />
        
        <div className="flex gap-4 relative">
          {/* Character Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 p-0.5">
              <div className="w-full h-full rounded-2xl bg-dark overflow-hidden">
                {character.imageUrl ? (
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-2xl font-bold text-primary">
                      {character.name[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-xs font-bold px-2 py-0.5 rounded-full">
              Nv.{character.level}
            </div>
          </div>

          {/* Character Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground truncate">
              {character.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {character.race} • {character.class}
            </p>

            {/* Stats Row */}
            <div className="flex gap-4">
              {/* HP */}
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      {character.currentHp}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      /{character.maxHp}
                    </span>
                  </div>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
                    <div
                      className={cn("h-full rounded-full transition-all", getHpColor())}
                      style={{ width: `${hpPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* AC */}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-blue" />
                <span className="text-sm font-semibold text-foreground">
                  {character.armorClass}
                </span>
              </div>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground self-center" />
        </div>

        {/* Next Session Banner */}
        {nextSession && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Próxima Sessão
                </p>
                <p className="text-sm font-medium text-foreground">
                  {nextSession.campaignName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">
                  {nextSession.date}
                </p>
                <p className="text-xs text-muted-foreground">{nextSession.time}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
