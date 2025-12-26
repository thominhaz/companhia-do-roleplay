import { useMemo } from "react";
import { Faction, FactionRelationship } from "@/hooks/useFactions";
import { Shield, Handshake, Swords, Minus } from "lucide-react";

interface FactionRelationshipMapProps {
  factions: Faction[];
  relationships: FactionRelationship[];
  onFactionClick?: (faction: Faction) => void;
}

const RELATIONSHIP_COLORS: Record<string, { line: string; bg: string }> = {
  allied: { line: "#22c55e", bg: "rgba(34, 197, 94, 0.2)" },
  friendly: { line: "#10b981", bg: "rgba(16, 185, 129, 0.2)" },
  neutral: { line: "#6b7280", bg: "rgba(107, 114, 128, 0.2)" },
  unfriendly: { line: "#f97316", bg: "rgba(249, 115, 22, 0.2)" },
  enemy: { line: "#ef4444", bg: "rgba(239, 68, 68, 0.2)" },
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  allied: "Aliada",
  friendly: "Amigável",
  neutral: "Neutra",
  unfriendly: "Hostil",
  enemy: "Inimiga",
};

export function FactionRelationshipMap({ factions, relationships, onFactionClick }: FactionRelationshipMapProps) {
  const visibleFactions = factions.filter(f => !f.is_hidden);

  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const count = visibleFactions.length;
    const centerX = 200;
    const centerY = 180;
    const radius = Math.min(140, 50 + count * 15);

    visibleFactions.forEach((faction, index) => {
      const angle = (2 * Math.PI * index) / count - Math.PI / 2;
      positions[faction.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    return positions;
  }, [visibleFactions]);

  const lines = useMemo(() => {
    return relationships
      .filter(rel => {
        const f1 = visibleFactions.find(f => f.id === rel.faction_id);
        const f2 = visibleFactions.find(f => f.id === rel.related_faction_id);
        return f1 && f2;
      })
      .map(rel => {
        const pos1 = nodePositions[rel.faction_id];
        const pos2 = nodePositions[rel.related_faction_id];
        const colors = RELATIONSHIP_COLORS[rel.relationship_type] || RELATIONSHIP_COLORS.neutral;

        return {
          id: rel.id,
          x1: pos1?.x || 0,
          y1: pos1?.y || 0,
          x2: pos2?.x || 0,
          y2: pos2?.y || 0,
          type: rel.relationship_type,
          color: colors.line,
        };
      });
  }, [relationships, visibleFactions, nodePositions]);

  if (visibleFactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma facção visível</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <svg viewBox="0 0 400 360" className="w-full h-auto">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines */}
        {lines.map(line => (
          <g key={line.id}>
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.color}
              strokeWidth="2"
              strokeOpacity="0.6"
              filter="url(#glow)"
            />
            {/* Relationship icon in the middle */}
            <g transform={`translate(${(line.x1 + line.x2) / 2}, ${(line.y1 + line.y2) / 2})`}>
              <circle r="10" fill="hsl(var(--background))" stroke={line.color} strokeWidth="1.5" />
              {line.type === "allied" || line.type === "friendly" ? (
                <Handshake x="-6" y="-6" width="12" height="12" color={line.color} />
              ) : line.type === "enemy" || line.type === "unfriendly" ? (
                <Swords x="-6" y="-6" width="12" height="12" color={line.color} />
              ) : (
                <Minus x="-6" y="-6" width="12" height="12" color={line.color} />
              )}
            </g>
          </g>
        ))}

        {/* Faction nodes */}
        {visibleFactions.map(faction => {
          const pos = nodePositions[faction.id];
          if (!pos) return null;

          return (
            <g
              key={faction.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              className="cursor-pointer"
              onClick={() => onFactionClick?.(faction)}
            >
              <circle
                r="28"
                fill="hsl(var(--card))"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                className="transition-all hover:stroke-[3]"
              />
              <Shield x="-10" y="-18" width="20" height="20" className="text-primary" />
              <text
                y="8"
                textAnchor="middle"
                fill="hsl(var(--foreground))"
                fontSize="9"
                fontWeight="500"
                className="select-none"
              >
                {faction.name.length > 10 ? faction.name.slice(0, 9) + "…" : faction.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs">
        {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: RELATIONSHIP_COLORS[key].line }}
            />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
