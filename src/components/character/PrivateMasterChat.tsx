import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCampaignMessages, useSendMessage, CampaignMessage } from "@/hooks/useChat";
import { useCampaignImageUpload } from "@/hooks/useCampaignImageUpload";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessageCounts, useMarkMessagesAsRead } from "@/hooks/useUnreadMessages";
import { 
  MessageCircle, 
  Send, 
  Loader2,
  ImagePlus,
  X,
  ChevronDown,
  Lock,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface PrivateMasterChatProps {
  campaignId: string;
  campaignName?: string;
  masterId: string;
}

export function PrivateMasterChat({ campaignId, campaignName, masterId }: PrivateMasterChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: allMessages, isLoading } = useCampaignMessages(campaignId);
  const { data: players } = useCampaignPlayers(campaignId);
  const { data: unreadCounts } = useUnreadMessageCounts(campaignId);
  const markAsRead = useMarkMessagesAsRead();
  const sendMessage = useSendMessage();
  const { uploadImage, isUploading } = useCampaignImageUpload();

  // Filter only private messages between the player and the master
  const privateMessages = allMessages?.filter(msg => {
    const isBetweenPlayerAndMaster = 
      (msg.user_id === user?.id && msg.recipient_id === masterId) ||
      (msg.user_id === masterId && msg.recipient_id === user?.id);
    return isBetweenPlayerAndMaster;
  }) || [];

  // Get master profile
  const masterProfile = players?.find(p => p.user_id === masterId)?.profile;

  // Get unread count from master
  const unreadCount = unreadCounts?.get(masterId) || 0;

  // Mark messages as read when chat is expanded
  useEffect(() => {
    if (isExpanded && unreadCount > 0) {
      markAsRead.mutate({
        campaignId,
        otherUserId: masterId,
      });
    }
  }, [isExpanded, unreadCount, campaignId, masterId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [privateMessages, isExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPendingImage({
        file,
        preview: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const removePendingImage = () => {
    setPendingImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !pendingImage) return;

    let content = message.trim();
    
    if (pendingImage) {
      const imageUrl = await uploadImage(pendingImage.file, { 
        folder: `chat/${campaignId}`,
        maxSizeKB: 500 
      });
      if (imageUrl) {
        content = content ? `${content}\n[img]${imageUrl}[/img]` : `[img]${imageUrl}[/img]`;
      }
      setPendingImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    if (!content) return;

    setMessage("");
    await sendMessage.mutateAsync({
      campaignId,
      content,
      recipientId: masterId, // Always send to master
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const parseMessageContent = (content: string) => {
    const imgRegex = /\[img\](.*?)\[\/img\]/g;
    const parts: { type: 'text' | 'image'; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index).trim();
        if (text) {
          parts.push({ type: 'text', content: text });
        }
      }
      parts.push({ type: 'image', content: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const text = content.slice(lastIndex).trim();
      if (text) {
        parts.push({ type: 'text', content: text });
      }
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-2 w-80 sm:w-96 bg-card/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-border/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">Chat com o Mestre</p>
                      <Crown className="w-3 h-3 text-amber-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mensagens privadas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/50">
                    Privado
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => setIsExpanded(false)}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="h-64 overflow-y-auto p-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : privateMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Lock className="w-10 h-10 text-amber-500/30 mb-2" />
                  <p className="text-sm font-medium mb-1">Nenhuma mensagem privada</p>
                  <p className="text-xs text-muted-foreground">
                    Envie uma mensagem para o mestre da campanha
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {privateMessages.map(msg => {
                    const isOwn = msg.user_id === user?.id;
                    const parts = parseMessageContent(msg.content);

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-xl px-3 py-1.5",
                            isOwn
                              ? "bg-amber-500/20 text-foreground rounded-br-sm border border-amber-500/30"
                              : "bg-muted text-foreground rounded-bl-sm"
                          )}
                        >
                          {!isOwn && (
                            <div className="flex items-center gap-1 mb-0.5">
                              <Crown className="w-3 h-3 text-amber-400" />
                              <p className="text-[10px] font-semibold text-amber-400">
                                {msg.profile?.display_name || 'Mestre'}
                              </p>
                            </div>
                          )}
                          <div className="space-y-1">
                            {parts.map((part, idx) => (
                              part.type === 'image' ? (
                                <img 
                                  key={idx}
                                  src={part.content} 
                                  alt="Imagem" 
                                  className="rounded-lg max-w-full max-h-32 cursor-pointer"
                                  onClick={() => window.open(part.content, '_blank')}
                                />
                              ) : (
                                <p key={idx} className="text-xs whitespace-pre-wrap break-words">
                                  {part.content}
                                </p>
                              )
                            ))}
                          </div>
                          <p className="text-[9px] mt-0.5 text-muted-foreground">
                            {format(new Date(msg.created_at), "HH:mm")}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending Image Preview */}
            {pendingImage && (
              <div className="px-3 pb-2">
                <div className="relative inline-block">
                  <img 
                    src={pendingImage.preview} 
                    alt="Preview" 
                    className="h-14 rounded-lg object-cover"
                  />
                  {isUploading ? (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    </div>
                  ) : (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 w-5 h-5"
                      onClick={removePendingImage}
                    >
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-2 border-t border-border/50 bg-muted/30">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || sendMessage.isPending}
                >
                  <ImagePlus className="w-4 h-4" />
                </Button>
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Mensagem para o mestre..."
                  className="h-8 text-sm"
                  disabled={isUploading}
                />
                <Button 
                  onClick={handleSend}
                  disabled={(!message.trim() && !pendingImage) || sendMessage.isPending || isUploading}
                  size="icon"
                  className="w-8 h-8 flex-shrink-0 bg-amber-500 hover:bg-amber-600"
                >
                  {sendMessage.isPending || isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all relative",
          isExpanded 
            ? "bg-muted hover:bg-muted/80" 
            : "bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        )}
        whileTap={{ scale: 0.95 }}
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-foreground" />
        ) : (
          <Lock className="w-5 h-5 text-white" />
        )}
        {!isExpanded && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}
