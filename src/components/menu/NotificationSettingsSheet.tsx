import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Users, Calendar, Megaphone, MessageSquare, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface NotificationSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotificationPreferences {
  id: string;
  user_id: string;
  campaign_invite: boolean;
  session_reminder: boolean;
  campaign_update: boolean;
  chat_message: boolean;
}

const notificationSettings = [
  {
    key: "campaign_invite" as const,
    label: "Convites para campanhas",
    description: "Receba notificações quando for convidado para uma campanha",
    icon: Users,
    color: "text-primary",
  },
  {
    key: "session_reminder" as const,
    label: "Lembretes de sessões",
    description: "Receba lembretes sobre sessões agendadas",
    icon: Calendar,
    color: "text-gold",
  },
  {
    key: "campaign_update" as const,
    label: "Atualizações de campanhas",
    description: "Notificações sobre novas notas e combates",
    icon: Megaphone,
    color: "text-primary",
  },
  {
    key: "chat_message" as const,
    label: "Mensagens no chat",
    description: "Notificações de novas mensagens no chat da campanha",
    icon: MessageSquare,
    color: "text-secondary",
  },
];

export function NotificationSettingsSheet({ open, onOpenChange }: NotificationSettingsSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .rpc('get_or_create_notification_preferences', { _user_id: user.id });

      if (error) throw error;
      return data as NotificationPreferences;
    },
    enabled: !!user && open,
  });

  const updatePreference = useMutation({
    mutationFn: async ({ key, value }: { key: keyof NotificationPreferences; value: boolean }) => {
      if (!user) return;

      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a preferência",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (key: keyof NotificationPreferences, currentValue: boolean) => {
    updatePreference.mutate({ key, value: !currentValue });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-dark">
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Bell className="h-5 w-5 text-primary" />
            Configurar Notificações
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            notificationSettings.map((setting) => {
              const Icon = setting.icon;
              const isEnabled = preferences?.[setting.key] ?? true;

              return (
                <div
                  key={setting.key}
                  className="flex items-center justify-between p-4 rounded-xl bg-darker border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${setting.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={setting.key} className="text-sm font-medium text-foreground cursor-pointer">
                        {setting.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={setting.key}
                    checked={isEnabled}
                    onCheckedChange={() => handleToggle(setting.key, isEnabled)}
                    disabled={updatePreference.isPending}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            As notificações aparecerão no sino do app e podem ser visualizadas na tela inicial.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
