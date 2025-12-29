import { SupporterNPC, tierConfig } from "@/hooks/useSupporterContent";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupporterBadge } from "./SupporterBadge";
import { User, MapPin, Briefcase, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupporterNPCCardProps {
  npc: SupporterNPC;
  onClick?: () => void;
}

export function SupporterNPCCard({ npc, onClick }: SupporterNPCCardProps) {
  const tier = tierConfig[npc.creator_tier as keyof typeof tierConfig] || tierConfig.lendario;

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden",
        "bg-gradient-to-br from-card/80 to-card border-2",
        tier.borderColor,
        npc.is_featured && "ring-2 ring-amber-500/50"
      )}
      onClick={onClick}
    >
      {npc.is_featured && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-amber-500/90 text-black gap-1">
            <Star className="w-3 h-3 fill-current" />
            Destaque
          </Badge>
        </div>
      )}

      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
        {npc.image_url ? (
          <img
            src={npc.image_url}
            alt={npc.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      </div>

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-lg leading-tight">{npc.name}</h3>
            {npc.title && (
              <p className="text-sm text-muted-foreground italic">{npc.title}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {npc.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {npc.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {npc.occupation && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {npc.occupation}
            </span>
          )}
          {npc.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {npc.location}
            </span>
          )}
        </div>

        {npc.tags && npc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {npc.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <SupporterBadge tier={npc.creator_tier} creatorName={npc.creator_name} />
      </CardContent>
    </Card>
  );
}
