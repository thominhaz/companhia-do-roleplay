import { useState } from "react";
import { CampaignDB, useDeleteCampaign } from "@/hooks/useCampaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Trash2, Copy, Share2, Palette, Hammer, ExternalLink, Key, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import { useQueryClient } from "@tanstack/react-query";

interface DashboardSettingsProps {
  campaign: CampaignDB & { discord_webhook_url?: string | null; homebrew_sharing_policy?: string };
  onClose: () => void;
}

export function DashboardSettings({ campaign, onClose }: DashboardSettingsProps) {
  const deleteCampaign = useDeleteCampaign();
  const queryClient = useQueryClient();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [homebrewOpen, setHomebrewOpen] = useState(false);
  const [vttOpen, setVttOpen] = useState(false);
  const [vttUrl, setVttUrl] = useState(campaign.foundry_vtt_url || '');
  const [savingVtt, setSavingVtt] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);

  const handleCopyInviteCode = () => {
    if (campaign.invite_code) {
      navigator.clipboard.writeText(campaign.invite_code);
      toast.success("Código copiado: " + campaign.invite_code);
    }
  };

  const handleSaveVttUrl = async () => {
    setSavingVtt(true);
    try {
      const trimmed = vttUrl.trim() || null;
      const { error } = await supabase
        .from('campaigns')
        .update({ foundry_vtt_url: trimmed })
        .eq('id', campaign.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success("URL do Foundry VTT salva!");
    } catch {
      toast.error("Erro ao salvar URL do VTT");
    } finally {
      setSavingVtt(false);
    }
  };

  const handleGenerateApiKey = async () => {
    setGeneratingKey(true);
    try {
      const { data, error } = await supabase.rpc('generate_foundry_api_key', {
        _campaign_id: campaign.id,
      });
      if (error) throw error;
      setApiKey(data as string);
      setShowApiKey(true);
      toast.success("API Key gerada! Copie e configure no Foundry VTT.");
    } catch {
      toast.error("Erro ao gerar API Key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success("API Key copiada!");
    }
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const syncEndpoint = `https://${projectId}.supabase.co/functions/v1/foundry-sync`;

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

      {/* Foundry VTT Integration */}
      <Collapsible open={vttOpen} onOpenChange={setVttOpen}>
        <CollapsibleTrigger asChild>
          <div className="bg-card rounded-xl p-4 border border-border cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Foundry VTT</h3>
                  <p className="text-xs text-muted-foreground">URL do mundo e API de sincronização</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{vttOpen ? '▲' : '▼'}</span>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-4">
          {/* URL */}
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <h4 className="text-sm font-semibold">URL do Mundo</h4>
            <p className="text-xs text-muted-foreground">
              URL do mundo no Foundry VTT. Ex: https://vtt.go20.com.br/join
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://vtt.go20.com.br/join"
                value={vttUrl}
                onChange={(e) => setVttUrl(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleSaveVttUrl} disabled={savingVtt}>
                {savingVtt ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          {/* API Key */}
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Key para Sincronização
            </h4>
            <p className="text-xs text-muted-foreground">
              Gere uma chave para o módulo do Foundry VTT se comunicar com o Go20. 
              A chave permite sincronizar HP, iniciativa e condições em tempo real.
            </p>

            {apiKey ? (
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <Input
                    readOnly
                    value={showApiKey ? apiKey : '•'.repeat(32)}
                    className="flex-1 font-mono text-xs"
                  />
                  <Button size="icon" variant="ghost" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCopyApiKey}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={handleGenerateApiKey} disabled={generatingKey}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Gerar Nova Chave
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={handleGenerateApiKey} disabled={generatingKey}>
                <Key className="w-4 h-4 mr-1" />
                {generatingKey ? "Gerando..." : "Gerar API Key"}
              </Button>
            )}
          </div>

          {/* Module Download & Instructions */}
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <h4 className="text-sm font-semibold">Módulo Go20 Sync</h4>
            <p className="text-xs text-muted-foreground">
              Instale o módulo no Foundry VTT para sincronização automática de HP, iniciativa e condições.
            </p>
            
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold">Como instalar:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Baixe o módulo e extraia na pasta <code className="bg-background px-1 rounded">Data/modules/go20-sync/</code></li>
                <li>No Foundry, vá em <strong>Add-on Modules</strong> e ative "Go20 Combat Sync"</li>
                <li>Em <strong>Module Settings</strong>, cole o Endpoint e a API Key abaixo</li>
                <li>O indicador verde 🟢 aparecerá quando a conexão estiver ativa</li>
              </ol>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Input readOnly value={syncEndpoint} className="flex-1 font-mono text-xs" />
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(syncEndpoint);
                  toast.success("Endpoint copiado!");
                }}>
                  <Copy className="w-4 h-4 mr-1" />
                  Endpoint
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href="/foundry-module/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Abrir Arquivos do Módulo
                </a>
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

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
