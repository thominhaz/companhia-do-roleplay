import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SupporterBadge } from "./SupporterBadge";
import { SupporterNPC, tierConfig } from "@/hooks/useSupporterContent";
import { User, MapPin, Briefcase, Quote, Star, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomebrew } from "@/hooks/useHomebrew";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { HomebrewMonsterData } from "@/types";

interface SupporterNPCDetailSheetProps {
  npc: SupporterNPC | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupporterNPCDetailSheet({ npc, open, onOpenChange }: SupporterNPCDetailSheetProps) {
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { createHomebrew, isCreating, canCreate } = useHomebrew();

  const canUseForge = subscription?.canUseForge ?? false;

  if (!npc) return null;

  const tier = tierConfig[npc.creator_tier as keyof typeof tierConfig] || tierConfig.lendario;

  const handleCopyToHomebrew = () => {
    if (!user) {
      toast.error("Você precisa estar logado para copiar NPCs");
      return;
    }

    if (!canUseForge || !canCreate) {
      toast.error("Você precisa ser premium para criar conteúdo homebrew");
      return;
    }

    // NPCs from supporter gallery don't have stats, so we create a basic monster template
    const homebrewData: HomebrewMonsterData = {
      size: 'Medium',
      type: 'humanoid',
      alignment: 'neutral',
      armor_class: 10,
      hit_points: '1d8',
      hp: 5,
      ac: 10,
      speed: '30 ft.',
      attributes: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      challenge_rating: '0',
      cr: '0',
      xp: 0,
      traits: npc.personality ? [{ name: 'Personalidade', description: npc.personality }] : [],
      actions: [],
    };

    const description = [
      npc.description,
      npc.appearance && `**Aparência:** ${npc.appearance}`,
      npc.backstory && `**História:** ${npc.backstory}`,
      npc.occupation && `**Ocupação:** ${npc.occupation}`,
      npc.location && `**Localização:** ${npc.location}`,
      '',
      `---`,
      `*Copiado da Galeria de Apoiadores - Criado por ${npc.creator_name}*`,
    ].filter(Boolean).join('\n\n');

    createHomebrew({
      type: 'monster',
      name: npc.title ? `${npc.name}, ${npc.title}` : npc.name,
      description,
      icon: '👤',
      data: homebrewData,
      is_public: false,
    }, {
      onSuccess: () => {
        toast.success(`"${npc.name}" copiado para sua Forja!`);
        onOpenChange(false);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <div className={cn("relative h-48 bg-gradient-to-br", tier.color)}>
          {npc.image_url ? (
            <img
              src={npc.image_url}
              alt={npc.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-24 h-24 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {npc.is_featured && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-amber-500/90 text-black gap-1">
                <Star className="w-3 h-3 fill-current" />
                Destaque da Comunidade
              </Badge>
            </div>
          )}
        </div>

        <SheetHeader className="px-6 -mt-8 relative z-10">
          <SheetTitle className="text-2xl">{npc.name}</SheetTitle>
          {npc.title && (
            <p className="text-muted-foreground italic">{npc.title}</p>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-16rem)] px-6 pb-6">
          <div className="space-y-6 py-4">
            <SupporterBadge 
              tier={npc.creator_tier} 
              creatorName={npc.creator_name} 
              className="w-fit"
            />

            {npc.creator_message && (
              <div className={cn("p-4 rounded-lg border", tier.borderColor, tier.bgColor)}>
                <div className="flex items-start gap-2">
                  <Quote className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" />
                  <p className="text-sm italic text-muted-foreground">
                    "{npc.creator_message}"
                  </p>
                </div>
                <p className="text-xs text-right mt-2 text-muted-foreground">
                  — {npc.creator_name}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm">
              {npc.occupation && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  {npc.occupation}
                </span>
              )}
              {npc.location && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {npc.location}
                </span>
              )}
            </div>

            {npc.tags && npc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {npc.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {npc.description && (
              <div>
                <h4 className="font-semibold mb-2">Descrição</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {npc.description}
                </p>
              </div>
            )}

            {npc.appearance && (
              <div>
                <h4 className="font-semibold mb-2">Aparência</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {npc.appearance}
                </p>
              </div>
            )}

            {npc.personality && (
              <div>
                <h4 className="font-semibold mb-2">Personalidade</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {npc.personality}
                </p>
              </div>
            )}

            {npc.backstory && (
              <div>
                <h4 className="font-semibold mb-2">História</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {npc.backstory}
                </p>
              </div>
            )}

            {user && canUseForge && (
              <div className="pt-4">
                <Button
                  onClick={handleCopyToHomebrew}
                  disabled={isCreating || !canCreate}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Copy className="w-4 h-4" />
                  {isCreating ? "Copiando..." : "Copiar para minha Forja"}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
