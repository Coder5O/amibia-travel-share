import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, MapPin, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const categoryBadge: Record<string, string> = {
  has_means: "🚗 Has Means",
  needs_ride: "🙋 Needs Ride",
  has_both: "👑 Has Both",
};

export default function PostFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
    if (user) loadLikes();
  }, [user]);

  const loadPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      // Load profiles for posts
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, category")
        .in("user_id", userIds);

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

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts yet. Be the first to share your adventure! 🌍</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-card rounded-2xl overflow-hidden border border-border animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground font-bold text-sm">
              {post.profile?.display_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">{post.profile?.display_name || "Traveler"}</p>
              {post.location_name && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{post.location_name}
                </p>
              )}
            </div>
            {post.profile?.category && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {categoryBadge[post.profile.category] || post.profile.category}
              </span>
            )}
          </div>

          {/* Image */}
          <img src={post.image_url} alt={post.caption || "Travel post"} className="w-full aspect-square object-cover" loading="lazy" />

          {/* Actions */}
          <div className="p-4">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1 transition-colors">
                <Heart className={`w-6 h-6 ${likedPosts.has(post.id) ? "fill-destructive text-destructive" : "text-foreground"}`} />
                <span className="text-sm font-medium text-foreground">{post.likes_count}</span>
              </button>
              <button onClick={() => navigate(`/chat`)} className="flex items-center gap-1 text-foreground">
                <MessageCircle className="w-6 h-6" />
              </button>
            </div>
            {post.caption && <p className="text-sm text-foreground"><span className="font-semibold">{post.profile?.display_name}</span> {post.caption}</p>}
            <p className="text-xs text-muted-foreground mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
