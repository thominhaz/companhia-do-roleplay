import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCampaignMessages, useSendMessage, CampaignMessage } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageCircle, 
  Send, 
  Loader2,
  Trash2
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading } = useCampaignMessages(campaignId);
  const sendMessage = useSendMessage();

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

  const handleSend = async () => {
    if (!message.trim()) return;

    const content = message.trim();
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
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
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

        {/* Input Area */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1"
            />
            <Button 
              onClick={handleSend}
              disabled={!message.trim() || sendMessage.isPending}
              size="icon"
            >
              {sendMessage.isPending ? (
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
