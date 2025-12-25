import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { CampaignChatSheet } from "../CampaignChatSheet";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface DashboardChatProps {
  campaign: CampaignDB;
}

export function DashboardChat({ campaign }: DashboardChatProps) {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Chat</h2>
          <p className="text-sm text-muted-foreground">Comunicação em tempo real da campanha</p>
        </div>
        <Button onClick={() => setShowChat(true)} className="gap-2">
          <MessageCircle className="w-4 h-4" />
          Abrir Chat
        </Button>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border text-center">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
        <h3 className="font-semibold mb-2">Chat da Campanha</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Converse em tempo real com todos os membros da campanha.
        </p>
        <Button onClick={() => setShowChat(true)} variant="outline">
          Iniciar Conversa
        </Button>
      </div>

      <CampaignChatSheet
        campaignId={campaign.id}
        open={showChat}
        onOpenChange={setShowChat}
      />
    </div>
  );
}
