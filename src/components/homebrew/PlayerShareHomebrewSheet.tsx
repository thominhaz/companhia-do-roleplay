import { useState, useEffect } from "react";
import { Share2, Check, Loader2, Clock, Zap, Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  useEligibleCampaignsForSharing, 
  useRequestHomebrewShare 
} from "@/hooks/useHomebrewShareRequests";
import { useHomebrew } from "@/hooks/useHomebrew";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HomebrewContent } from "@/types";
import { cn } from "@/lib/utils";

interface PlayerShareHomebrewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: HomebrewContent | null;
}

export function PlayerShareHomebrewSheet({ open, onOpenChange, item }: PlayerShareHomebrewSheetProps) {
  const queryClient = useQueryClient();
  const { shareWithCampaignAsync, isSharing } = useHomebrew();
  const { eligibleCampaigns, isLoading: loadingCampaigns } = useEligibleCampaignsForSharing();
  const { requestShareAsync, isRequesting } = useRequestHomebrewShare();
  const [processingCampaignId, setProcessingCampaignId] = useState<string | null>(null);

  // Busca status atual (compartilhamentos e solicitações pendentes)
  const { data: shareStatus = {}, isLoading: loadingStatus } = useQuery({
    queryKey: ['homebrew-share-status', item?.id],
    queryFn: async () => {
      if (!item) return {};
      
      // Busca compartilhamentos existentes
      const { data: shares } = await supabase
        .from('homebrew_shares')
        .select('campaign_id')
        .eq('content_id', item.id);
      
      // Busca solicitações pendentes
      const { data: requests } = await supabase
        .from('homebrew_share_requests')
        .select('campaign_id, status')
        .eq('content_id', item.id)
        .eq('status', 'pending');
      
      const status: Record<string, 'shared' | 'pending'> = {};
      
      (shares || []).forEach(s => {
        status[s.campaign_id] = 'shared';
      });
      
      (requests || []).forEach(r => {
        if (!status[r.campaign_id]) {
          status[r.campaign_id] = 'pending';
        }
      });
      
      return status;
    },
    enabled: !!item && open,
  });

  const handleShare = async (campaignId: string, policy: string) => {
    if (!item) return;
    
    setProcessingCampaignId(campaignId);
    
    try {
      if (policy === 'enabled') {
        await shareWithCampaignAsync({ contentId: item.id, campaignId });
      } else if (policy === 'approval_required') {
        await requestShareAsync({ contentId: item.id, campaignId });
      }
      queryClient.invalidateQueries({ queryKey: ['homebrew-share-status', item.id] });
    } catch {
      // errors handled by mutation onError
    } finally {
      setProcessingCampaignId(null);
    }
  };

  const isLoading = loadingCampaigns || loadingStatus;
  const isProcessing = isSharing || isRequesting;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Compartilhar com Campanhas
          </SheetTitle>
          <SheetDescription>
            Compartilhe "{item?.name}" com as campanhas em que você participa
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : eligibleCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                <Info className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Nenhuma campanha disponível para compartilhamento.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Os mestres das campanhas precisam habilitar o compartilhamento de homebrew.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {eligibleCampaigns.map((campaign) => {
                const status = shareStatus[campaign.id];
                const isAlreadyShared = status === 'shared';
                const isPending = status === 'pending';
                const isEnabled = campaign.homebrew_sharing_policy === 'enabled';
                const isProcessingThis = processingCampaignId === campaign.id;

                return (
                  <div
                    key={campaign.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                      isAlreadyShared 
                        ? "bg-green-500/5 border-green-500/20" 
                        : isPending
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-muted border-border"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {campaign.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            isEnabled 
                              ? "border-green-500/50 text-green-500" 
                              : "border-amber-500/50 text-amber-500"
                          )}
                        >
                          {isEnabled ? (
                            <>
                              <Zap className="w-3 h-3 mr-1" />
                              Direto
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Requer Aprovação
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>

                    {isAlreadyShared ? (
                      <Badge className="bg-green-500/20 text-green-500 border-0">
                        <Check className="w-3 h-3 mr-1" />
                        Compartilhado
                      </Badge>
                    ) : isPending ? (
                      <Badge className="bg-amber-500/20 text-amber-500 border-0">
                        <Clock className="w-3 h-3 mr-1" />
                        Aguardando
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleShare(campaign.id, campaign.homebrew_sharing_policy)}
                        disabled={isProcessing}
                      >
                        {isProcessingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isEnabled ? (
                          'Compartilhar'
                        ) : (
                          'Solicitar'
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
