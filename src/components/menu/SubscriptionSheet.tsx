import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Sparkles, Users, Wand2, Shield, Gift, Loader2, Sword, ScrollText, Palette, History, MessageSquare, Swords, Share2, Heart, Settings, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubscriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UpgradePreview {
  currentPlan: string;
  newPlan: string;
  prorationAmount: number;
  creditAmount: number;
  chargeAmount: number;
  daysRemaining: number;
}

export function SubscriptionSheet({ open, onOpenChange }: SubscriptionSheetProps) {
  const { user } = useAuth();
  const { data: subscription, refetch: refetchSubscription } = useSubscription();
  const queryClient = useQueryClient();
  const currentTier = subscription?.tier ?? "aldeao";
  const isPaidTier = currentTier === "heroi" || currentTier === "mestre";
  
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [upgradePreview, setUpgradePreview] = useState<UpgradePreview | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [pendingUpgradePlan, setPendingUpgradePlan] = useState<"mestre" | null>(null);

  // Função para verificar assinatura manualmente
  const checkSubscriptionFromStripe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      refetchSubscription();
      
      if (data?.subscribed) {
        toast.success(`Plano ${data.tier === 'mestre' ? 'Mestre' : 'Herói'} ativado!`);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const handleUpgrade = async (plan: "heroi" | "mestre") => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar");
      return;
    }

    const periodMap = {
      monthly: "mensal",
      quarterly: "trimestral",
      annual: "anual"
    };

    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          plan, 
          period: periodMap[billingPeriod] 
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Erro ao iniciar checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Preview upgrade proration before confirming
  const handlePreviewUpgrade = async (newPlan: "mestre") => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    const periodMap = {
      monthly: "mensal",
      quarterly: "trimestral",
      annual: "anual"
    };

    setIsLoadingPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke("preview-upgrade", {
        body: { 
          newPlan, 
          period: periodMap[billingPeriod] 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        setUpgradePreview(data);
        setPendingUpgradePlan(newPlan);
        setShowUpgradeDialog(true);
      } else {
        throw new Error(data?.error || "Erro ao calcular preview");
      }
    } catch (error: any) {
      console.error("Preview error:", error);
      toast.error(error.message || "Erro ao calcular valor do upgrade");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Confirm and execute the upgrade
  const confirmUpgrade = async () => {
    if (!pendingUpgradePlan) return;

    const periodMap = {
      monthly: "mensal",
      quarterly: "trimestral",
      annual: "anual"
    };

    setIsUpgrading(true);
    setShowUpgradeDialog(false);
    
    try {
      const { data, error } = await supabase.functions.invoke("upgrade-subscription", {
        body: { 
          newPlan: pendingUpgradePlan, 
          period: periodMap[billingPeriod] 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success(data.message || "Upgrade realizado com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        refetchSubscription();
      } else {
        throw new Error(data?.error || "Erro ao fazer upgrade");
      }
    } catch (error: any) {
      console.error("Upgrade error:", error);
      toast.error(error.message || "Erro ao fazer upgrade");
    } finally {
      setIsUpgrading(false);
      setPendingUpgradePlan(null);
      setUpgradePreview(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast.error(error.message || "Erro ao abrir portal de gerenciamento");
    } finally {
      setIsOpeningPortal(false);
    }
  };

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
      } else {
        toast.error(result.error || "Erro ao resgatar código");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao resgatar código");
    } finally {
      setIsRedeeming(false);
    }
  };

  const getPricing = (plan: "hero" | "master") => {
    const prices = {
      hero: {
        monthly: { price: "8,90", period: "mês", savings: "", equivalent: "" },
        quarterly: { price: "22,90", period: "trimestre", savings: "~15%", equivalent: "" },
        annual: { price: "79,90", period: "ano", savings: "", equivalent: "6,65/mês" }
      },
      master: {
        monthly: { price: "18,90", period: "mês", savings: "", equivalent: "" },
        quarterly: { price: "49,90", period: "trimestre", savings: "~12%", equivalent: "" },
        annual: { price: "179,90", period: "ano", savings: "", equivalent: "15,00/mês" }
      }
    };
    return prices[plan][billingPeriod];
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
          {/* Current Plan Status */}
          <div className={`p-4 rounded-2xl ${isPaidTier ? 'bg-gradient-to-br from-gold/20 to-amber-500/10 border border-gold/30' : 'bg-muted'}`}>
            <div className="flex items-center gap-3 mb-2">
              {currentTier === "mestre" ? (
                <Crown className="w-6 h-6 text-gold" />
              ) : currentTier === "heroi" ? (
                <Sword className="w-6 h-6 text-secondary" />
              ) : (
                <Shield className="w-6 h-6 text-muted-foreground" />
              )}
              <div>
                <h3 className="font-semibold text-foreground">
                  {currentTier === "mestre" ? "Plano Mestre" : currentTier === "heroi" ? "Plano Herói" : "Plano Aldeão"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {currentTier === "mestre" ? "Acesso total às ferramentas de Mestre!" : currentTier === "heroi" ? "Acesso a recursos exclusivos de jogador!" : "Plano gratuito - Sem anúncios"}
                </p>
              </div>
            </div>
            {currentTier === "aldeao" && subscription && (
              <p className="text-sm text-muted-foreground mt-2">
                {subscription.characterCount}/{subscription.limits.maxCharacters} personagens ativos
              </p>
            )}
          </div>

          {/* Billing Period Selector */}
          <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as any)} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="monthly" className="text-xs">Mensal</TabsTrigger>
              <TabsTrigger value="quarterly" className="text-xs">Trimestral</TabsTrigger>
              <TabsTrigger value="annual" className="text-xs relative">
                Anual
                <Badge className="absolute -top-2 -right-1 text-[8px] px-1 py-0 bg-green-500 text-white">
                  Melhor
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Plans */}
          <div className="space-y-4">
            {/* Aldeão (Free) */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <h5 className="font-semibold text-foreground">Aldeão</h5>
                </div>
                <span className="text-sm text-muted-foreground">Gratuito</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Onde tudo começa. Ideal para jogadores casuais.
              </p>
              <ul className="space-y-2">
                {[
                  { icon: ScrollText, text: "Até 3 personagens simultâneos" },
                  { icon: Sword, text: "Compêndio SRD 5.1 completo" },
                  { icon: Users, text: "Entrar em campanhas de amigos" },
                  { icon: Shield, text: "Backup básico na nuvem" },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <feature.icon className="w-4 h-4 text-primary shrink-0" />
                    {feature.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Herói (Player) */}
            <div className="p-4 rounded-xl border-2 border-secondary bg-gradient-to-br from-secondary/10 to-transparent">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sword className="w-5 h-5 text-secondary" />
                  <h5 className="font-semibold text-foreground">Herói</h5>
                  <Badge variant="secondary" className="text-[10px]">PLAYER</Badge>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-secondary">R$ {getPricing("hero").price}</span>
                  <span className="text-xs text-muted-foreground">/{getPricing("hero").period}</span>
                  {billingPeriod === "quarterly" && (
                    <p className="text-[10px] text-green-500">Economize {getPricing("hero").savings}</p>
                  )}
                  {billingPeriod === "annual" && (
                    <p className="text-[10px] text-green-500">≈ R$ {getPricing("hero").equivalent}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Para aventureiros dedicados. Personalização e segurança.
              </p>
              <ul className="space-y-2">
                {[
                  { icon: ScrollText, text: "Até 20 personagens ativos" },
                  { icon: Palette, text: "Temas exclusivos e avatares HD" },
                  { icon: Wand2, text: "Módulo Homebrew completo" },
                  { icon: History, text: "Histórico de alterações nas fichas" },
                  { icon: MessageSquare, text: "Suporte prioritário" },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <feature.icon className="w-4 h-4 text-secondary shrink-0" />
                    {feature.text}
                  </li>
                ))}
              </ul>
              
              {currentTier !== "heroi" && currentTier !== "mestre" && (
                <Button 
                  onClick={() => handleUpgrade("heroi")}
                  disabled={isCheckingOut}
                  className="w-full mt-4 bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90"
                >
                  {isCheckingOut ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sword className="w-4 h-4 mr-2" />
                  )}
                  Assinar Herói
                </Button>
              )}
            </div>

            {/* Mestre (Master) */}
            <div className="p-4 rounded-xl border-2 border-gold bg-gradient-to-br from-gold/15 to-amber-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gold text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                RECOMENDADO
              </div>
              <div className="flex items-center justify-between mb-3 mt-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-gold" />
                  <h5 className="font-semibold text-foreground">Mestre</h5>
                  <Badge className="text-[10px] bg-gold/20 text-gold border-gold/30">MASTER</Badge>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gold">R$ {getPricing("master").price}</span>
                  <span className="text-xs text-muted-foreground">/{getPricing("master").period}</span>
                  {billingPeriod === "quarterly" && (
                    <p className="text-[10px] text-green-500">Economize {getPricing("master").savings}</p>
                  )}
                  {billingPeriod === "annual" && (
                    <p className="text-[10px] text-green-500">≈ R$ {getPricing("master").equivalent}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                O poder total da mesa. Ferramentas de automação para quem comanda.
              </p>
              <ul className="space-y-2">
                {[
                  { icon: Sparkles, text: "Personagens ilimitados" },
                  { icon: Users, text: "Campanhas ilimitadas como Mestre" },
                  { icon: Swords, text: "Combat Tracker Pro com HP em tempo real" },
                  { icon: MessageSquare, text: "Integração Discord (rolagens e alertas)" },
                  { icon: Share2, text: "Partilha de Homebrew nas campanhas" },
                  { icon: Heart, text: "Gestão de Stress/Sanidade" },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <feature.icon className="w-4 h-4 text-gold shrink-0" />
                    {feature.text}
                  </li>
                ))}
              </ul>
              
              {currentTier !== "mestre" && (
                <Button 
                  onClick={() => currentTier === "heroi" ? handlePreviewUpgrade("mestre") : handleUpgrade("mestre")}
                  disabled={isCheckingOut || isUpgrading || isLoadingPreview}
                  className="w-full mt-4 bg-gradient-to-r from-gold to-amber-500 text-black font-semibold hover:opacity-90"
                >
                  {isCheckingOut || isUpgrading || isLoadingPreview ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : currentTier === "heroi" ? (
                    <ArrowUp className="w-4 h-4 mr-2" />
                  ) : (
                    <Crown className="w-4 h-4 mr-2" />
                  )}
                  {currentTier === "heroi" ? "Fazer Upgrade para Mestre" : "Assinar Mestre"}
                </Button>
              )}
            </div>
          </div>

          {/* Redeem Code Section */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-secondary" />
              <h4 className="font-semibold text-foreground">Resgatar Código</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Possui um código promocional? Digite abaixo para ativar.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código"
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

          {isPaidTier && (
            <div className="p-4 rounded-xl bg-muted space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Você possui o plano {currentTier === "mestre" ? "Mestre" : "Herói"}! Obrigado por apoiar o Go20.
              </p>
              {subscription?.expiresAt && (
                <p className="text-xs text-muted-foreground text-center">
                  Válido até: {new Date(subscription.expiresAt).toLocaleDateString("pt-BR")}
                </p>
              )}
              <Button
                onClick={handleManageSubscription}
                disabled={isOpeningPortal}
                variant="outline"
                className="w-full"
              >
                {isOpeningPortal ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Gerenciar Assinatura
              </Button>
            </div>
          )}

          {/* No Ads Notice */}
          <p className="text-center text-xs text-muted-foreground">
            🎮 Go20 é livre de anúncios em todos os planos
          </p>
        </div>
      </SheetContent>

      {/* Upgrade Confirmation Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-gold" />
              Confirmar Upgrade para Mestre
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                {upgradePreview && (
                  <>
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Plano atual:</span>
                        <span className="font-medium">{upgradePreview.currentPlan}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Novo plano:</span>
                        <span className="font-medium text-gold">{upgradePreview.newPlan}</span>
                      </div>
                      <div className="border-t border-border pt-3 space-y-2">
                        {upgradePreview.creditAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Crédito (tempo não usado):</span>
                            <span className="text-green-500">- R$ {upgradePreview.creditAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {upgradePreview.chargeAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Novo plano (proporcional):</span>
                            <span>R$ {upgradePreview.chargeAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between font-semibold">
                          <span>Total a pagar agora:</span>
                          <span className="text-gold">R$ {upgradePreview.prorationAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {upgradePreview.daysRemaining > 0 
                        ? `Você tem ${upgradePreview.daysRemaining} dias restantes no seu período atual. O valor proporcional será cobrado imediatamente.`
                        : "O valor proporcional será cobrado imediatamente."
                      }
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingUpgradePlan(null);
              setUpgradePreview(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmUpgrade}
              className="bg-gradient-to-r from-gold to-amber-500 text-black hover:opacity-90"
            >
              {isUpgrading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              Confirmar Upgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
