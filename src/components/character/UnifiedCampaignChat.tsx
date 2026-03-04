import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Crown,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface UnifiedCampaignChatProps {
  campaignId: string;
  campaignName?: string;
  masterId: string;
}

type ChatTab = "general" | "private";

export function UnifiedCampaignChat({ campaignId, campaignName, masterId }: UnifiedCampaignChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>("general");
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

  // Filter messages based on active tab
  const generalMessages = allMessages?.filter(msg => !msg.recipient_id) || [];
  const privateMessages = allMessages?.filter(msg => {
    const isBetweenPlayerAndMaster = 
      (msg.user_id === user?.id && msg.recipient_id === masterId) ||
      (msg.user_id === masterId && msg.recipient_id === user?.id);
    return isBetweenPlayerAndMaster;
  }) || [];

  const currentMessages = activeTab === "general" ? generalMessages : privateMessages;

  // Get unread count from master (for private chat)
  const unreadPrivateCount = unreadCounts?.get(masterId) || 0;
  const generalMessageCount = generalMessages.length;

  // Total unread for the badge
  const totalUnread = unreadPrivateCount;

  // Mark private messages as read when viewing private tab
  useEffect(() => {
    if (isExpanded && activeTab === "private" && unreadPrivateCount > 0) {
      markAsRead.mutate({
        campaignId,
        otherUserId: masterId,
      });
    }
  }, [isExpanded, activeTab, unreadPrivateCount, campaignId, masterId]);

  // Auto-scroll to bottom when messages change or tab changes
  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, isExpanded, activeTab]);

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
      recipientId: activeTab === "private" ? masterId : undefined,
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

  const renderMessages = (messages: CampaignMessage[], isPrivate: boolean) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          {isPrivate ? (
            <>
              <Lock className="w-10 h-10 text-gold/30 mb-2" />
              <p className="text-sm font-medium mb-1">Nenhuma mensagem privada</p>
              <p className="text-xs text-muted-foreground">
                Envie uma mensagem para o mestre
              </p>
            </>
          ) : (
            <>
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">
                Nenhuma mensagem ainda
              </p>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {messages.slice(-50).map(msg => {
          const isOwn = msg.user_id === user?.id;
          const isMaster = msg.user_id === masterId;
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
                    ? isPrivate 
                      ? "bg-gold/20 text-foreground rounded-br-sm border border-gold/30"
                      : "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                {!isOwn && (
                  <div className="flex items-center gap-1 mb-0.5">
                    {isMaster && isPrivate && <Crown className="w-3 h-3 text-gold" />}
                    <p className={cn(
                      "text-[10px] font-semibold",
                      isMaster && isPrivate ? "text-gold" : "text-primary"
                    )}>
                      {msg.profile?.display_name || (isMaster ? 'Mestre' : 'Jogador')}
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
                <p className={cn(
                  "text-[9px] mt-0.5",
                  isOwn && !isPrivate ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {format(new Date(msg.created_at), "HH:mm")}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
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
            className="mb-2 w-80 sm:w-96 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent-foreground/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    activeTab === "private" ? "bg-gold/20" : "bg-primary/20"
                  )}>
                    {activeTab === "private" ? (
                      <Lock className="w-4 h-4 text-gold" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {activeTab === "private" ? "Chat Privado" : "Chat da Mesa"}
                    </p>
                    {campaignName && (
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {campaignName}
                      </p>
                    )}
                  </div>
                </div>
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

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ChatTab)} className="w-full">
              <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-9">
                <TabsTrigger 
                  value="general" 
                  className="flex-1 h-8 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <Users className="w-3 h-3 mr-1.5" />
                  Grupo
                  {generalMessageCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                      {generalMessageCount > 99 ? '99+' : generalMessageCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="private" 
                  className="flex-1 h-8 text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold rounded-none border-b-2 border-transparent data-[state=active]:border-gold"
                >
                  <Crown className="w-3 h-3 mr-1.5" />
                  Mestre
                  {unreadPrivateCount > 0 && (
                    <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-destructive">
                      {unreadPrivateCount > 99 ? '99+' : unreadPrivateCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Messages Area */}
              <div ref={scrollRef} className="h-56 overflow-y-auto p-3">
                <TabsContent value="general" className="m-0 h-full">
                  {renderMessages(generalMessages, false)}
                </TabsContent>
                <TabsContent value="private" className="m-0 h-full">
                  {renderMessages(privateMessages, true)}
                </TabsContent>
              </div>
            </Tabs>

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
                  placeholder={activeTab === "private" ? "Mensagem para o mestre..." : "Mensagem..."}
                  className="h-8 text-sm"
                  disabled={isUploading}
                />
                <Button 
                  onClick={handleSend}
                  disabled={(!message.trim() && !pendingImage) || sendMessage.isPending || isUploading}
                  size="icon"
                  className={cn(
                    "w-8 h-8 flex-shrink-0",
                    activeTab === "private" && "bg-gold hover:bg-gold/80"
                  )}
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
            : "bg-gradient-to-br from-primary to-accent-foreground hover:from-primary/80 hover:to-accent-foreground/80"
        )}
        whileTap={{ scale: 0.95 }}
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-foreground" />
        ) : (
          <MessageCircle className="w-5 h-5 text-white" />
        )}
        {!isExpanded && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </motion.button>
    </div>
  );
}
