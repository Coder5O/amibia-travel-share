import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DestinationSlideshow from "@/components/DestinationSlideshow";
import BuddySlideshow from "@/components/BuddySlideshow";
import PostFeed from "@/components/PostFeed";
import CreatePostDialog from "@/components/CreatePostDialog";
import TopRatedTravelers from "@/components/TopRatedTravelers";
import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buddies, setBuddies] = useState<any[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setBuddies(data); });
  }, []);

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <img src={logo} alt="Ride With Me" className="w-8 h-8" width={512} height={512} />
        <h1 className="text-xl font-bold text-gradient-sunset">Ride With Me</h1>
      </div>

      {/* Destinations */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground mb-3">Discover Namibia 🇳🇦</h2>
        <DestinationSlideshow />
      </section>

      {/* Featured travel buddy slideshow */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Featured Travel Buddy</h2>
          <button onClick={() => navigate("/search")} className="text-xs text-primary font-medium">See all</button>
        </div>
        <BuddySlideshow />
      </section>

      {/* Horizontal buddy scroll */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground mb-3">More Buddies</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {buddies.map((b) => (
            <button key={b.id} onClick={() => navigate("/chat")} className="flex-shrink-0 flex flex-col items-center gap-1 w-16">
              <div className="w-14 h-14 rounded-full border-2 border-primary p-0.5">
                {b.avatar_url ? (
                  <img src={b.avatar_url} alt={b.display_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full gradient-sunset flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {b.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-foreground truncate w-full text-center">{b.display_name?.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Top rated travelers by activity */}
      <section className="mb-6">
        <TopRatedTravelers />
      </section>

      {/* Feed */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Travel Feed</h2>
          <button onClick={() => setShowCreatePost(true)} className="text-xs text-primary font-medium flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> New Post
          </button>
        </div>
        <PostFeed key={feedKey} />
      </section>

      {/* Floating Create Post button */}
      <button
        onClick={() => setShowCreatePost(true)}
        aria-label="Create post"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full gradient-sunset shadow-lg flex items-center justify-center z-40 hover:scale-105 transition-transform"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </button>

      <CreatePostDialog open={showCreatePost} onOpenChange={setShowCreatePost} onCreated={() => setFeedKey((k) => k + 1)} />
    </div>
  );
}
