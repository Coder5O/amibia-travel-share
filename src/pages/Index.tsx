import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DestinationSlideshow from "@/components/DestinationSlideshow";
import BuddySlideshow from "@/components/BuddySlideshow";
import PostFeed from "@/components/PostFeed";
import CreatePostDialog from "@/components/CreatePostDialog";
import TopRatedTravelers from "@/components/TopRatedTravelers";
import { ActivityFeed } from "@/components/ActivityFeed";
import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import UserProfileDialog from "@/components/UserProfileDialog";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";

const statusColors: Record<string, string> = {
  available: "bg-green-500",
  planning: "bg-amber-500",
  busy: "bg-muted-foreground",
};

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buddies, setBuddies] = useState<any[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [emblaRef] = useEmblaCarousel({ dragFree: true, align: "start" });
  const { toast } = useToast();

  useEffect(() => {
    const checkNewTrips = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase.from("profiles").select("desired_destinations").eq("user_id", user.id).single();
      const desired = profile?.desired_destinations || [];

      const { data: saved } = await supabase.from("saved_places").select("locations(name)").eq("user_id", user.id);
      const savedNames = saved?.map((s: any) => s.locations?.name).filter(Boolean) || [];

      const allTargets = [...new Set([...desired, ...savedNames])];
      if (allTargets.length === 0) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: recentTrips } = await supabase
        .from("trips")
        .select("destination, id")
        .neq("user_id", user.id)
        .gte("created_at", yesterday.toISOString());

      if (recentTrips && recentTrips.length > 0) {
        const matches = recentTrips.filter(t => allTargets.some(target => t.destination.toLowerCase().includes(target.toLowerCase())));
        if (matches.length > 0) {
          toast({
            title: "New trip match! 🚗",
            description: `Someone posted a trip to ${matches[0].destination}.`,
          });
        }
      }
    };
    checkNewTrips();
  }, [user, toast]);

  useEffect(() => {
    supabase.from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15)
      .then(({ data }) => { 
        if (data) {
          if (user) {
            setBuddies(data.filter(b => b.user_id !== user.id));
          } else {
            setBuddies(data); 
          }
        }
      });
  }, [user]);

  return (
    <div className="max-w-lg mx-auto pb-24 bg-background min-h-screen px-4">
      {/* Header / Search Bar Style */}
      <header className="flex items-center justify-between pt-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl gradient-sunset flex items-center justify-center shadow-lg shadow-primary/20">
            <img src={logo} alt="L" className="w-6 h-6 invert brightness-0" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight leading-none">VoyageBuddy</h1>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Namibia 🇳🇦</span>
          </div>
        </div>
        <button 
          onClick={() => navigate("/search")}
          className="w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Search className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Stories Style Buddy Scroll */}
      <section className="mb-8 -mx-4 px-4">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-foreground">Travel Buddies</h2>
          <button onClick={() => navigate("/search")} className="text-xs font-bold text-primary">See all</button>
        </div>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 touch-pan-x pb-2">
            {/* Add 'My Story' placeholder if user is logged in */}
            {user && (
              <div className="flex-shrink-0 flex flex-col items-center gap-2 w-16">
                <div className="w-16 h-16 rounded-2xl bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center group cursor-pointer relative overflow-hidden">
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground text-center">Me</span>
              </div>
            )}
            
            {buddies.map((b) => (
              <button 
                key={b.id} 
                onClick={() => setSelectedUserId(b.user_id)} 
                className="flex-shrink-0 flex flex-col items-center gap-2 w-16 group"
              >
                <div className="w-16 h-16 rounded-2xl p-0.5 relative group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary via-accent to-primary-foreground opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="w-full h-full rounded-[14px] bg-background p-0.5 relative z-10">
                    {b.avatar_url ? (
                      <img src={b.avatar_url} alt={b.display_name} className="w-full h-full rounded-[12px] object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-[12px] gradient-sunset flex items-center justify-center text-primary-foreground font-bold text-xl">
                        {getInitials(b.display_name)}
                      </div>
                    )}
                  </div>
                  {/* Active Indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background z-20 ${statusColors[b.availability_status || "available"] || statusColors.available}`} />
                </div>
                <span className="text-[11px] font-bold text-foreground truncate w-full text-center group-hover:text-primary transition-colors">
                  {b.display_name?.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Activity Feed */}
      <ActivityFeed />

      {/* Featured Destination */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4">Discover Gems</h2>
        <DestinationSlideshow />
      </section>

      {/* Main Slideshow */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-foreground mb-4">Top Matches</h2>
        <BuddySlideshow />
      </section>

      {/* Community Feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Community</h2>
          <button 
            onClick={() => setShowCreatePost(true)} 
            className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center gap-1.5 hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Share Moment
          </button>
        </div>
        <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm p-2">
          <PostFeed key={feedKey} />
        </div>
      </section>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreatePost(true)}
        aria-label="Create post"
        className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl gradient-sunset shadow-xl shadow-primary/30 flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-all"
      >
        <Plus className="w-7 h-7 text-primary-foreground" />
      </button>

      <CreatePostDialog 
        open={showCreatePost} 
        onOpenChange={setShowCreatePost} 
        onCreated={() => setFeedKey((k) => k + 1)} 
      />

      <UserProfileDialog open={!!selectedUserId} onOpenChange={(o) => !o && setSelectedUserId(null)} userId={selectedUserId} />
    </div>
  );
}
