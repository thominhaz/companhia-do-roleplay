import { Faction, FactionRelationship } from "@/hooks/useFactions";
import { Shield, Handshake, Swords, Minus, ArrowRight, Heart, AlertTriangle, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FactionRelationshipListProps {
  factions: Faction[];
  relationships: FactionRelationship[];
  onFactionClick?: (faction: Faction) => void;
}

const RELATIONSHIP_CONFIG: Record<string, { 
  color: string; 
  bgColor: string; 
  label: string; 
  icon: React.ComponentType<{ className?: string }>;
}> = {
  allied: { 
    color: "text-green-500", 
    bgColor: "bg-green-500/10 border-green-500/30", 
    label: "Aliadas", 
    icon: Handshake 
  },
  friendly: { 
    color: "text-emerald-400", 
    bgColor: "bg-emerald-500/10 border-emerald-500/30", 
    label: "Amigáveis", 
    icon: Heart 
  },
  neutral: { 
    color: "text-muted-foreground", 
    bgColor: "bg-muted/50 border-border", 
    label: "Neutras", 
    icon: Minus 
  },
  unfriendly: { 
    color: "text-orange-400", 
    bgColor: "bg-orange-500/10 border-orange-500/30", 
    label: "Hostis", 
    icon: AlertTriangle 
  },
  enemy: { 
    color: "text-red-500", 
    bgColor: "bg-red-500/10 border-red-500/30", 
    label: "Inimigas", 
    icon: Swords 
  },
};

export function FactionRelationshipList({ factions, relationships, onFactionClick }: FactionRelationshipListProps) {
  const visibleFactions = factions.filter(f => !f.is_hidden);

  // Group relationships by type
  const groupedRelationships = relationships.reduce((acc, rel) => {
    const f1 = visibleFactions.find(f => f.id === rel.faction_id);
    const f2 = visibleFactions.find(f => f.id === rel.related_faction_id);
    if (!f1 || !f2) return acc;
    
    if (!acc[rel.relationship_type]) {
      acc[rel.relationship_type] = [];
    }
    acc[rel.relationship_type].push({ ...rel, faction1: f1, faction2: f2 });
    return acc;
  }, {} as Record<string, (FactionRelationship & { faction1: Faction; faction2: Faction })[]>);

  if (visibleFactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma facção visível</p>
      </div>
    );
  }

  if (relationships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Handshake className="w-12 h-12 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum relacionamento definido</p>
        <p className="text-xs text-muted-foreground mt-1">
          Clique em uma facção e adicione relacionamentos na aba "Relações"
        </p>
      </div>
    );
  }

  const relationshipOrder = ["allied", "friendly", "neutral", "unfriendly", "enemy"];

  return (
    <div className="space-y-4">
      {relationshipOrder.map(type => {
        const rels = groupedRelationships[type];
        if (!rels || rels.length === 0) return null;
        
        const config = RELATIONSHIP_CONFIG[type] || RELATIONSHIP_CONFIG.neutral;
        const Icon = config.icon;
        
        return (
          <div key={type} className={`rounded-xl border p-3 ${config.bgColor}`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-4 h-4 ${config.color}`} />
              <span className={`font-medium text-sm ${config.color}`}>
                {config.label}
              </span>
              <Badge variant="secondary" className="text-xs ml-auto">
                {rels.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {rels.map(rel => (
                <div 
                  key={rel.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <button
                    onClick={() => onFactionClick?.(rel.faction1)}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors min-w-0 flex-1"
                  >
                    <Shield className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                    <span className="text-sm truncate font-medium">{rel.faction1.name}</span>
                  </button>
                  
                  <ArrowRight className={`w-4 h-4 flex-shrink-0 ${config.color}`} />
                  
                  <button
                    onClick={() => onFactionClick?.(rel.faction2)}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors min-w-0 flex-1 justify-end"
                  >
                    <span className="text-sm truncate font-medium">{rel.faction2.name}</span>
                    <Shield className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Legenda */}
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Clique em uma facção para ver detalhes
        </p>
      </div>
    </div>
  );
}
