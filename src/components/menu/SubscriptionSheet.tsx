import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Sparkles, Users, Wand2, Shield, Gift, Loader2, Sword, ScrollText, Palette, History, MessageSquare, Swords, Share2, Eye, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getFunctionsErrorMessage } from "@/lib/functionsError";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIER_CONFIG: Record<SubscriptionTier, {
  name: string;
  icon: typeof Crown;
  description: string;
  features: { icon: typeof Crown; text: string }[];
  gradient: string;
  borderColor: string;
  iconColor: string;
}> = {
  visitante: {
    name: "Visitante",
    icon: Eye,
    description: "Acesso de demonstração. Explore as ferramentas.",
    features: [
      { icon: Sword, text: "Compêndio SRD 5.1" },
      { icon: ScrollText, text: "Condições e regras básicas" },
      { icon: Swords, text: "Rolador de dados" },
    ],
    gradient: "from-muted/50 to-transparent",
    borderColor: "border-border",
    iconColor: "text-muted-foreground",
  },
  aldeao: {
    name: "Aldeão",
    icon: Shield,
    description: "Onde tudo começa. Ideal para jogadores casuais.",
    features: [
      { icon: ScrollText, text: "Até 3 personagens" },
      { icon: Sword, text: "Compêndio SRD 5.1 completo" },
      { icon: Users, text: "Entrar em campanhas" },
      { icon: Wand2, text: "Notas rápidas e Forja" },
    ],
    gradient: "from-primary/10 to-transparent",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
  },
  heroi: {
    name: "Herói",
    icon: Sword,
    description: "Para aventureiros dedicados. Personalização e segurança.",
    features: [
      { icon: ScrollText, text: "Até 20 personagens" },
      { icon: Palette, text: "Temas exclusivos" },
      { icon: Wand2, text: "Homebrew completo" },
      { icon: History, text: "Histórico de alterações" },
    ],
    gradient: "from-secondary/20 to-transparent",
    borderColor: "border-secondary",
    iconColor: "text-secondary",
  },
  mestre: {
    name: "Mestre",
    icon: Crown,
    description: "O poder total da mesa. Ferramentas de Mestre.",
    features: [
      { icon: Sparkles, text: "Personagens ilimitados" },
      { icon: Users, text: "Campanhas como Mestre" },
      { icon: Swords, text: "Combat Tracker Pro" },
      { icon: Share2, text: "Integração Discord" },
    ],
    gradient: "from-gold/20 to-amber-500/5",
    borderColor: "border-gold",
    iconColor: "text-gold",
  },
};

const TIER_ORDER: SubscriptionTier[] = ['visitante', 'aldeao', 'heroi', 'mestre'];

