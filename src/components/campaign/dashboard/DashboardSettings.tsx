import { useState } from "react";
import { CampaignDB, useDeleteCampaign } from "@/hooks/useCampaigns";
import { Button } from "@/components/ui/button";
import { Settings, Trash2, Copy, Share2, Palette, Hammer } from "lucide-react";
import { toast } from "sonner";
import { DiscordWebhookConfig } from "../DiscordWebhookConfig";
import { CampaignAppearanceSettings } from "./CampaignAppearanceSettings";
import { HomebrewSharingSettings } from "./HomebrewSharingSettings";
import { HomebrewShareRequestsPanel } from "./HomebrewShareRequestsPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DashboardSettingsProps {
  campaign: CampaignDB & { discord_webhook_url?: string | null; homebrew_sharing_policy?: string };
  onClose: () => void;
}

export function DashboardSettings({ campaign, onClose }: DashboardSettingsProps) {
  const deleteCampaign = useDeleteCampaign();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [homebrewOpen, setHomebrewOpen] = useState(false);

  const handleCopyInviteCode = () => {
    if (campaign.invite_code) {
      navigator.clipboard.writeText(campaign.invite_code);
      toast.success("Código copiado: " + campaign.invite_code);
    }
  };

  const handleDeleteCampaign = async () => {
    try {
      await deleteCampaign.mutateAsync(campaign.id);
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Configurações</h2>
        <p className="text-sm text-muted-foreground">Gerencie as configurações da campanha</p>
      </div>

      {/* Invite Code */}
      {campaign.invite_code && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Código de Convite</p>
              <p className="text-xl font-mono font-bold tracking-widest">{campaign.invite_code}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyInviteCode}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
          </div>
        </div>
      )}

      {/* Homebrew Share Requests */}
      {campaign.homebrew_sharing_policy === 'approval_required' && (
        <HomebrewShareRequestsPanel campaignId={campaign.id} />
      )}

      {/* Appearance Settings */}
      <Collapsible open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <CollapsibleTrigger asChild>
          <div className="bg-card rounded-xl p-4 border border-border cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Aparência</h3>
                  <p className="text-xs text-muted-foreground">Personalize cores e ícone da campanha</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{appearanceOpen ? '▲' : '▼'}</span>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <CampaignAppearanceSettings campaign={campaign} />
        </CollapsibleContent>
      </Collapsible>

      {/* Homebrew Sharing Settings */}
      <Collapsible open={homebrewOpen} onOpenChange={setHomebrewOpen}>
        <CollapsibleTrigger asChild>
          <div className="bg-card rounded-xl p-4 border border-border cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hammer className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Compartilhamento de Homebrew</h3>
                  <p className="text-xs text-muted-foreground">Permita jogadores contribuírem no compêndio</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{homebrewOpen ? '▲' : '▼'}</span>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 bg-card rounded-xl p-4 border border-border">
          <HomebrewSharingSettings campaign={campaign} />
        </CollapsibleContent>
      </Collapsible>

      {/* Discord Integration */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Integração Discord
        </h3>
        <DiscordWebhookConfig 
          campaignId={campaign.id}
          currentWebhookUrl={campaign.discord_webhook_url}
        />
      </div>

      {/* Danger Zone */}
      <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
        <h3 className="font-semibold mb-2 text-destructive">Zona de Perigo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ações irreversíveis. Tenha cuidado.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Excluir Campanha
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todas as sessões, notas, chat e dados serão perdidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteCampaign}
                className="bg-destructive text-destructive-foreground"
              >
                Excluir Permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
