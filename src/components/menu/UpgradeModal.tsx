import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Shield, Check, X } from "lucide-react";
import { SubscriptionTier } from "@/hooks/useSubscription";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTier: SubscriptionTier;
  featureName: string;
  featureDescription?: string;
  onOpenSubscription: () => void;
}

const TIER_INFO: Record<SubscriptionTier, {
  name: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
}> = {
  visitante: {
    name: "Visitante",
    icon: <Shield className="h-5 w-5" />,
    color: "text-muted-foreground",
    benefits: []
  },
  aldeao: {
    name: "Aldeão",
    icon: <Shield className="h-5 w-5" />,
    color: "text-emerald-500",
    benefits: [
      "Criar até 3 personagens",
      "Participar de campanhas",
      "Notas rápidas",
      "Ferramentas básicas"
    ]
  },
  heroi: {
    name: "Herói",
    icon: <Sparkles className="h-5 w-5" />,
    color: "text-amber-500",
    benefits: [
      "Criar até 20 personagens",
      "A Forja (conteúdo homebrew)",
      "Temas personalizados",
      "Histórico de personagens",
      "Todas as ferramentas"
    ]
  },
  mestre: {
    name: "Mestre",
    icon: <Crown className="h-5 w-5" />,
    color: "text-primary",
    benefits: [
      "Personagens ilimitados",
      "Criar campanhas",
      "Combat Tracker Pro",
      "Integração Discord",
      "Acesso total a todos os recursos"
    ]
  }
};

export function UpgradeModal({
  open,
  onOpenChange,
  requiredTier,
  featureName,
  featureDescription,
  onOpenSubscription
}: UpgradeModalProps) {
  const tierInfo = TIER_INFO[requiredTier];

  const handleUpgrade = () => {
    onOpenChange(false);
    onOpenSubscription();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full bg-primary/10 ${tierInfo.color}`}>
              {tierInfo.icon}
            </div>
          </div>
          <DialogTitle className="text-center">
            Recurso Exclusivo
          </DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-semibold text-foreground">{featureName}</span>
            {featureDescription && (
              <span className="block mt-1 text-muted-foreground">{featureDescription}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <span className={tierInfo.color}>{tierInfo.icon}</span>
              <span className="font-semibold">Plano {tierInfo.name}</span>
            </div>
            
            <ul className="space-y-2">
              {tierInfo.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-sm text-center">
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Apoie o Go20 no Catarse
              </span>
              <br />
              <span className="text-muted-foreground">
                e resgate seu código de acesso
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleUpgrade} className="w-full gap-2">
            <Crown className="h-4 w-4" />
            Ver Planos e Resgatar Código
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
