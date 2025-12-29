import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SupporterBadge } from "./SupporterBadge";
import { SupporterItem, tierConfig, rarityConfig } from "@/hooks/useSupporterContent";
import { Sparkles, Quote, Star, Zap, Shield, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupporterItemDetailSheetProps {
  item: SupporterItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupporterItemDetailSheet({ item, open, onOpenChange }: SupporterItemDetailSheetProps) {
  if (!item) return null;

  const tier = tierConfig[item.creator_tier as keyof typeof tierConfig] || tierConfig.mestre_epico;
  const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig] || rarityConfig.raro;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <div className={cn("relative h-40 bg-gradient-to-br", tier.color)}>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-20 h-20 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {item.is_featured && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-amber-500/90 text-black gap-1">
                <Star className="w-3 h-3 fill-current" />
                Destaque da Comunidade
              </Badge>
            </div>
          )}
        </div>

        <SheetHeader className="px-6 -mt-6 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="text-2xl">{item.name}</SheetTitle>
            <Badge className={cn("shrink-0", rarity.bgColor, rarity.color)}>
              {rarity.label}
            </Badge>
          </div>
          <p className="text-muted-foreground capitalize">
            {item.item_type.replace("_", " ")}
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-14rem)] px-6 pb-6">
          <div className="space-y-6 py-4">
            <SupporterBadge 
              tier={item.creator_tier} 
              creatorName={item.creator_name} 
              className="w-fit"
            />

            {item.creator_message && (
              <div className={cn("p-4 rounded-lg border", tier.borderColor, tier.bgColor)}>
                <div className="flex items-start gap-2">
                  <Quote className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" />
                  <p className="text-sm italic text-muted-foreground">
                    "{item.creator_message}"
                  </p>
                </div>
                <p className="text-xs text-right mt-2 text-muted-foreground">
                  — {item.creator_name}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              {item.damage && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <Zap className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dano</p>
                    <p className="text-sm font-semibold text-red-400">
                      {item.damage} {item.damage_type}
                    </p>
                  </div>
                </div>
              )}
              {item.ac_bonus && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Bônus de CA</p>
                    <p className="text-sm font-semibold text-blue-400">+{item.ac_bonus}</p>
                  </div>
                </div>
              )}
              {item.requires_attunement && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <Link2 className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sintonia</p>
                    <p className="text-sm font-semibold text-purple-400">
                      {item.attunement_requirements || "Requerida"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {item.description && (
              <div>
                <h4 className="font-semibold mb-2">Descrição</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}

            {item.properties && (
              <div>
                <h4 className="font-semibold mb-2">Propriedades</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.properties}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
