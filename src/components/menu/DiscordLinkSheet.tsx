import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { Loader2, Link2, Unlink, RefreshCw, ExternalLink, Crown } from "lucide-react";

interface DiscordLinkSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DISCORD_CLIENT_ID = "1453471765010579506";
const DISCORD_SERVER_INVITE = "https://discord.gg/GwKMHAUvxB";

export function DiscordLinkSheet({ open, onOpenChange }: DiscordLinkSheetProps) {
  const { user, session } = useAuth();
  const { data: subscription } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [discordId, setDiscordId] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Get current tier display name
  const getTierName = () => {
    const tier = subscription?.tier || 'aldeao';
    switch (tier) {
      case 'mestre': return 'Mestre';
      case 'heroi': return 'Herói';
      default: return 'Aldeão';
    }
  };

  // Fetch profile to check if Discord is linked
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('discord_user_id')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setDiscordId(data.discord_user_id);
      }
      setLoadingProfile(false);
    };

    if (open) {
      fetchProfile();
    }
  }, [user, open]);

  // Handle OAuth callback
  useEffect(() => {
    const discordStatus = searchParams.get('discord');
    if (discordStatus === 'linked') {
      toast.success("Discord vinculado com sucesso!");
      searchParams.delete('discord');
      setSearchParams(searchParams, { replace: true });
      // Refresh profile data
      if (user) {
        supabase
          .from('profiles')
          .select('discord_user_id')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) setDiscordId(data.discord_user_id);
          });
      }
    }
  }, [searchParams, setSearchParams, user]);

  const handleLinkDiscord = async () => {
    if (!session?.access_token) {
      toast.error("Você precisa estar logado");
      return;
    }

    setLoading(true);

    try {
      // Build OAuth URL
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const redirectUri = encodeURIComponent(
        `https://${projectId}.supabase.co/functions/v1/discord-oauth-callback`
      );
      
      const scopes = encodeURIComponent("identify guilds.join");
      const state = encodeURIComponent(session.access_token);
      
      const oauthUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}`;
      
      // Redirect to Discord OAuth
      window.location.href = oauthUrl;
    } catch (error) {
      console.error("Error linking Discord:", error);
      toast.error("Erro ao vincular Discord");
      setLoading(false);
    }
  };

  const handleUnlinkDiscord = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-discord-role', {
        body: { action: 'unlink' },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message);
        setDiscordId(null);
      } else {
        toast.error(data?.error || "Erro ao desvincular Discord");
      }
    } catch (error) {
      console.error("Error unlinking Discord:", error);
      toast.error("Erro ao desvincular Discord");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRole = async () => {
    if (!session?.access_token) return;

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-discord-role', {
        body: { action: 'sync' },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message);
      } else {
        toast.error(data?.error || "Erro ao sincronizar cargo");
      }
    } catch (error) {
      console.error("Error syncing role:", error);
      toast.error("Erro ao sincronizar cargo");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
              </svg>
            </div>
            Discord
          </SheetTitle>
          <SheetDescription>
            Vincule sua conta do Discord para receber cargos automáticos baseados na sua assinatura.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : discordId ? (
            <>
              {/* Linked Status */}
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Discord Vinculado</p>
                    <p className="text-xs text-muted-foreground">ID: {discordId}</p>
                  </div>
                </div>
              </div>

              {/* Current Tier */}
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Cargo Atual</p>
                    <p className="text-xs text-muted-foreground">{getTierName()}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSyncRole}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sincronizar Cargo
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleUnlinkDiscord}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4 mr-2" />
                  )}
                  Desvincular Discord
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Not Linked */}
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Unlink className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Discord não vinculado</p>
                    <p className="text-xs text-muted-foreground">Clique abaixo para vincular</p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-muted/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Como funciona?</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Vincule sua conta do Discord ao Go20</li>
                  <li>• Entre no servidor oficial do Go20</li>
                  <li>• Receba automaticamente o cargo baseado na sua assinatura</li>
                  <li>• Aldeão, Herói ou Mestre - sempre atualizado!</li>
                </ul>
              </div>

              {/* Link Button */}
              <Button
                className="w-full bg-[#5865F2] hover:bg-[#4752C4]"
                onClick={handleLinkDiscord}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Vincular Discord
              </Button>

              {/* Server Invite */}
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <a href={DISCORD_SERVER_INVITE} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Entrar no Servidor
                </a>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
