import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { CampaignCompendiumSheet } from "../CampaignCompendiumSheet";
import { Button } from "@/components/ui/button";
import { Library } from "lucide-react";

interface DashboardCompendiumProps {
  campaign: CampaignDB;
}

export function DashboardCompendium({ campaign }: DashboardCompendiumProps) {
  const [showCompendium, setShowCompendium] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Compêndio</h2>
          <p className="text-sm text-muted-foreground">Conteúdo homebrew compartilhado</p>
        </div>
        <Button onClick={() => setShowCompendium(true)} className="gap-2">
          <Library className="w-4 h-4" />
          Abrir Compêndio
        </Button>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border text-center">
        <Library className="w-12 h-12 mx-auto mb-4 text-purple-500 opacity-50" />
        <h3 className="font-semibold mb-2">Compêndio da Campanha</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Acesse magias, itens, raças e classes homebrew compartilhadas pelo mestre.
        </p>
        <Button onClick={() => setShowCompendium(true)} variant="outline">
          Ver Conteúdo
        </Button>
      </div>

      <CampaignCompendiumSheet
        campaignId={campaign.id}
        open={showCompendium}
        onOpenChange={setShowCompendium}
      />
    </div>
  );
}
