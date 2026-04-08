import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadAllProfiles();
    }
  }, [user]);

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
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participants?.length) return;

    const convoIds = participants.map((p) => p.conversation_id);
    const { data: otherParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convoIds)
      .neq("user_id", user.id);

    const otherUserIds = otherParticipants?.map((p) => p.user_id) || [];
    const { data: profiles } = otherUserIds.length
      ? await supabase.from("profiles").select("user_id, display_name, avatar_url, category").in("user_id", otherUserIds)
      : { data: [] };

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
    const participantMap = new Map(otherParticipants?.map((p) => [p.conversation_id, p.user_id]) || []);

    setConversations(
      convoIds.map((id) => ({
        id,
        created_at: "",
        other_user: profileMap.get(participantMap.get(id) || "") as any,
      }))
    );
  };

  const loadMessages = async (convoId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const loadAllProfiles = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").neq("user_id", user.id);
    if (data) setAllProfiles(data);
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) return;
    // Create conversation
    const { data: convo } = await supabase.from("conversations").insert({}).select().single();
    if (!convo) return;
    
    await supabase.from("conversation_participants").insert([
      { conversation_id: convo.id, user_id: user.id },
      { conversation_id: convo.id, user_id: otherUserId },
    ]);

    setShowNewChat(false);
    setActiveConvo(convo.id);
    loadConversations();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo || !user) return;
    await supabase.from("messages").insert({
      conversation_id: activeConvo,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  const activeConvoData = conversations.find((c) => c.id === activeConvo);
  const categoryBadge: Record<string, string> = { has_means: "🚗", needs_ride: "🙋", has_both: "👑" };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {!activeConvo ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Messages</h2>
            <Button size="icon" variant="ghost" onClick={() => setShowNewChat(true)}>
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {showNewChat ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Start a chat with:</h3>
              {allProfiles.map((profile) => (
                <button
                  key={profile.user_id}
                  onClick={() => startConversation(profile.user_id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {profile.display_name?.[0]?.toUpperCase() || "?"}
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
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
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
          <div className="p-4 border-t border-border flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage} size="icon" className="gradient-sunset text-primary-foreground">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
