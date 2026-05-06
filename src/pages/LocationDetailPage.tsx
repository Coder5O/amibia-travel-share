import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Star, Eye, Bookmark, Share2, Users, Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";

interface Location {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  rating: number | null;
  visit_count: number | null;
  region: string | null;
}

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  category: string;
  location: string | null;
}

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useState<Location | null>(null);
  const [nearbyBuddies, setNearbyBuddies] = useState<Profile[]>([]);
  const [saved, setSaved] = useState(false);
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  
  const [emblaRef] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    if (!id) return;

    // Fetch location details
    supabase.from("locations").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setLocation(data);
    });

    // Fetch "Nearby Buddies" (simulated by fetching travelers who want to go here or are nearby)
    supabase.from("profiles")
      .select("*")
      .limit(5)
      .then(({ data }) => {
        if (data) setNearbyBuddies(data as any);
      });

    if (user) {
      supabase.from("saved_places").select("*").eq("user_id", user.id).eq("location_id", id).maybeSingle()
        .then(({ data }) => {
          if (data) { setSaved(true); setSavedRowId(data.id); }
        });
    }
  }, [id, user]);

  const toggleSave = async () => {
    if (!user || !id) return;
    if (saved && savedRowId) {
      await supabase.from("saved_places").delete().eq("id", savedRowId);
      setSaved(false); setSavedRowId(null);
      toast({ title: "Removed from saved" });
    } else {
      const { data } = await supabase.from("saved_places").insert({ user_id: user.id, location_id: id }).select().single();
      if (data) { setSaved(true); setSavedRowId(data.id); }
      toast({ title: "Saved! 📍" });
    }
  };

  const share = async () => {
    if (!location) return;
    if (navigator.share) {
      try { await navigator.share({ title: location.name, text: location.description || "" }); } catch {}
    } else {
      navigator.clipboard.writeText(`${location.name} — Ride With Me`);
      toast({ title: "Copied to clipboard" });
    }
  };

  if (!location) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;

  // Additional images for the gallery (simulated with variations of the main image)
  const galleryImages = [
    location.image_url,
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&q=80"
  ].filter(Boolean);

  return (
    <div className="max-w-lg mx-auto pb-24 -mx-4 -mt-4 bg-background min-h-screen">
      {/* Hero Gallery */}
      <div className="relative aspect-[4/3] overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {galleryImages.map((img, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0 h-full relative">
              <img src={img || ""} alt={`${location.name} ${i}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />
            </div>
          ))}
        </div>
        
        {/* Gallery Dots */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {galleryImages.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60" />
          ))}
        </div>

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-sm z-20"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={share}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-sm z-20"
          aria-label="Share"
        >
          <Share2 className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 -mt-10 relative z-30">
        <div className="bg-card rounded-3xl p-6 shadow-xl border border-border">
          <div className="flex justify-between items-start mb-2">
            <span className="inline-block text-[10px] uppercase tracking-widest font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {location.category}
            </span>
            <div className="flex items-center gap-1 text-accent font-bold text-sm">
              <Star className="w-4 h-4 fill-current" />
              {location.rating || "4.8"}
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">{location.name}</h1>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
            {location.region && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {location.region}
              </span>
            )}
            {location.visit_count != null && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Eye className="w-3.5 h-3.5 text-primary" />
                {location.visit_count.toLocaleString()} visits
              </span>
            )}
          </div>
          
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            {location.description || "Explore the breathtaking beauty of this Namibian gem. Perfect for adventurers and nature lovers alike."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Button 
            onClick={toggleSave} 
            variant={saved ? "secondary" : "default"}
            className={`flex-1 h-12 rounded-2xl font-bold transition-all ${!saved && "gradient-sunset text-primary-foreground shadow-lg shadow-primary/20"}`}
          >
            <Bookmark className={`w-5 h-5 mr-2 ${saved ? "fill-current" : ""}`} />
            {saved ? "Saved" : "Save Place"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/trips")} 
            className="flex-1 h-12 rounded-2xl font-bold border-2"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Plan Trip
          </Button>
        </div>

        {/* Nearby Buddies Section */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Travelers Interested</h2>
            <button className="text-xs font-bold text-primary">View all</button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {nearbyBuddies.map((buddy) => (
              <div key={buddy.id} className="flex-shrink-0 w-28 bg-card rounded-2xl p-3 border border-border shadow-sm flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/20">
                  <img 
                    src={buddy.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${buddy.display_name}`} 
                    alt={buddy.display_name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-bold text-foreground truncate w-full text-center">{buddy.display_name.split(" ")[0]}</span>
                <button 
                  onClick={() => navigate("/chat")}
                  className="w-full py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center gap-1"
                >
                  <MessageCircle className="w-3 h-3" /> Chat
                </button>
              </div>
            ))}
            {nearbyBuddies.length === 0 && (
              <div className="text-xs text-muted-foreground w-full py-8 text-center bg-muted/20 rounded-2xl border border-dashed">
                No travelers found nearby yet.
              </div>
            )}
          </div>
        </section>

        {/* Local Tips / Quick Info */}
        <section className="mt-6 grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30">
            <span className="block text-[10px] font-bold text-amber-600 uppercase mb-1">Best Time</span>
            <span className="text-sm font-bold text-amber-900 dark:text-amber-200">May — Sept</span>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
            <span className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Difficulty</span>
            <span className="text-sm font-bold text-blue-900 dark:text-blue-200">Moderate</span>
          </div>
        </section>
      </div>
    </div>
  );
}
