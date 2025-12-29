import { SupporterItem, tierConfig, rarityConfig } from "@/hooks/useSupporterContent";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupporterBadge } from "./SupporterBadge";
import { Sparkles, Star, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupporterItemCardProps {
  item: SupporterItem;
  onClick?: () => void;
}

export function SupporterItemCard({ item, onClick }: SupporterItemCardProps) {
  const tier = tierConfig[item.creator_tier as keyof typeof tierConfig] || tierConfig.mestre_epico;
  const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig] || rarityConfig.raro;

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden",
        "bg-gradient-to-br from-card/80 to-card border-2",
        tier.borderColor,
        item.is_featured && "ring-2 ring-amber-500/50"
      )}
      onClick={onClick}
    >
      {item.is_featured && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-amber-500/90 text-black gap-1">
            <Star className="w-3 h-3 fill-current" />
            Destaque
          </Badge>
        </div>
      )}

      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      </div>

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
          <Badge className={cn("text-xs shrink-0", rarity.bgColor, rarity.color)}>
            {rarity.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground capitalize">
          {item.item_type.replace("_", " ")}
          {item.requires_attunement && " • Requer Sintonia"}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          {item.damage && (
            <span className="flex items-center gap-1 text-red-400">
              <Zap className="w-3 h-3" />
              {item.damage} {item.damage_type}
            </span>
          )}
          {item.ac_bonus && (
            <span className="flex items-center gap-1 text-blue-400">
              <Shield className="w-3 h-3" />
              +{item.ac_bonus} CA
            </span>
          )}
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <SupporterBadge tier={item.creator_tier} creatorName={item.creator_name} />
      </CardContent>
    </Card>
  );
}