export function SubscriptionSheet({ open, onOpenChange }: SubscriptionSheetProps) {
  const { user } = useAuth();
  const { data: subscription, refetch: refetchSubscription } = useSubscription();
  const queryClient = useQueryClient();
  const currentTier = subscription?.tier ?? "visitante";
  
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      toast.error("Digite um código");
      return;
    }
    
    if (!user) {
      toast.error("Você precisa estar logado para resgatar um código");
      return;
    }

    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_promo_token', {
        _code: redeemCode.trim(),
        _user_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string; days?: number };
      
      if (result.success) {
        toast.success(result.message || "Código resgatado com sucesso!");
        setRedeemCode("");
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        refetchSubscription();
        
        // Auto-sync Discord role if Discord is linked
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('discord_user_id')
            .eq('id', user.id)
            .single();

          if (profile?.discord_user_id) {
            const { data: syncData, error: syncError, response: syncResponse } = await supabase.functions.invoke('sync-discord-role', {
              body: { action: 'sync' },
            });

            if (syncError) {
              toast.error(await getFunctionsErrorMessage(syncError, syncResponse));
            } else if (syncData?.success) {
              toast.success(syncData.message || "Cargo do Discord atualizado!");
            } else {
              toast.error(syncData?.error || syncData?.message || "Erro ao atualizar cargo do Discord");
            }
          }
        } catch (discordError) {
          console.error("Error syncing Discord role:", discordError);
        }
      } else {
        toast.error(result.error || "Erro ao resgatar código");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao resgatar código");
    } finally {
      setIsRedeeming(false);
    }
  };

  const getExpirationText = () => {
    if (!subscription) return null;
    
    if (currentTier === 'visitante') return null;
    
    if (subscription.isLifetime) {
      return "Acesso vitalício";
    }
    
    if (subscription.expiresAt) {
      const expiresDate = new Date(subscription.expiresAt);
      const formattedDate = format(expiresDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      return `Válido até ${formattedDate}`;
    }
    
    return "Acesso vitalício";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" />
            Assinatura
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 overflow-y-auto max-h-[calc(90vh-8rem)] pb-8">
          {/* Current Plan Status with Expiration */}
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${TIER_CONFIG[currentTier].gradient} border ${TIER_CONFIG[currentTier].borderColor}`}>
            <div className="flex items-center gap-3 mb-2">
              {(() => {
                const IconComponent = TIER_CONFIG[currentTier].icon;
                return <IconComponent className={`w-6 h-6 ${TIER_CONFIG[currentTier].iconColor}`} />;
              })()}
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  Plano {TIER_CONFIG[currentTier].name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {TIER_CONFIG[currentTier].description}
                </p>
              </div>
            </div>
            {getExpirationText() && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  {subscription?.isLifetime ? (
                    <Sparkles className="w-4 h-4 text-gold" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  )}
                  {getExpirationText()}
                </p>
              </div>
            )}
          </div>

          {/* Tier Grid 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {TIER_ORDER.map((tier) => {
              const config = TIER_CONFIG[tier];
              const isCurrentTier = tier === currentTier;
              const IconComponent = config.icon;
              
              return (
                <div
                  key={tier}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isCurrentTier 
                      ? `${config.borderColor} bg-gradient-to-br ${config.gradient}` 
                      : 'border-border bg-card opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <IconComponent className={`w-5 h-5 ${isCurrentTier ? config.iconColor : 'text-muted-foreground'}`} />
                    <h5 className="font-semibold text-sm text-foreground">{config.name}</h5>
                    {isCurrentTier && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
                        <Check className="w-3 h-3 mr-0.5" />
                        Atual
                      </Badge>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {config.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <feature.icon className={`w-3 h-3 shrink-0 ${isCurrentTier ? config.iconColor : 'text-muted-foreground/60'}`} />
                        <span className="truncate">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Redeem Code Section with Catarse Info */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-4">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-secondary" />
              <h4 className="font-semibold text-foreground">Resgatar Código de Acesso</h4>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="text-sm text-foreground font-medium">
                Como obter um código?
              </p>
              <p className="text-xs text-muted-foreground">
                O Go20 é mantido pelos apoiadores do Catarse! Ao apoiar o projeto, você recebe um código de acesso beta exclusivo que libera todas as funcionalidades.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-secondary border-secondary/30 hover:bg-secondary/10"
                onClick={() => window.open('https://catarse.me/go20', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Apoiar no Catarse
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Digite seu código"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                className="flex-1 uppercase"
                disabled={isRedeeming}
              />
              <Button
                onClick={handleRedeemCode}
                disabled={isRedeeming || !redeemCode.trim()}
                variant="secondary"
              >
                {isRedeeming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Resgatar"
                )}
              </Button>
            </div>
          </div>

          {/* Info about current access */}
          {currentTier !== 'visitante' && (
            <div className="p-4 rounded-xl bg-muted/50 space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Obrigado por apoiar o Go20! 💜
              </p>
            </div>
          )}

          {/* No Ads Notice */}
          <p className="text-center text-xs text-muted-foreground">
            🎮 Go20 é livre de anúncios em todos os planos
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
