import { CampaignDB } from "@/hooks/useCampaigns";
import { PlayerChatSelector } from "./PlayerChatSelector";

interface DashboardChatProps {
  campaign: CampaignDB;
}

export function DashboardChat({ campaign }: DashboardChatProps) {
  return <PlayerChatSelector campaign={campaign} />;
}
