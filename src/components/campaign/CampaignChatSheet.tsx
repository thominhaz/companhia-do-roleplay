import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCampaignMessages, useSendMessage, CampaignMessage } from "@/hooks/useChat";
import { useCampaignImageUpload } from "@/hooks/useCampaignImageUpload";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageCircle, 
  Send, 
  Loader2,
  ImagePlus,
  X
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

interface CampaignChatSheetProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignChatSheet({ campaignId, open, onOpenChange }: CampaignChatSheetProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading } = useCampaignMessages(campaignId);
  const sendMessage = useSendMessage();
  const { uploadImage, isUploading, progress } = useCampaignImageUpload();

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
    await sendMessage.mutateAsync({
      campaignId,
      content,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
                      const parts = parseMessageContent(msg.content);

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            )}
                          >
                            {!isOwn && (
                              <p className="text-xs font-semibold mb-1 text-primary">
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
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {format(new Date(msg.created_at), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              disabled={isUploading}
            />
            <Button 
              onClick={handleSend}
              disabled={(!message.trim() && !pendingImage) || sendMessage.isPending || isUploading}
              size="icon"
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
