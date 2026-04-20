import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bookmark, MapPin, Star, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SavedRow {
  id: string;
  location_id: string;
  locations: {
    id: string;
    name: string;
    image_url: string | null;
    region: string | null;
    rating: number | null;
    category: string;
  } | null;
}

export default function SavedPlacesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("saved_places")
      .select("id, location_id, locations(id, name, image_url, region, rating, category)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };

  const unsave = async (id: string) => {
    await supabase.from("saved_places").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Removed from saved" });
  };

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" /> Saved Places
        </h1>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-1">No saved places yet</p>
          <p className="text-xs text-muted-foreground">Tap the bookmark icon on a destination to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const loc = item.locations;
            if (!loc) return null;
            return (
              <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden animate-scale-in">
                <button
                  onClick={() => navigate(`/location/${loc.id}`)}
                  className="block w-full text-left"
                  aria-label={`Open ${loc.name}`}
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {loc.image_url ? (
                      <img src={loc.image_url} alt={loc.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full gradient-sunset" />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-foreground truncate">{loc.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                      {loc.region && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{loc.region}</span>}
                      {loc.rating != null && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-accent text-accent" />{loc.rating}</span>}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => unsave(item.id)}
                  className="w-full text-xs text-destructive py-2 border-t border-border flex items-center justify-center gap-1 hover:bg-destructive/5 transition-colors"
                  aria-label={`Remove ${loc.name}`}
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
