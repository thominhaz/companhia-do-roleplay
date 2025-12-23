import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Save, Loader2, ExternalLink, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface DiscordWebhookConfigProps {
  campaignId: string;
  currentWebhookUrl: string | null;
}

export function DiscordWebhookConfig({ campaignId, currentWebhookUrl }: DiscordWebhookConfigProps) {
  const [webhookUrl, setWebhookUrl] = useState(currentWebhookUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const queryClient = useQueryClient();

  const isValidWebhook = webhookUrl.startsWith("https://discord.com/api/webhooks/") || 
                         webhookUrl.startsWith("https://discordapp.com/api/webhooks/");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ discord_webhook_url: webhookUrl || null })
        .eq('id', campaignId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success("Webhook do Discord salvo!");
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error("Erro ao salvar webhook");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!isValidWebhook) {
      toast.error("URL de webhook inválida");
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-discord-notification', {
        body: {
          campaignId,
          type: 'custom',
          data: {
            customTitle: '🎮 Teste de Conexão',
            customMessage: 'A integração com Discord está funcionando! As rolagens e alertas serão enviados para este canal.',
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Mensagem de teste enviada!");
      } else {
        toast.error(data?.error || "Erro ao enviar mensagem");
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error("Erro ao testar webhook");
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ discord_webhook_url: null })
        .eq('id', campaignId);

      if (error) throw error;

      setWebhookUrl("");
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success("Webhook removido!");
    } catch (error) {
      console.error('Error removing webhook:', error);
      toast.error("Erro ao remover webhook");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-[#5865F2]" />
        </div>
        <div>
          <h4 className="font-semibold">Integração Discord</h4>
          <p className="text-xs text-muted-foreground">
            Envie rolagens e alertas para seu servidor
          </p>
        </div>
        {currentWebhookUrl && (
          <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" />
            Conectado
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhook-url" className="text-sm">
          URL do Webhook
        </Label>
        <Input
          id="webhook-url"
          type="url"
          placeholder="https://discord.com/api/webhooks/..."
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Crie um webhook em: Configurações do Canal → Integrações → Webhooks
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks", "_blank")}
          className="gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Como criar
        </Button>

        {webhookUrl && isValidWebhook && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
            className="gap-1"
          >
            {isTesting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <MessageSquare className="w-3 h-3" />
            )}
            Testar
          </Button>
        )}

        {currentWebhookUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isSaving}
            className="gap-1 text-destructive hover:text-destructive"
          >
            <X className="w-3 h-3" />
            Remover
          </Button>
        )}

        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || (!webhookUrl && !currentWebhookUrl)}
          className="gap-1 ml-auto"
        >
          {isSaving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          Salvar
        </Button>
      </div>
    </div>
  );
}
