import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  created_at: string;
  other_user?: { display_name: string; avatar_url: string | null; category: string };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

type QuickMessageGroup = {
  title: string;
  chipClass: string;
  messages: string[];
};

const quickMessageGroups: QuickMessageGroup[] = [
  {
    title: "Availability ⏰",
    chipClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/30",
    messages: ["⏰ Free now?", "👀 Available?", "📅 Today?", "🌙 Tonight?", "🤔 Busy?"],
  },
  {
    title: "Invite 🤝",
    chipClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-400/30",
    messages: ["➕ Join me", "🤝 Link up", "😎 Hang out?", "🚶 Come along", "🎉 Let’s go"],
  },
  {
    title: "Activity 🍔",
    chipClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30",
    messages: ["🍔 Grab food", "☕ Coffee?", "🎬 Movie?", "🚗 Drive?", "📚 Study?"],
  },
  {
    title: "Explore 🌍",
    chipClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30",
    messages: ["🌍 Go out", "✨ Explore", "🏞️ Adventure?", "🚶‍♂️ Walk?", "🌅 Catch a vibe"],
  },
  {
    title: "Plan 📍",
    chipClass: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-400/30",
    messages: ["📍 Pick a place", "🕒 Set time", "❓ Where to?", "🗓️ When free?", "⚡ Quick plan"],
  },
  {
    title: "Confirm ✅",
    chipClass: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-400/30",
    messages: ["✅ I’m in", "👍 Sounds good", "🚀 Let’s go", "🏃 On my way", "❌ Can’t make it"],
  },
];

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [creatingConversationFor, setCreatingConversationFor] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const statusColors: Record<string, string> = {
    available: "bg-green-500",
    planning: "bg-amber-500",
    busy: "bg-muted-foreground",
  };

  useEffect(() => {
    if (user) {
      loadConversations();
      loadAllProfiles();
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.conversationId) {
      setActiveConvo(location.state.conversationId);
      // Clear state so it doesn't stay if we navigate away and back
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!activeConvo) return;
    loadMessages(activeConvo);

    const channel = supabase
      .channel(`messages-${activeConvo}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvo}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    setLoadingConversations(true);
    const { data: participants, error: participantsError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (participantsError) {
      toast({ title: "Could not load conversations", description: participantsError.message, variant: "destructive" });
      setLoadingConversations(false);
      return;
    }

    if (!participants?.length) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    const convoIds = participants.map((p) => p.conversation_id);
    const { data: otherParticipants, error: othersError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convoIds)
      .neq("user_id", user.id);

    if (othersError) {
      toast({ title: "Could not load conversation participants", description: othersError.message, variant: "destructive" });
      setLoadingConversations(false);
      return;
    }

    const otherUserIds = otherParticipants?.map((p) => p.user_id) || [];
    const { data: profiles, error: profilesError } = otherUserIds.length
      ? await supabase.from("profiles").select("user_id, display_name, avatar_url, category").in("user_id", otherUserIds)
      : { data: [], error: null };

    if (profilesError) {
      toast({ title: "Could not load user profiles", description: profilesError.message, variant: "destructive" });
      setLoadingConversations(false);
      return;
    }

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p] as const));
    const participantMap = new Map((otherParticipants || []).map((p) => [p.conversation_id, p.user_id] as const));

    setConversations(
      convoIds.map((id) => ({
        id,
        created_at: "",
        other_user: profileMap.get(participantMap.get(id) || "") as any,
      }))
    );
    setLoadingConversations(false);
  };

  const loadMessages = async (convoId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Could not load messages", description: error.message, variant: "destructive" });
      return;
    }
    if (data) setMessages(data);
  };

  const loadAllProfiles = async () => {
    if (!user) return;
    setLoadingProfiles(true);
    const { data, error } = await supabase.from("profiles").select("*").neq("user_id", user.id);
    if (error) {
      toast({ title: "Could not load profiles", description: error.message, variant: "destructive" });
      setLoadingProfiles(false);
      return;
    }
    if (data) setAllProfiles(data);
    setLoadingProfiles(false);
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) return;
    setCreatingConversationFor(otherUserId);
    
    // Check if conversation already exists
    const { data: myConvos, error: myConvosError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);
    if (myConvosError) {
      toast({ title: "Could not start chat", description: myConvosError.message, variant: "destructive" });
      setCreatingConversationFor(null);
      return;
    }

    const { data: theirConvos, error: theirConvosError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId);
    if (theirConvosError) {
      toast({ title: "Could not start chat", description: theirConvosError.message, variant: "destructive" });
      setCreatingConversationFor(null);
      return;
    }

    const myIds = new Set(myConvos?.map(c => c.conversation_id) || []);
    const commonConvo = theirConvos?.find(c => myIds.has(c.conversation_id));

    if (commonConvo) {
      setShowNewChat(false);
      setActiveConvo(commonConvo.conversation_id);
      setCreatingConversationFor(null);
      return;
    }

    // Create conversation
    const { data: convo, error: createConvoError } = await supabase.from("conversations").insert({}).select().single();
    if (createConvoError || !convo) {
      toast({
        title: "Could not create conversation",
        description: createConvoError?.message || "Conversation creation was blocked.",
        variant: "destructive",
      });
      setCreatingConversationFor(null);
      return;
    }
    
    // Insert self first so RLS checks for adding other participants can pass reliably.
    const { error: addSelfError } = await supabase
      .from("conversation_participants")
      .insert({ conversation_id: convo.id, user_id: user.id });
    if (addSelfError) {
      toast({ title: "Could not initialize conversation", description: addSelfError.message, variant: "destructive" });
      setCreatingConversationFor(null);
      return;
    }

    const { error: addOtherError } = await supabase
      .from("conversation_participants")
      .insert({ conversation_id: convo.id, user_id: otherUserId });
    if (addOtherError) {
      toast({ title: "Could not add participant", description: addOtherError.message, variant: "destructive" });
      setCreatingConversationFor(null);
      return;
    }

    setShowNewChat(false);
    setActiveConvo(convo.id);
    loadConversations();
    setCreatingConversationFor(null);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo || !user || sendingMessage) return;
    setSendingMessage(true);
    const content = newMessage.trim();
    const { data, error } = await supabase.from("messages").insert({
      conversation_id: activeConvo,
      sender_id: user.id,
      content,
    }).select("*").single();

    if (error) {
      toast({ title: "Message failed to send", description: error.message, variant: "destructive" });
      setSendingMessage(false);
      return;
    }

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
    }
    setNewMessage("");
    setSendingMessage(false);
  };

  const sendQuickMessage = async (content: string) => {
    if (!content || !activeConvo || !user || sendingMessage) return;
    setSendingMessage(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: activeConvo,
        sender_id: user.id,
        content,
      })
      .select("*")
      .single();

    if (error) {
      toast({ title: "Message failed to send", description: error.message, variant: "destructive" });
      setSendingMessage(false);
      return;
    }

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
    }
    setSendingMessage(false);
  };

  const activeConvoData = conversations.find((c) => c.id === activeConvo);
  const categoryBadge: Record<string, string> = { has_means: "🚗", needs_ride: "🙋", has_both: "👑" };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-background pb-16">
      {!activeConvo ? (
        <div className="flex-1 flex flex-col">
          <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-border bg-background">
            <h2 className="text-lg font-bold text-foreground">Messages</h2>
            <Button size="icon" variant="ghost" onClick={() => setShowNewChat(!showNewChat)} className="relative z-30" style={{ touchAction: "manipulation" }}>
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {showNewChat ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Start a chat with:</h3>
                <button onClick={() => setShowNewChat(false)} className="text-xs text-primary font-medium">Cancel</button>
              </div>
              {loadingProfiles && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {allProfiles.map((profile) => (
                <button
                  key={profile.user_id}
                  onClick={() => startConversation(profile.user_id)}
                  disabled={creatingConversationFor === profile.user_id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground font-bold text-sm relative">
                    {profile.display_name?.[0]?.toUpperCase() || "?"}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background z-20 ${statusColors[profile.availability_status || "available"] || statusColors.available}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{profile.display_name}</p>
                    <p className="text-xs text-muted-foreground">{profile.fun_fact || "Ready for adventure!"}</p>
                  </div>
                  <span className="text-lg">{categoryBadge[profile.category] || ""}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pb-24">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <p className="text-muted-foreground">No conversations yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Tap + to start chatting with fellow travelers</p>
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setActiveConvo(convo.id)}
                    className="w-full flex items-center gap-3 p-4 border-b border-border hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground font-bold">
                      {convo.other_user?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{convo.other_user?.display_name || "Traveler"}</p>
                      <p className="text-xs text-muted-foreground">Tap to chat</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <button onClick={() => setActiveConvo(null)}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="w-8 h-8 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground font-bold text-xs">
              {activeConvoData?.other_user?.display_name?.[0]?.toUpperCase() || "?"}
            </div>
            <p className="font-semibold text-foreground">{activeConvoData?.other_user?.display_name || "Traveler"}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  msg.sender_id === user?.id
                    ? "gradient-sunset text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border space-y-3 bg-background/95 backdrop-blur-sm">
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {quickMessageGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground">{group.title}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {group.messages.map((message) => (
                      <button
                        key={message}
                        onClick={() => sendQuickMessage(message)}
                        disabled={sendingMessage}
                        className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-opacity hover:opacity-85 disabled:opacity-60 ${group.chipClass}`}
                      >
                        {message}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage} size="icon" className="gradient-sunset text-primary-foreground" disabled={sendingMessage || !newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
