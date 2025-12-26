import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCampaignMessages, useSendMessage, CampaignMessage } from "@/hooks/useChat";
import { useCampaignImageUpload } from "@/hooks/useCampaignImageUpload";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageCircle, 
  Send, 
  Loader2,
  ImagePlus,
  X,
  Lock,
  Users,
  Reply,
  CornerDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface CampaignChatSheetProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RecipientOption {
  id: string | null;
  name: string;
  isPrivate: boolean;
}

interface TypingUser {
  odigo: string;
  name: string;
  isTyping: boolean;
}

export function CampaignChatSheet({ campaignId, open, onOpenChange }: CampaignChatSheetProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientOption>({ 
    id: null, 
    name: "Todos", 
    isPrivate: false 
  });
  const [replyingTo, setReplyingTo] = useState<CampaignMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { data: messages, isLoading } = useCampaignMessages(campaignId);
  const { data: players } = useCampaignPlayers(campaignId);
  const sendMessage = useSendMessage();
  const { uploadImage, isUploading, progress } = useCampaignImageUpload();

  // Get current user's display name
  const currentUserName = players?.find(p => p.user_id === user?.id)?.profile?.display_name || 'Você';

  // Build recipient options from players
  const recipientOptions: RecipientOption[] = [
    { id: null, name: "Todos", isPrivate: false },
    ...(players || [])
      .filter(p => p.user_id !== user?.id)
      .map(p => ({
        id: p.user_id,
        name: p.profile?.display_name || 'Jogador',
        isPrivate: true,
      }))
  ];

  // Setup presence channel for typing indicators
  useEffect(() => {
    if (!open || !campaignId || !user) return;

    const channel = supabase.channel(`typing-${campaignId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newTypingUsers = new Map<string, string>();
        
        Object.entries(state).forEach(([odigo, presences]) => {
          const presence = (presences as any[])[0];
          if (presence?.isTyping && odigo !== user.id) {
            newTypingUsers.set(odigo, presence.name || 'Alguém');
          }
        });
        
        setTypingUsers(newTypingUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            isTyping: false,
            name: currentUserName,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [open, campaignId, user, currentUserName]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!channelRef.current) return;

    // Update presence to show typing
    channelRef.current.track({
      isTyping: true,
      name: currentUserName,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.track({
          isTyping: false,
          name: currentUserName,
        });
      }
    }, 2000);
  }, [currentUserName]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when sheet opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

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

    // Stop typing indicator
    if (channelRef.current) {
      channelRef.current.track({
        isTyping: false,
        name: currentUserName,
      });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    let content = message.trim();
    
    // If there's an image, upload it first
    if (pendingImage) {
      const imageUrl = await uploadImage(pendingImage.file, { 
        folder: `chat/${campaignId}`,
        maxSizeKB: 500 
      });
      if (imageUrl) {
        // Append image URL to message
        content = content ? `${content}\n[img]${imageUrl}[/img]` : `[img]${imageUrl}[/img]`;
      }
      setPendingImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    if (!content) return;

    setMessage("");
    setReplyingTo(null);
    await sendMessage.mutateAsync({
      campaignId,
      content,
      recipientId: selectedRecipient.id || undefined,
      replyToId: replyingTo?.id,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    }
  };

  const groupMessagesByDate = (messages: CampaignMessage[]) => {
    const groups: { date: string; messages: CampaignMessage[] }[] = [];
    let currentDate = "";

    messages.forEach(msg => {
      const msgDate = format(new Date(msg.created_at), "yyyy-MM-dd");
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === format(today, "yyyy-MM-dd")) return "Hoje";
    if (dateStr === format(yesterday, "yyyy-MM-dd")) return "Ontem";
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  // Parse message content to extract images
  const parseMessageContent = (content: string) => {
    const imgRegex = /\[img\](.*?)\[\/img\]/g;
    const parts: { type: 'text' | 'image'; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      // Add text before the image
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index).trim();
        if (text) {
          parts.push({ type: 'text', content: text });
        }
      }
      // Add the image
      parts.push({ type: 'image', content: match[1] });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const text = content.slice(lastIndex).trim();
      if (text) {
        parts.push({ type: 'text', content: text });
      }
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
  };

  const messageGroups = groupMessagesByDate(messages || []);

  // Format typing users text
  const typingText = () => {
    const names = Array.from(typingUsers.values());
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} está digitando...`;
    if (names.length === 2) return `${names[0]} e ${names[1]} estão digitando...`;
    return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]} estão digitando...`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <SheetTitle className="text-xl">Chat da Mesa</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {messages?.length || 0} mensagens
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma mensagem</h3>
              <p className="text-sm text-muted-foreground">
                Seja o primeiro a enviar uma mensagem!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messageGroups.map(group => (
                <div key={group.date}>
                  {/* Date Header */}
                  <div className="flex justify-center mb-4">
                    <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                      {formatDateHeader(group.date)}
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="space-y-2">
                    {group.messages.map(msg => {
                      const isOwn = msg.user_id === user?.id;
                      const isPrivate = !!msg.recipient_id;
                      const parts = parseMessageContent(msg.content);
                      const replyContent = msg.reply_to?.content 
                        ? msg.reply_to.content.replace(/\[img\].*?\[\/img\]/g, '📷 Imagem').slice(0, 50) + (msg.reply_to.content.length > 50 ? '...' : '')
                        : null;

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex group",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          {/* Reply button - left side for own messages */}
                          {isOwn && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity mr-1 self-center"
                              onClick={() => {
                                setReplyingTo(msg);
                                inputRef.current?.focus();
                              }}
                            >
                              <Reply className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2 relative",
                              isPrivate 
                                ? isOwn 
                                  ? "bg-purple-600 text-white rounded-br-sm" 
                                  : "bg-purple-500/20 text-foreground rounded-bl-sm border border-purple-500/30"
                                : isOwn
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm"
                            )}
                          >
                            {/* Reply quote */}
                            {msg.reply_to && replyContent && (
                              <div className={cn(
                                "flex items-start gap-1.5 mb-2 pb-2 border-b text-[11px]",
                                isOwn 
                                  ? "border-white/20" 
                                  : isPrivate 
                                    ? "border-purple-500/30" 
                                    : "border-border"
                              )}>
                                <CornerDownRight className={cn(
                                  "w-3 h-3 mt-0.5 flex-shrink-0",
                                  isOwn ? "text-white/60" : "text-muted-foreground"
                                )} />
                                <div className="min-w-0">
                                  <span className={cn(
                                    "font-semibold",
                                    isOwn ? "text-white/80" : "text-primary"
                                  )}>
                                    {msg.reply_to.profile?.display_name || 'Jogador'}
                                  </span>
                                  <p className={cn(
                                    "truncate",
                                    isOwn ? "text-white/60" : "text-muted-foreground"
                                  )}>
                                    {replyContent}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Private message indicator */}
                            {isPrivate && (
                              <div className={cn(
                                "flex items-center gap-1 text-[10px] mb-1",
                                isOwn ? "text-white/70" : "text-purple-400"
                              )}>
                                <Lock className="w-3 h-3" />
                                {isOwn 
                                  ? `Para ${msg.recipient_profile?.display_name || 'Jogador'}`
                                  : 'Mensagem privada'
                                }
                              </div>
                            )}
                            {!isOwn && (
                              <p className={cn(
                                "text-xs font-semibold mb-1",
                                isPrivate ? "text-purple-400" : "text-primary"
                              )}>
                                {msg.profile?.display_name || 'Jogador'}
                              </p>
                            )}
                            <div className="space-y-2">
                              {parts.map((part, idx) => (
                                part.type === 'image' ? (
                                  <img 
                                    key={idx}
                                    src={part.content} 
                                    alt="Imagem" 
                                    className="rounded-lg max-w-full cursor-pointer"
                                    onClick={() => window.open(part.content, '_blank')}
                                  />
                                ) : (
                                  <p key={idx} className="text-sm whitespace-pre-wrap break-words">
                                    {part.content}
                                  </p>
                                )
                              ))}
                            </div>
                            <p className={cn(
                              "text-[10px] mt-1",
                              isPrivate 
                                ? isOwn ? "text-white/70" : "text-purple-400/70"
                                : isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {format(new Date(msg.created_at), "HH:mm")}
                            </p>
                          </div>

                          {/* Reply button - right side for others' messages */}
                          {!isOwn && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity ml-1 self-center"
                              onClick={() => {
                                setReplyingTo(msg);
                                inputRef.current?.focus();
                              }}
                            >
                              <Reply className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{typingText()}</span>
            </div>
          </div>
        )}

        {/* Reply indicator */}
        {replyingTo && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 border-l-4 border-primary">
              <Reply className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary">
                  Respondendo a {replyingTo.profile?.display_name || 'Jogador'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {replyingTo.content.replace(/\[img\].*?\[\/img\]/g, '📷 Imagem').slice(0, 60)}
                  {replyingTo.content.length > 60 ? '...' : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 flex-shrink-0"
                onClick={() => setReplyingTo(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Pending Image Preview */}
        {pendingImage && (
          <div className="px-4 pb-2">
            <div className="relative inline-block">
              <img 
                src={pendingImage.preview} 
                alt="Preview" 
                className="h-20 rounded-lg object-cover"
              />
              {isUploading ? (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              ) : (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 w-6 h-6"
                  onClick={removePendingImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Recipient selector badge */}
        {selectedRecipient.isPrivate && (
          <div className="px-4 pb-2">
            <Badge 
              variant="secondary" 
              className="bg-purple-500/20 text-purple-400 border-purple-500/30 gap-1"
            >
              <Lock className="w-3 h-3" />
              Mensagem privada para {selectedRecipient.name}
              <button 
                onClick={() => setSelectedRecipient({ id: null, name: "Todos", isPrivate: false })}
                className="ml-1 hover:text-purple-200"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <div className="flex gap-2">
            {/* Recipient Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    selectedRecipient.isPrivate && "text-purple-400 bg-purple-500/10"
                  )}
                >
                  {selectedRecipient.isPrivate ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem 
                  onClick={() => setSelectedRecipient({ id: null, name: "Todos", isPrivate: false })}
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  Todos
                  {!selectedRecipient.isPrivate && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                  Mensagem privada para:
                </div>
                {recipientOptions.filter(o => o.isPrivate).map(option => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => setSelectedRecipient(option)}
                    className="gap-2"
                  >
                    <Lock className="w-4 h-4 text-purple-400" />
                    {option.name}
                    {selectedRecipient.id === option.id && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || sendMessage.isPending}
            >
              <ImagePlus className="w-5 h-5" />
            </Button>
            <Input
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={selectedRecipient.isPrivate 
                ? `Mensagem privada para ${selectedRecipient.name}...` 
                : "Digite sua mensagem..."
              }
              className={cn(
                "flex-1",
                selectedRecipient.isPrivate && "border-purple-500/30 focus-visible:ring-purple-500/50"
              )}
              disabled={isUploading}
            />
            <Button 
              onClick={handleSend}
              disabled={(!message.trim() && !pendingImage) || sendMessage.isPending || isUploading}
              size="icon"
              className={cn(
                selectedRecipient.isPrivate && "bg-purple-600 hover:bg-purple-700"
              )}
            >
              {sendMessage.isPending || isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
