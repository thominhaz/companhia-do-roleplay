import { CampaignDB } from "@/hooks/useCampaigns";
import { Clock, Lock } from "lucide-react";

interface WorkshopTimelineProps {
  campaign: CampaignDB;
}

export function WorkshopTimeline({ campaign }: WorkshopTimelineProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timeline da Campanha
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Em Breve</span>
        </h2>
        <p className="text-sm text-muted-foreground">Visualize a linha do tempo da sua história</p>
      </div>

      <div className="bg-card rounded-2xl p-8 border border-dashed border-border text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary/50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Em breve você terá uma linha do tempo visual e interativa para registrar 
          e visualizar os eventos importantes da sua história.
        </p>
      </div>
    </div>
  );
}
