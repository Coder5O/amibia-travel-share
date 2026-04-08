import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const categoryBadge: Record<string, { label: string; emoji: string }> = {
  has_means: { label: "Has Means", emoji: "🚗" },
  needs_ride: { label: "Needs Ride", emoji: "🙋" },
  has_both: { label: "Has Both", emoji: "👑" },
};

export default function ExplorePage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data);
  };

  const filtered = profiles.filter((p) => {
    const matchesSearch = !search || p.display_name?.toLowerCase().includes(search.toLowerCase()) || p.fun_fact?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-24">
      <h2 className="text-xl font-bold text-foreground mb-4">Explore Travelers</h2>
      
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search travelers..."
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            !filterCategory ? "gradient-sunset text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          All
        </button>
        {Object.entries(categoryBadge).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFilterCategory(filterCategory === key ? null : key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filterCategory === key ? "gradient-sunset text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {val.emoji} {val.label}
          </button>
        ))}
      </div>

      {/* Profiles grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((profile) => {
          const badge = categoryBadge[profile.category] || { label: "Traveler", emoji: "🌍" };
          return (
            <div
              key={profile.id}
              className="bg-card rounded-2xl border border-border p-4 animate-scale-in cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => navigate(`/chat`)}
            >
              <div className="w-14 h-14 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-3">
                {profile.display_name?.[0]?.toUpperCase() || "?"}
              </div>
              <h3 className="text-sm font-semibold text-foreground text-center">{profile.display_name}</h3>
              <span className="block text-center text-xs mt-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground mx-auto w-fit">
                {badge.emoji} {badge.label}
              </span>
              {profile.fun_fact && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 text-center">{profile.fun_fact}</p>
              )}
              {profile.location && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" />{profile.location}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No travelers found matching your search.</p>
      )}
    </div>
  );
}
