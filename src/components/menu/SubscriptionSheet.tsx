import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSubscription } from "@/hooks/useSubscription";
import { Crown, Check, Sparkles, Users, Wand2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SubscriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionSheet({ open, onOpenChange }: SubscriptionSheetProps) {
  const { data: subscription } = useSubscription();
  const isPremium = subscription?.status === "premium";

  const handleUpgrade = () => {
    toast.info("Integração com pagamentos em breve!");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" />
            Assinatura
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-8rem)] pb-8">
          {/* Current Plan */}
          <div className={`p-4 rounded-2xl ${isPremium ? 'bg-gradient-to-br from-gold/20 to-amber-500/10 border border-gold/30' : 'bg-muted'}`}>
            <div className="flex items-center gap-3 mb-2">
              {isPremium ? (
                <Crown className="w-6 h-6 text-gold" />
              ) : (
                <Shield className="w-6 h-6 text-muted-foreground" />
              )}
              <div>
                <h3 className="font-semibold text-foreground">
                  {isPremium ? "Plano Premium" : "Plano Gratuito"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isPremium ? "Acesso completo a todos os recursos" : "Recursos básicos"}
                </p>
              </div>
            </div>
            {!isPremium && subscription && (
              <p className="text-sm text-muted-foreground mt-2">
                {subscription.characterCount}/{subscription.limits.maxCharacters} personagens usados
              </p>
            )}
          </div>

          {/* Plans Comparison */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Comparativo de Planos</h4>
            
            {/* Free Plan */}
            <div className="p-4 rounded-xl border border-border bg-dark">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-foreground">Gratuito</h5>
                <span className="text-sm text-muted-foreground">R$ 0/mês</span>
              </div>
              <ul className="space-y-2">
                {[
                  "Até 3 personagens",
                  "Acesso às ferramentas básicas",
                  "Rolador de dados",
                  "Compêndio de magias",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium Plan */}
            <div className="p-4 rounded-xl border-2 border-gold bg-gradient-to-br from-gold/10 to-transparent">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h5 className="font-semibold text-foreground">Premium</h5>
                  <span className="px-2 py-0.5 bg-gold text-black text-[10px] font-bold rounded-full">
                    RECOMENDADO
                  </span>
                </div>
                <span className="text-sm font-semibold text-gold">R$ 19,90/mês</span>
              </div>
              <ul className="space-y-2">
                {[
                  { icon: Sparkles, text: "Personagens ilimitados" },
                  { icon: Users, text: "Criar e gerenciar campanhas" },
                  { icon: Wand2, text: "Combat Tracker completo" },
                  { icon: Shield, text: "Backup automático na nuvem" },
                  { icon: Crown, text: "Suporte prioritário" },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <feature.icon className="w-4 h-4 text-gold" />
                    {feature.text}
                  </li>
                ))}
              </ul>
              
              {!isPremium && (
                <Button 
                  onClick={handleUpgrade}
                  className="w-full mt-4 bg-gradient-to-r from-gold to-amber-500 text-black font-semibold hover:opacity-90"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Fazer Upgrade
                </Button>
              )}
            </div>
          </div>

          {isPremium && (
            <div className="p-4 rounded-xl bg-muted">
              <p className="text-sm text-muted-foreground text-center">
                Você já possui o plano Premium! Obrigado por apoiar o Go20.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}