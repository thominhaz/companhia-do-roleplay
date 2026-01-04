import { Monster, extractMonsterType, extractMonsterSize, parseChallengeRating } from "@/data/monsters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Skull, Star } from "lucide-react";

interface MonsterCardProps {
  monster: Monster;
  onClick: () => void;
}

export function MonsterCard({ monster, onClick }: MonsterCardProps) {
  const type = extractMonsterType(monster.meta);
  const size = extractMonsterSize(monster.meta);
  const cr = parseChallengeRating(monster.challenge);
  
  const parseHP = (hp: string): number => {
    const match = hp.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const parseAC = (ac: string): number => {
    const match = ac.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getCRColor = (cr: number): string => {
    if (cr <= 1) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (cr <= 4) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (cr <= 10) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (cr <= 17) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const hasLegendary = monster.legendaryActions !== null;

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors border-border/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{monster.name}</h3>
              {hasLegendary && (
                <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {size} • {type}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`flex-shrink-0 ${getCRColor(cr)}`}
          >
            ND {monster.challenge.split(' ')[0]}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-destructive" />
            <span>{parseHP(monster.hitPoints)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span>{parseAC(monster.armorClass)}</span>
          </div>
          {monster.actions && (
            <div className="flex items-center gap-1">
              <Skull className="h-3.5 w-3.5" />
              <span>{monster.actions.length} ações</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
