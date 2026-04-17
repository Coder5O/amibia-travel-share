import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Star, Eye, Bookmark, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useState<Location | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedRowId, setSavedRowId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("locations").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setLocation(data);
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

  return (
    <div className="max-w-lg mx-auto pb-24 -mx-4 -mt-4">
      {/* Hero image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={location.image_url || ""} alt={location.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={share}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
          aria-label="Share"
        >
          <Share2 className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 -mt-8 relative">
        <div className="bg-card rounded-2xl p-5 shadow-lg border border-border">
          <span className="inline-block text-[10px] uppercase tracking-wide font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2">
            {location.category}
          </span>
          <h1 className="text-2xl font-bold text-foreground mb-2">{location.name}</h1>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            {location.region && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{location.region}</span>}
            {location.rating != null && <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 fill-accent text-accent" />{location.rating}</span>}
            {location.visit_count != null && <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{location.visit_count.toLocaleString()} visits</span>}
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{location.description || "No description yet."}</p>
        </div>

        {/* Action */}
        <div className="mt-4 flex gap-2">
          <Button onClick={toggleSave} className={`flex-1 ${saved ? "bg-primary/20 text-primary hover:bg-primary/30" : "gradient-sunset text-primary-foreground"}`}>
            <Bookmark className={`w-4 h-4 mr-2 ${saved ? "fill-current" : ""}`} />
            {saved ? "Saved" : "Save Place"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/trips")} className="flex-1">
            Plan a Trip
          </Button>
        </div>

        {/* Reviews placeholder */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-foreground mb-2">Reviews</h2>
          <div className="text-xs text-muted-foreground p-4 rounded-xl bg-muted/40 text-center">
            Be the first to share your experience.
          </div>
        </section>
      </div>
    </div>
  );
}
