import { useState, useEffect } from "react";
import { Share2, Check, Loader2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useHomebrew } from "@/hooks/useHomebrew";
import { useMasterCampaigns } from "@/hooks/useCampaigns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HomebrewContent } from "@/types";

interface ShareHomebrewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: HomebrewContent | null;
}

export function ShareHomebrewSheet({ open, onOpenChange, item }: ShareHomebrewSheetProps) {
  const { shareWithCampaign, unshareFromCampaign, isSharing } = useHomebrew();
  const { data: campaigns = [], isLoading: loadingCampaigns } = useMasterCampaigns();
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());

  // Fetch current shares for this item
  const { data: currentShares = [], isLoading: loadingShares } = useQuery({
    queryKey: ['homebrew-shares', item?.id],
    queryFn: async () => {
      if (!item) return [];
      
      const { data, error } = await supabase
        .from('homebrew_shares')
        .select('campaign_id')
        .eq('content_id', item.id);
      
      if (error) throw error;
      return data.map(s => s.campaign_id);
    },
    enabled: !!item && open,
  });

  // Initialize selected campaigns from current shares
  useEffect(() => {
    if (currentShares.length > 0) {
      setSelectedCampaigns(new Set(currentShares));
    } else {
      setSelectedCampaigns(new Set());
    }
  }, [currentShares]);

  const handleToggleCampaign = (campaignId: string) => {
    const newSelected = new Set(selectedCampaigns);
    if (newSelected.has(campaignId)) {
      newSelected.delete(campaignId);
    } else {
      newSelected.add(campaignId);
    }
    setSelectedCampaigns(newSelected);
  };

  const handleSave = async () => {
    if (!item) return;

    // Find campaigns to add and remove
    const currentSet = new Set(currentShares);
    const toAdd = [...selectedCampaigns].filter(id => !currentSet.has(id));
    const toRemove = [...currentSet].filter(id => !selectedCampaigns.has(id));

    // Add new shares
    for (const campaignId of toAdd) {
      shareWithCampaign({ contentId: item.id, campaignId });
    }

    // Remove old shares
    for (const campaignId of toRemove) {
      unshareFromCampaign({ contentId: item.id, campaignId });
    }

    onOpenChange(false);
  };

  const isLoading = loadingCampaigns || loadingShares;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Compartilhar com Campanhas
          </SheetTitle>
          <SheetDescription>
            Selecione as campanhas onde você é mestre para compartilhar "{item?.name}"
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Você não é mestre de nenhuma campanha.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie uma campanha para poder compartilhar seu conteúdo homebrew.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {campaigns.map((campaign: any) => (
                  <button
                    key={campaign.id}
                    onClick={() => handleToggleCampaign(campaign.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-left"
                  >
                    <Checkbox 
                      checked={selectedCampaigns.has(campaign.id)}
                      onCheckedChange={() => handleToggleCampaign(campaign.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {campaign.name}
                      </p>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {campaign.description}
                        </p>
                      )}
                    </div>
                    {selectedCampaigns.has(campaign.id) && (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
