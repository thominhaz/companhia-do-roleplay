import { Check, X, Loader2, Hammer, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  useCampaignShareRequests, 
  useRespondToShareRequest,
  HomebrewShareRequestWithDetails 
} from "@/hooks/useHomebrewShareRequests";

interface HomebrewShareRequestsPanelProps {
  campaignId: string;
}

const typeLabels: Record<string, string> = {
  race: 'Raça',
  subrace: 'Sub-raça',
  class: 'Classe',
  subclass: 'Subclasse',
  background: 'Antecedente',
  feat: 'Talento',
  spell: 'Magia',
  item: 'Item',
  monster: 'Monstro',
};

export function HomebrewShareRequestsPanel({ campaignId }: HomebrewShareRequestsPanelProps) {
  const { requests, isLoading } = useCampaignShareRequests(campaignId);
  const { approveRequest, rejectRequest, isApproving, isRejecting } = useRespondToShareRequest();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  const handleApprove = (request: HomebrewShareRequestWithDetails) => {
    approveRequest({
      requestId: request.id,
      contentId: request.content_id,
      campaignId: request.campaign_id,
    });
  };

  return (
    <div className="bg-gold/10 border border-gold/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Hammer className="w-4 h-4 text-gold" />
        <h4 className="font-semibold text-sm">Solicitações de Compartilhamento</h4>
        <Badge variant="secondary" className="ml-auto">
          {requests.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-background rounded-lg p-3 border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {request.homebrew_content?.icon || '✨'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {request.homebrew_content?.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {typeLabels[request.homebrew_content?.type] || request.homebrew_content?.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {request.requester_profile?.display_name || 'Jogador'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => rejectRequest(request.id)}
                  disabled={isRejecting}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-500 hover:text-green-500 hover:bg-green-500/10"
                  onClick={() => handleApprove(request)}
                  disabled={isApproving}
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
