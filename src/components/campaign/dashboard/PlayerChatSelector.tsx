import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { useAuth } from "@/hooks/useAuth";
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
  
  const isMaster = campaign.master_id === user?.id;

  // Filter out current user from the list
  const otherPlayers = players?.filter(p => p.user_id !== user?.id) || [];

  const handleSelectPlayer = (playerId: string | null) => {
    setSelectedPlayerId(playerId);
    setShowChat(true);
  };

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
        <Button onClick={() => handleSelectPlayer(null)} className="gap-2">
          <MessageCircle className="w-4 h-4" />
          Chat Geral
        </Button>
      </div>

      {/* General Chat Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Users className="w-7 h-7 text-blue-500" />
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
                {otherPlayers.map((player, index) => (
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
                      "border-border/50 hover:border-primary/50",
                      "hover:shadow-lg hover:shadow-primary/5",
                      "group cursor-pointer"
                    )}
                  >
                    {/* Avatar */}
                    <Avatar className="w-14 h-14 mb-2 ring-2 ring-border group-hover:ring-primary/50 transition-all">
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

                    {/* Role Badge */}
                    {player.role === 'player' && (
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
                ))}
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
