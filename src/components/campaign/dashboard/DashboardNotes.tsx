import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { CampaignNotesSheet } from "../CampaignNotesSheet";
import { Button } from "@/components/ui/button";
import { StickyNote } from "lucide-react";

interface DashboardNotesProps {
  campaign: CampaignDB;
  isMaster: boolean;
}

export function DashboardNotes({ campaign, isMaster }: DashboardNotesProps) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Notas</h2>
          <p className="text-sm text-muted-foreground">
            Notas da campanha para planejamento e anotações
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border text-center">
        <StickyNote className="w-12 h-12 mx-auto mb-4 text-amber-500 opacity-50" />
        <h3 className="font-semibold mb-2">Sistema de Notas</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Crie notas privadas ou compartilhe informações com todos os jogadores da campanha.
        </p>
        <Button onClick={() => setShowNotes(true)} variant="outline" className="gap-2">
          <StickyNote className="w-4 h-4" />
          Abrir Notas
        </Button>
      </div>

      <CampaignNotesSheet
        campaignId={campaign.id}
        open={showNotes}
        onOpenChange={setShowNotes}
      />
    </div>
  );
}
