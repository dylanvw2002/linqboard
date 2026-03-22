import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle, User, Trash2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import mascot from "@/assets/linqboard-mascot-new.png";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at: string;
  user_id?: string;
  user_name?: string;
  user_avatar?: string;
}

interface DMMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface OrgMember {
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
}

interface FixedChatWidgetProps {
  boardId: string;
  boardName: string;
  organizationId?: string;
  orgMembers?: OrgMember[];
}

type ChatTarget = { type: "ai" } | { type: "dm"; member: OrgMember };

export const FixedChatWidget = ({ boardId, boardName, organizationId, orgMembers = [] }: FixedChatWidgetProps) => {
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [dmMessages, setDmMessages] = useState<DMMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatTarget, setChatTarget] = useState<ChatTarget>({ type: "ai" });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ name: string; avatar: string | null } | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", session.user.id).single();
        if (profile) setCurrentUserProfile({ name: profile.full_name, avatar: profile.avatar_url });
      }
    };
    getUser();
  }, []);

  // Fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    if (!currentUserId) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("sender_id")
      .eq("receiver_id", currentUserId)
      .eq("is_read", false);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((m: any) => {
        counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isExpanded && currentUserId) fetchUnreadCounts();
  }, [isExpanded, currentUserId, fetchUnreadCounts]);

  // Load AI messages
  const loadAiMessages = useCallback(async () => {
    if (!currentUserId) return;
    const { data, error } = await supabase
      .from("widget_chat_messages")
      .select("role, content, created_at, user_id")
      .eq("widget_id", `fixed-${boardId}`)
      .eq("is_private", true)
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: true });
    if (error) return;
    const userIds = [...new Set(data?.map(m => m.user_id).filter(Boolean))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, { name: p.full_name, avatar: p.avatar_url }]));
    setAiMessages((data || []).map((msg: any) => ({
      role: msg.role, content: msg.content, created_at: msg.created_at,
      user_id: msg.user_id,
      user_name: msg.user_id ? profileMap.get(msg.user_id)?.name || "Gebruiker" : undefined,
      user_avatar: msg.user_id ? profileMap.get(msg.user_id)?.avatar : undefined,
    })));
  }, [boardId, currentUserId]);

  // Load DM messages
  const loadDmMessages = useCallback(async (memberId: string) => {
    if (!currentUserId) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${memberId}),and(sender_id.eq.${memberId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });
    if (data) setDmMessages(data as DMMessage[]);

    // Mark as read
    await supabase
      .from("direct_messages")
      .update({ is_read: true } as any)
      .eq("sender_id", memberId)
      .eq("receiver_id", currentUserId)
      .eq("is_read", false);

    setUnreadCounts(prev => ({ ...prev, [memberId]: 0 }));
  }, [currentUserId]);

  // Load messages when target changes
  useEffect(() => {
    if (!isExpanded) return;
    if (chatTarget.type === "ai") loadAiMessages();
    else loadDmMessages(chatTarget.member.user_id);
  }, [chatTarget, isExpanded, loadAiMessages, loadDmMessages]);

  // Realtime subscriptions
  useEffect(() => {
    if (!isExpanded || !currentUserId) return;

    const channels: any[] = [];

    if (chatTarget.type === "ai") {
      const ch = supabase.channel(`fixed-chat-ai-${boardId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "widget_chat_messages", filter: `widget_id=eq.fixed-${boardId}` }, () => loadAiMessages())
        .subscribe();
      channels.push(ch);
    } else {
      const memberId = chatTarget.member.user_id;
      const ch = supabase.channel(`dm-${currentUserId}-${memberId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload: any) => {
          const msg = payload.new;
          if ((msg.sender_id === currentUserId && msg.receiver_id === memberId) ||
              (msg.sender_id === memberId && msg.receiver_id === currentUserId)) {
            loadDmMessages(memberId);
          }
        })
        .subscribe();
      channels.push(ch);
    }

    // Also listen for new DMs for unread counts
    const unreadCh = supabase.channel(`dm-unread-${currentUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${currentUserId}` }, () => {
        fetchUnreadCounts();
      })
      .subscribe();
    channels.push(unreadCh);

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [isExpanded, chatTarget, currentUserId, boardId, loadAiMessages, loadDmMessages, fetchUnreadCounts]);

  // Auto scroll
  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        const sv = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
        if (sv) sv.scrollTop = sv.scrollHeight;
      }
    }, 50);
  }, [aiMessages, dmMessages, isLoading]);

  const clearAiChat = async () => {
    if (!currentUserId) return;
    await supabase.from("widget_chat_messages").delete().eq("widget_id", `fixed-${boardId}`).eq("user_id", currentUserId).eq("is_private", true);
    setAiMessages([]);
    toast.success("Chat gewist");
  };

  const sendAiMessage = async () => {
    if (!input.trim() || isLoading || !currentUserId) return;
    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const tempMsg: Message = { role: "user", content: userMessage, created_at: new Date().toISOString(), user_id: currentUserId, user_name: currentUserProfile?.name, user_avatar: currentUserProfile?.avatar };
      setAiMessages(prev => [...prev, tempMsg]);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-widget`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ widgetId: `fixed-${boardId}`, message: userMessage, userName: currentUserProfile?.name || "Gebruiker", isPrivate: true }),
      });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setAiMessages(prev => [...prev, { role: "assistant", content: data.message, created_at: new Date().toISOString() }]);
    } catch {
      toast.error("Kon bericht niet verzenden");
      loadAiMessages();
    } finally {
      setIsLoading(false);
    }
  };

  const sendDmMessage = async () => {
    if (!input.trim() || !currentUserId || chatTarget.type !== "dm" || !organizationId) return;
    const content = input.trim();
    setInput("");
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: currentUserId,
      receiver_id: chatTarget.member.user_id,
      organization_id: organizationId,
      content,
    } as any);
    if (error) { toast.error("Kon bericht niet verzenden"); }
  };

  const handleSend = () => {
    if (chatTarget.type === "ai") sendAiMessage();
    else sendDmMessage();
  };

  const otherMembers = orgMembers.filter(m => m.user_id !== currentUserId);

  if (!isExpanded) {
    return (
      <button onClick={() => setIsExpanded(true)} className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center">
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  const renderMessageBubble = (msg: { role: string; content: string; senderName?: string; senderAvatar?: string | null; isMe: boolean }, idx: number) => (
    <div key={idx} className={`flex gap-2 ${msg.isMe ? "justify-end" : "justify-start"}`}>
      {!msg.isMe && (
        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
          {msg.role === "assistant" ? (
            <img src={mascot} alt="AI" className="w-full h-full object-cover object-top" />
          ) : msg.senderAvatar ? (
            <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center"><User className="w-3 h-3" /></div>
          )}
        </div>
      )}
      <div className="flex flex-col gap-0.5 max-w-[75%]">
        {!msg.isMe && <span className="text-[10px] text-muted-foreground px-1">{msg.senderName}</span>}
        <div className={`rounded-lg px-3 py-2 text-sm ${msg.isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          {msg.content}
        </div>
      </div>
      {msg.isMe && (
        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
          {currentUserProfile?.avatar ? (
            <img src={currentUserProfile.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center"><User className="w-3 h-3 text-primary-foreground" /></div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[420px] h-[520px] flex overflow-hidden rounded-2xl shadow-2xl border border-border/60 bg-card dark:bg-card">
      {/* Contacts sidebar */}
      <div className="w-16 bg-muted/50 dark:bg-muted/30 border-r border-border/40 flex flex-col items-center py-4 gap-2 overflow-y-auto">
        {/* AI contact */}
        <button
          onClick={() => setChatTarget({ type: "ai" })}
          className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${chatTarget.type === "ai" ? "bg-primary/15 ring-2 ring-primary shadow-sm" : "hover:bg-muted opacity-70 hover:opacity-100"}`}
          title="Linq AI"
        >
          <img src={mascot} alt="AI" className="w-8 h-8 object-contain" />
        </button>

        {otherMembers.length > 0 && (
          <div className="w-8 h-px bg-border/60 my-1" />
        )}

        {/* Team members */}
        {otherMembers.map(member => (
          <button
            key={member.user_id}
            onClick={() => setChatTarget({ type: "dm", member })}
            className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${chatTarget.type === "dm" && chatTarget.member.user_id === member.user_id ? "bg-primary/15 ring-2 ring-primary shadow-sm" : "hover:bg-muted opacity-70 hover:opacity-100"}`}
            title={member.full_name}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] font-medium bg-secondary text-secondary-foreground">
                {member.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {(unreadCounts[member.user_id] || 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                {unreadCounts[member.user_id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border/40 bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            {chatTarget.type === "ai" ? (
              <>
                <img src={mascot} alt="AI" className="h-8 object-contain" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground">Linq AI</span>
                  <span className="text-[10px] text-muted-foreground">Altijd beschikbaar</span>
                </div>
              </>
            ) : (
              <>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={chatTarget.member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{chatTarget.member.full_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground truncate">{chatTarget.member.full_name}</span>
                  <span className="text-[10px] text-muted-foreground">Teamlid</span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {chatTarget.type === "ai" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Chat wissen?</AlertDialogTitle>
                    <AlertDialogDescription>Dit verwijdert al jouw berichten met Linq. Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction onClick={clearAiChat}>Wissen</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsExpanded(false)}>
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
          <div className="space-y-3">
            {chatTarget.type === "ai" ? (
              <>
                {aiMessages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <img src={mascot} alt="Linq" className="h-16 opacity-60" />
                    <p className="text-muted-foreground text-xs text-center">Start een gesprek met Linq!</p>
                  </div>
                )}
                {aiMessages.map((msg, i) => renderMessageBubble({
                  role: msg.role,
                  content: msg.content,
                  senderName: msg.role === "assistant" ? "Linq" : msg.user_name,
                  senderAvatar: msg.role === "assistant" ? null : msg.user_avatar,
                  isMe: msg.role === "user",
                }, i))}
              </>
            ) : (
              <>
                {dmMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={chatTarget.member.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">{chatTarget.member.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-muted-foreground text-xs text-center">Begin een gesprek met {chatTarget.member.full_name}!</p>
                  </div>
                )}
                {dmMessages.map((msg, i) => {
                  const isMe = msg.sender_id === currentUserId;
                  const sender = isMe ? currentUserProfile : { name: chatTarget.member.full_name, avatar: chatTarget.member.avatar_url };
                  return renderMessageBubble({
                    role: "user",
                    content: msg.content,
                    senderName: sender?.name || "Gebruiker",
                    senderAvatar: sender?.avatar || null,
                    isMe,
                  }, i);
                })}
              </>
            )}
            {isLoading && chatTarget.type === "ai" && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <img src={mascot} alt="AI" className="w-full h-full object-cover object-top" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <div className="flex gap-1"><span className="animate-bounce">●</span><span className="animate-bounce delay-100">●</span><span className="animate-bounce delay-200">●</span></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border/40 bg-muted/20">
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={chatTarget.type === "ai" ? "Stel een vraag..." : `Bericht aan ${chatTarget.member.full_name}...`}
              disabled={isLoading}
              className="flex-1 h-9 text-sm bg-background border-border/50 focus-visible:ring-primary/30"
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
