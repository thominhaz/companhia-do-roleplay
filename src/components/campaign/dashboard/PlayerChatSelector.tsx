import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessageCounts, useMarkMessagesAsRead } from "@/hooks/useUnreadMessages";
import { CampaignChatSheet } from "../CampaignChatSheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Users, 
  Lock, 
  Crown,
  UserCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerChatSelectorProps {
  campaign: CampaignDB;
}

export function PlayerChatSelector({ campaign }: PlayerChatSelectorProps) {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const { data: players, isLoading } = useCampaignPlayers(campaign.id);
  const { data: unreadCounts } = useUnreadMessageCounts(campaign.id);
  const markAsRead = useMarkMessagesAsRead();
  
  const isMaster = campaign.master_id === user?.id;

  // Filter out current user from the list
  const otherPlayers = players?.filter(p => p.user_id !== user?.id) || [];

  // Get unread count for public chat
  const publicUnreadCount = unreadCounts?.get(null) || 0;

  const handleSelectPlayer = (playerId: string | null) => {
    setSelectedPlayerId(playerId);
    setShowChat(true);
  };

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (showChat) {
      markAsRead.mutate({
        campaignId: campaign.id,
        otherUserId: selectedPlayerId,
      });
    }
  }, [showChat, selectedPlayerId, campaign.id]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Chat</h2>
          <p className="text-sm text-muted-foreground">Comunicação em tempo real da campanha</p>
        </div>
        <Button onClick={() => handleSelectPlayer(null)} className="gap-2 relative">
          <MessageCircle className="w-4 h-4" />
          Chat Geral
          {publicUnreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
              {publicUnreadCount > 99 ? '99+' : publicUnreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* General Chat Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center relative">
            <Users className="w-7 h-7 text-blue-500" />
            {publicUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {publicUnreadCount > 99 ? '99+' : publicUnreadCount}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Chat da Campanha</h3>
            <p className="text-sm text-muted-foreground">
              Converse com todos os membros da mesa
            </p>
          </div>
          <Button onClick={() => handleSelectPlayer(null)} variant="outline">
            <MessageCircle className="w-4 h-4 mr-2" />
            Abrir
          </Button>
        </div>
      </motion.div>

      {/* Private Messages Section */}
      {isMaster && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold">Mensagens Privadas</h3>
            <span className="text-xs text-muted-foreground">
              (apenas você e o jogador verão)
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : otherPlayers.length === 0 ? (
            <div className="bg-muted/30 rounded-xl p-6 text-center">
              <UserCircle2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum jogador na campanha ainda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <AnimatePresence>
                {otherPlayers.map((player, index) => {
                  const playerUnreadCount = unreadCounts?.get(player.user_id) || 0;
                  
                  return (
                    <motion.button
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        transition: { delay: index * 0.05 }
                      }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPlayer(player.user_id)}
                      className={cn(
                        "relative flex flex-col items-center p-4 rounded-xl border transition-all",
                        "bg-gradient-to-b from-card to-card/80",
                        playerUnreadCount > 0 
                          ? "border-amber-500/50 ring-1 ring-amber-500/30" 
                          : "border-border/50 hover:border-primary/50",
                        "hover:shadow-lg hover:shadow-primary/5",
                        "group cursor-pointer"
                      )}
                    >
                      {/* Unread Badge */}
                      {playerUnreadCount > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-lg z-10"
                        >
                          {playerUnreadCount > 99 ? '99+' : playerUnreadCount}
                        </motion.span>
                      )}

                      {/* Avatar */}
                      <Avatar className={cn(
                        "w-14 h-14 mb-2 ring-2 transition-all",
                        playerUnreadCount > 0 
                          ? "ring-amber-500" 
                          : "ring-border group-hover:ring-primary/50"
                      )}>
                        <AvatarImage src={player.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(player.profile?.display_name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name */}
                      <span className="text-sm font-medium text-center line-clamp-1 max-w-full">
                        {player.profile?.display_name || "Jogador"}
                      </span>

                      {/* Character Info */}
                      {player.character && (
                        <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {player.character.name}
                        </span>
                      )}

                      {/* Role Badge - hide when there are unread messages */}
                      {player.role === 'player' && playerUnreadCount === 0 && (
                        <Badge 
                          variant="outline" 
                          className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 opacity-60"
                        >
                          Jogador
                        </Badge>
                      )}

                      {/* Message Icon Overlay */}
                      <div className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="bg-primary rounded-full p-2 shadow-lg">
                          <MessageCircle className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      <CampaignChatSheet
        campaignId={campaign.id}
        open={showChat}
        onOpenChange={setShowChat}
        preSelectedRecipientId={selectedPlayerId}
      />
    </div>
  );
}
