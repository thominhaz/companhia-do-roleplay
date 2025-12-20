import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Users, 
  Calendar, 
  MessageSquare, 
  Megaphone,
  Check,
  CheckCheck,
  Trash2,
  X
} from "lucide-react";
import { 
  useNotifications, 
  useMarkAsRead, 
  useMarkAllAsRead, 
  useDeleteNotification,
  useClearAllNotifications,
  type Notification 
} from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notificationIcons: Record<string, typeof Bell> = {
  campaign_invite: Users,
  session_reminder: Calendar,
  campaign_update: Megaphone,
  chat_message: MessageSquare,
};

const notificationColors: Record<string, string> = {
  campaign_invite: "bg-primary/20 text-primary",
  session_reminder: "bg-amber-500/20 text-amber-400",
  campaign_update: "bg-blue-500/20 text-blue-400",
  chat_message: "bg-green-500/20 text-green-400",
};

function NotificationItem({ notification }: { notification: Notification }) {
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();
  
  const Icon = notificationIcons[notification.type] || Bell;
  const colorClass = notificationColors[notification.type] || "bg-muted text-muted-foreground";

  const handleMarkAsRead = () => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
  };

  const handleDelete = () => {
    deleteNotification.mutate(notification.id);
  };

  return (
    <div 
      className={cn(
        "p-4 border-b border-border/30 transition-colors",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="flex gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-sm font-medium truncate",
              !notification.read ? "text-foreground" : "text-muted-foreground"
            )}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-1 shrink-0">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleMarkAsRead}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <span className="text-[10px] text-muted-foreground/60 mt-2 block">
            {formatDistanceToNow(new Date(notification.created_at), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const { data: notifications, isLoading } = useNotifications();
  const markAllAsRead = useMarkAllAsRead();
  const clearAll = useClearAllNotifications();

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-dark">
        <SheetHeader className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <Bell className="h-5 w-5" />
              Notificações
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>

        {notifications && notifications.length > 0 && (
          <div className="flex items-center justify-end gap-2 p-2 border-b border-border/30">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-muted-foreground hover:text-destructive"
              onClick={() => clearAll.mutate()}
              disabled={clearAll.isPending}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-140px)]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 animate-pulse" />
              <p className="text-sm">Carregando...</p>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhuma notificação</p>
              <p className="text-xs mt-1 opacity-70">
                Você receberá notificações sobre suas campanhas aqui
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
