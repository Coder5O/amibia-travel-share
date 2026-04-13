import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, MapPin, MessageCircle, Send, Flag, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  location_name: string | null;
  likes_count: number;
  created_at: string;
  profile?: { display_name: string; avatar_url: string | null; category: string };
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: { display_name: string };
}

const categoryBadge: Record<string, string> = {
  has_means: "🚗 Has Means",
  needs_ride: "🙋 Needs Means",
  has_both: "👑 Has Both",
};

export default function PostFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
    if (user) loadLikes();
  }, [user]);

  const loadPosts = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20);
    if (data) {
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url, category").in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      setPosts(data.map((p) => ({ ...p, profile: profileMap.get(p.user_id) as any })));
    }
  };

  const loadLikes = async () => {
    if (!user) return;
    const { data } = await supabase.from("likes").select("post_id").eq("user_id", user.id);
    if (data) setLikedPosts(new Set(data.map((l) => l.post_id)));
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const liked = likedPosts.has(postId);
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId);
      setLikedPosts((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p));
    } else {
      await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
      setLikedPosts((prev) => new Set(prev).add(postId));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const loadComments = async (postId: string) => {
    const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    if (data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = userIds.length ? await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds) : { data: [] };
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p] as const));
      setCommentsMap((prev) => ({ ...prev, [postId]: data.map((c) => ({ ...c, profile: profileMap.get(c.user_id) as any })) }));
    }
  };

  const toggleComments = (postId: string) => {
    if (showComments === postId) {
      setShowComments(null);
    } else {
      setShowComments(postId);
      if (!commentsMap[postId]) loadComments(postId);
    }
  };

  const postComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;
    await supabase.from("comments").insert({ post_id: postId, user_id: user.id, content: newComment.trim() });
    setNewComment("");
    loadComments(postId);
  };

  const reportPost = (postId: string) => {
    toast({ title: "Post reported", description: "We'll review this content." });
    setShowMenu(null);
  };

  if (posts.length === 0) {
    return <div className="text-center py-12"><p className="text-muted-foreground">No posts yet. Share your adventure! 🌍</p></div>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-card rounded-2xl overflow-hidden border border-border">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground font-bold text-xs">
              {post.profile?.avatar_url ? (
                <img src={post.profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                post.profile?.display_name?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{post.profile?.display_name || "Traveler"}</p>
              {post.location_name && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{post.location_name}</p>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setShowMenu(showMenu === post.id ? null : post.id)}>
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
              {showMenu === post.id && (
                <div className="absolute right-0 top-6 bg-card border border-border rounded-xl shadow-lg z-10 py-1 w-32 animate-scale-in">
                  <button onClick={() => reportPost(post.id)} className="w-full text-left px-4 py-2 text-sm text-destructive flex items-center gap-2 hover:bg-muted">
                    <Flag className="w-3 h-3" /> Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Image */}
          <img src={post.image_url} alt={post.caption || "Travel post"} className="w-full aspect-square object-cover" loading="lazy" />

          {/* Actions */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1">
                <Heart className={`w-6 h-6 transition-all ${likedPosts.has(post.id) ? "fill-destructive text-destructive scale-110" : "text-foreground"}`} />
              </button>
              <button onClick={() => toggleComments(post.id)}>
                <MessageCircle className="w-6 h-6 text-foreground" />
              </button>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">{post.likes_count} likes</p>
            {post.caption && (
              <p className="text-sm text-foreground"><span className="font-semibold">{post.profile?.display_name}</span> {post.caption}</p>
            )}
            <button onClick={() => toggleComments(post.id)} className="text-xs text-muted-foreground mt-1">
              View comments
            </button>
            <p className="text-[11px] text-muted-foreground mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>

          {/* Comments section */}
          {showComments === post.id && (
            <div className="px-4 pb-3 border-t border-border pt-3 animate-fade-in">
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {(commentsMap[post.id] || []).map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <p className="text-sm text-foreground"><span className="font-semibold">{c.profile?.display_name || "User"}</span> {c.content}</p>
                  </div>
                ))}
                {(commentsMap[post.id] || []).length === 0 && (
                  <p className="text-xs text-muted-foreground">No comments yet</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="text-sm h-9" onKeyDown={(e) => e.key === "Enter" && postComment(post.id)} />
                <button onClick={() => postComment(post.id)} className="text-primary">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
