import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CharacterFactionReputationsProps {
  characterId: string;
  campaignId: string;
}

interface FactionReputation {
  id: string;
  faction_id: string;
  reputation_level: number;
  reputation_title: string | null;
  faction: {
    id: string;
    name: string;
    description: string | null;
    show_reputation_to_players: boolean;
  };
}

const REPUTATION_LEVELS = [
  { min: -100, max: -51, title: "Odiado", color: "bg-destructive", textColor: "text-destructive" },
  { min: -50, max: -26, title: "Hostil", color: "bg-destructive/80", textColor: "text-destructive" },
  { min: -25, max: -1, title: "Desconfiado", color: "bg-gold", textColor: "text-gold" },
  { min: 0, max: 0, title: "Neutro", color: "bg-muted", textColor: "text-muted-foreground" },
  { min: 1, max: 25, title: "Amigável", color: "bg-secondary/80", textColor: "text-secondary" },
  { min: 26, max: 50, title: "Respeitado", color: "bg-secondary", textColor: "text-secondary" },
  { min: 51, max: 100, title: "Venerado", color: "bg-primary", textColor: "text-primary" },
];

function getReputationInfo(level: number) {
  return REPUTATION_LEVELS.find(r => level >= r.min && level <= r.max) || REPUTATION_LEVELS[3];
}

export function CharacterFactionReputations({ characterId, campaignId }: CharacterFactionReputationsProps) {
  const { user } = useAuth();

  const { data: reputations = [], isLoading } = useQuery({
    queryKey: ["character-faction-reputations", characterId, campaignId],
    queryFn: async () => {
      // Get reputations with faction info
      const { data, error } = await supabase
        .from("campaign_character_faction_rep")
        .select(`
          id,
          faction_id,
          reputation_level,
          reputation_title,
          faction:campaign_factions(id, name, description, show_reputation_to_players)
        `)
        .eq("character_id", characterId)
        .eq("campaign_id", campaignId);

      if (error) throw error;
      
      // Filter to only show factions where show_reputation_to_players is true
      return (data as unknown as FactionReputation[]).filter(
        rep => rep.faction?.show_reputation_to_players
      );
    },
    enabled: !!characterId && !!campaignId && !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (reputations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        Reputação com Facções
      </h3>

      <ScrollArea className="max-h-48">
        <div className="space-y-2">
          {reputations.map(rep => {
            const info = getReputationInfo(rep.reputation_level);
            const isPositive = rep.reputation_level > 0;
            const isNegative = rep.reputation_level < 0;

            return (
              <div
                key={rep.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center`}>
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5 text-white" />
                    ) : isNegative ? (
                      <TrendingDown className="w-5 h-5 text-white" />
                    ) : (
                      <Minus className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{rep.faction?.name}</p>
                    <p className={`text-xs ${info.textColor}`}>
                      {rep.reputation_title || info.title}
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className={info.textColor}>
                  {rep.reputation_level > 0 ? "+" : ""}{rep.reputation_level}
                </Badge>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
