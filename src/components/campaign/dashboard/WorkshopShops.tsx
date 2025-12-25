import { CampaignDB } from "@/hooks/useCampaigns";
import { Store, Lock } from "lucide-react";

interface WorkshopShopsProps {
  campaign: CampaignDB;
}

export function WorkshopShops({ campaign }: WorkshopShopsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Store className="w-5 h-5" />
          Oficina de Lojas
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Em Breve</span>
        </h2>
        <p className="text-sm text-muted-foreground">Crie mercadores e lojas para sua campanha</p>
      </div>

      <div className="bg-card rounded-2xl p-8 border border-dashed border-border text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary/50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Em breve você poderá criar mercadores completos com inventário, preços, 
          reputação e negociação dinâmica.
        </p>
      </div>
    </div>
  );
}
