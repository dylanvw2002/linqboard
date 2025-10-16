import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at: string;
  user_id?: string;
  user_name?: string;
}

interface ChatWidgetProps {
  widgetId: string;
  boardName: string;
  widgetMode: 'general' | 'private';
  onModeChange: (mode: 'general' | 'private') => void;
}

export const ChatWidget = ({ widgetId, boardName, widgetMode, onModeChange }: ChatWidgetProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    // Set up realtime subscription for chat messages
    const channel = supabase
      .channel(`widget-chat-${widgetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'widget_chat_messages',
          filter: `widget_id=eq.${widgetId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [widgetId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("widget_chat_messages")
        .select("role, content, created_at, user_id")
        .eq("widget_id", widgetId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Get unique user IDs
      const userIds = [...new Set(data?.map(m => m.user_id).filter(Boolean))];
      
      // Fetch user profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));
      
      const messagesWithNames = (data || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
        user_id: msg.user_id,
        user_name: msg.user_id ? profileMap.get(msg.user_id) || 'Gebruiker' : undefined
      }));
      
      setMessages(messagesWithNames as Message[]);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get user profile for display name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
        .single();

      const userName = profile?.full_name || 'Gebruiker';

      // Optimistically add user message
      const tempUserMessage: Message = {
        role: "user",
        content: userMessage,
        created_at: new Date().toISOString(),
        user_id: session.user.id,
        user_name: userName
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-widget`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            widgetId,
            message: userMessage,
            userName
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Kon bericht niet verzenden");
      // Reload messages to get correct state
      loadMessages();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative backdrop-blur-[60px] bg-white/25 dark:bg-card/25 border-2 border-white/40 dark:border-white/20 rounded-[28px] shadow-[0_8px_24px_rgba(2,6,23,0.08)] before:absolute before:inset-0 before:rounded-[28px] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[27px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none">
      <div className="flex items-center justify-between p-3 border-b border-white/30 dark:border-white/20 bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-[26px] relative z-10">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">{boardName} Assistent</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange(widgetMode === 'general' ? 'private' : 'general')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              widgetMode === 'general'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            {widgetMode === 'general' ? '👥 Algemeen' : '🔒 Privé'}
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 relative z-10" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              Start een gesprek met de AI assistent!
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-2 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex flex-col gap-1 max-w-[80%]">
                {message.role === "user" && message.user_name && (
                  <span className="text-xs text-muted-foreground px-1">
                    {message.user_name}
                  </span>
                )}
                <div
                  className={`rounded-lg p-3 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </div>
              {message.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="bg-muted rounded-lg p-3 text-sm">
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/30 dark:border-white/20 relative z-10 rounded-b-[26px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Stel een vraag..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
