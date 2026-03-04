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
    if (cr <= 1) return "bg-secondary/20 text-secondary border-secondary/30";
    if (cr <= 4) return "bg-primary/20 text-primary border-primary/30";
    if (cr <= 10) return "bg-gold/20 text-gold border-gold/30";
    if (cr <= 17) return "bg-accent/20 text-accent-foreground border-accent/30";
    return "bg-destructive/20 text-destructive border-destructive/30";
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
                <Star className="h-4 w-4 text-gold flex-shrink-0" />
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
