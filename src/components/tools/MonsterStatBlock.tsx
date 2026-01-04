import { Monster } from "@/data/monsters";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Zap } from "lucide-react";

interface MonsterStatBlockProps {
  monster: Monster;
  compact?: boolean;
}

export function MonsterStatBlock({ monster, compact = false }: MonsterStatBlockProps) {
  const formatArray = (value: string | string[] | null): string => {
    if (!value) return "—";
    if (Array.isArray(value)) return value.join(", ");
    return value;
  };

  const parseHP = (hp: string): { current: number; formula: string } => {
    const match = hp.match(/^(\d+)\s*\((.+)\)/);
    if (match) {
      return { current: parseInt(match[1]), formula: match[2] };
    }
    return { current: parseInt(hp) || 0, formula: "" };
  };

  const hpInfo = parseHP(monster.hitPoints);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-destructive" />
            <span>{hpInfo.current}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-primary" />
            <span>{monster.armorClass}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>{monster.speed}</span>
          </div>
        </div>
      </div>
    );
  }

  const statLabels: Record<string, string> = {
    STR: "FOR",
    DEX: "DES",
    CON: "CON",
    INT: "INT",
    WIS: "SAB",
    CHA: "CAR"
  };

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-6 gap-2 text-center">
        {Object.entries(monster.stats).map(([stat, value]) => (
          <div key={stat} className="bg-muted/50 rounded-lg p-2">
            <div className="text-xs text-muted-foreground font-medium">{statLabels[stat] || stat}</div>
            <div className="text-sm font-bold">{value}</div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Combat Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Classe de Armadura:</span>
          <span className="ml-2 font-medium">{monster.armorClass}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Pontos de Vida:</span>
          <span className="ml-2 font-medium">{monster.hitPoints}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Deslocamento:</span>
          <span className="ml-2 font-medium">{monster.speed}</span>
        </div>
      </div>

      <Separator />

      {/* Saving Throws & Skills */}
      <div className="space-y-2 text-sm">
        {monster.savingThrows && (
          <div>
            <span className="text-muted-foreground">Testes de Resistência:</span>
            <span className="ml-2">{monster.savingThrows}</span>
          </div>
        )}
        {monster.skills && (
          <div>
            <span className="text-muted-foreground">Perícias:</span>
            <span className="ml-2">{monster.skills}</span>
          </div>
        )}
      </div>

      {/* Damage & Condition Info */}
      <div className="space-y-2 text-sm">
        {monster.damageVulnerabilities && (
          <div>
            <span className="text-destructive font-medium">Vulnerabilidades:</span>
            <span className="ml-2">{formatArray(monster.damageVulnerabilities)}</span>
          </div>
        )}
        {monster.damageResistances && (
          <div>
            <span className="text-amber-500 font-medium">Resistências:</span>
            <span className="ml-2">{formatArray(monster.damageResistances)}</span>
          </div>
        )}
        {monster.damageImmunities && (
          <div>
            <span className="text-primary font-medium">Imunidades a Dano:</span>
            <span className="ml-2">{formatArray(monster.damageImmunities)}</span>
          </div>
        )}
        {monster.conditionImmunities && (
          <div>
            <span className="text-primary font-medium">Imunidades a Condições:</span>
            <span className="ml-2">{formatArray(monster.conditionImmunities)}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Senses & Languages */}
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Sentidos:</span>
          <span className="ml-2">{monster.senses}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Idiomas:</span>
          <span className="ml-2">{monster.languages}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Nível de Desafio:</span>
          <Badge variant="secondary" className="ml-2">{monster.challenge}</Badge>
        </div>
      </div>
    </div>
  );
}
