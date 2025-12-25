import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { CombatTracker } from "../CombatTracker";
import { PlayerCombatView } from "../PlayerCombatView";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";

interface DashboardCombatProps {
  campaign: CampaignDB;
  isMaster: boolean;
}

export function DashboardCombat({ campaign, isMaster }: DashboardCombatProps) {
  const [showCombatTracker, setShowCombatTracker] = useState(false);
  const [showPlayerCombat, setShowPlayerCombat] = useState(false);

  if (isMaster) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Combate</h2>
            <p className="text-sm text-muted-foreground">Gerencie encontros e iniciativa</p>
          </div>
          <Button onClick={() => setShowCombatTracker(true)} variant="destructive" className="gap-2">
            <Swords className="w-4 h-4" />
            Abrir Tracker
          </Button>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border text-center">
          <Swords className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Combat Tracker</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gerencie encontros, iniciativa, HP e condições dos combatentes em tempo real.
          </p>
          <Button onClick={() => setShowCombatTracker(true)} variant="outline">
            Iniciar Combate
          </Button>
        </div>

        <CombatTracker
          campaignId={campaign.id}
          open={showCombatTracker}
          onOpenChange={setShowCombatTracker}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Combate</h2>
          <p className="text-sm text-muted-foreground">Acompanhe o combate em tempo real</p>
        </div>
        <Button onClick={() => setShowPlayerCombat(true)} variant="outline" className="gap-2">
          <Swords className="w-4 h-4" />
          Ver Combate
        </Button>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border text-center">
        <Swords className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="font-semibold mb-2">Visualização de Combate</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Acompanhe a ordem de iniciativa e o status dos combatentes durante o combate.
        </p>
        <Button onClick={() => setShowPlayerCombat(true)} variant="outline">
          Abrir Visualização
        </Button>
      </div>

      <PlayerCombatView
        campaignId={campaign.id}
        open={showPlayerCombat}
        onOpenChange={setShowPlayerCombat}
      />
    </div>
  );
}
