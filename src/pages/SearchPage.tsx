import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, SlidersHorizontal, X, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const categoryBadge: Record<string, { label: string; emoji: string }> = {
  has_means: { label: "Has Means", emoji: "🚗" },
  needs_ride: { label: "Needs Means", emoji: "🙋" },
  has_both: { label: "Has Both", emoji: "👑" },
};

const regions = ["Windhoek", "Swakopmund", "Sossusvlei", "Etosha", "Lüderitz", "Walvis Bay", "Caprivi"];

export default function SearchPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<string | null>(null);
  const [filterGender, setFilterGender] = useState<string | null>(null);
  const [filterVerified, setFilterVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data);
  };

  const filtered = profiles.filter((p) => {
    if (search && !p.display_name?.toLowerCase().includes(search.toLowerCase()) && !p.fun_fact?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterRegion && p.location !== filterRegion) return false;
    if (filterGender && p.gender !== filterGender) return false;
    if (filterVerified && !p.verified) return false;
    return true;
  });

  const activeFilters = [filterCategory, filterRegion, filterGender, filterVerified].filter(Boolean).length;

  return (
    <div className="max-w-lg mx-auto pb-24">
      <h2 className="text-xl font-bold text-foreground mb-4">Find Travelers</h2>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search travelers..." className="pl-9" />
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="relative">
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilters > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-sunset text-primary-foreground text-[10px] flex items-center justify-center">{activeFilters}</span>
          )}
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-4 animate-slide-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Filters</h3>
            <button onClick={() => { setFilterCategory(null); setFilterRegion(null); setFilterGender(null); setFilterVerified(false); }} className="text-xs text-primary">Clear all</button>
          </div>

          <div>
            <Label className="text-xs">Category</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(categoryBadge).map(([key, val]) => (
                <button key={key} onClick={() => setFilterCategory(filterCategory === key ? null : key)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategory === key ? "gradient-sunset text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {val.emoji} {val.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Region</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {regions.map((r) => (
                <button key={r} onClick={() => setFilterRegion(filterRegion === r ? null : r)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterRegion === r ? "gradient-sunset text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Gender</Label>
            <div className="flex gap-2 mt-1">
              {["Male", "Female", "Other"].map((g) => (
                <button key={g} onClick={() => setFilterGender(filterGender === g.toLowerCase() ? null : g.toLowerCase())} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterGender === g.toLowerCase() ? "gradient-sunset text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setFilterVerified(!filterVerified)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all w-full ${filterVerified ? "bg-primary/10 text-primary border border-primary" : "bg-muted text-muted-foreground"}`}>
            <ShieldCheck className="w-4 h-4" /> Verified only
          </button>
        </div>
      )}

      {/* Category filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        <button onClick={() => setFilterCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${!filterCategory ? "gradient-sunset text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          All
        </button>
        {Object.entries(categoryBadge).map(([key, val]) => (
          <button key={key} onClick={() => setFilterCategory(filterCategory === key ? null : key)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filterCategory === key ? "gradient-sunset text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {val.emoji} {val.label}
          </button>
        ))}
      </div>

      {/* Profiles grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((profile) => {
          const badge = categoryBadge[profile.category] || { label: "Traveler", emoji: "🌍" };
          return (
            <div key={profile.id} className="bg-card rounded-2xl border border-border p-4 animate-scale-in cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/chat`)}>
              <div className="relative mx-auto w-14 h-14 mb-3">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground text-xl font-bold">
                    {profile.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                {profile.verified && (
                  <ShieldCheck className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-primary bg-background rounded-full" />
                )}
              </div>
              <h3 className="text-sm font-semibold text-foreground text-center">{profile.display_name}</h3>
              <span className="block text-center text-xs mt-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground mx-auto w-fit">
                {badge.emoji} {badge.label}
              </span>
              {profile.fun_fact && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 text-center">{profile.fun_fact}</p>}
              {profile.location && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" />{profile.location}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No travelers found.</p>}
    </div>
  );
}
