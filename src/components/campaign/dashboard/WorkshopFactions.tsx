import { CampaignDB } from "@/hooks/useCampaigns";
import { Flag, Lock } from "lucide-react";

interface WorkshopFactionsProps {
  campaign: CampaignDB;
}

export function WorkshopFactions({ campaign }: WorkshopFactionsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Flag className="w-5 h-5" />
          Sistema de Facções
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Em Breve</span>
        </h2>
        <p className="text-sm text-muted-foreground">Gerencie facções, guildas e organizações</p>
      </div>

      <div className="bg-card rounded-2xl p-8 border border-dashed border-border text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary/50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Em breve você poderá gerenciar facções com sistema de reputação, 
          influência e relacionamentos políticos.
        </p>
      </div>
    </div>
  );
}
