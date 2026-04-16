import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Star, Eye, ChevronLeft, ChevronRight } from "lucide-react";

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

const filterTabs = [
  { key: "all", label: "🌍 All" },
  { key: "most_visited", label: "🔥 Most Visited" },
  { key: "top_rated", label: "⭐ Top Rated" },
  { key: "restaurant", label: "🍽️ Restaurants" },
  { key: "nightlife", label: "🎶 Nightlife" },
  { key: "nature", label: "🏞️ Nature" },
  { key: "cultural", label: "🏛️ Cultural" },
];

export default function DestinationSlideshow() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    supabase.from("locations").select("*").then(({ data }) => {
      if (data) setLocations(data);
    });
  }, []);

  const filtered = activeFilter === "all"
    ? locations
    : activeFilter === "most_visited"
      ? [...locations].sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0)).slice(0, 10)
      : activeFilter === "top_rated"
        ? [...locations].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10)
        : locations.filter((l) => l.category === activeFilter);
  const current = filtered[currentIndex];

  const next = () => setCurrentIndex((i) => (i + 1) % filtered.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + filtered.length) % filtered.length);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeFilter]);

  useEffect(() => {
    if (filtered.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [filtered.length, currentIndex]);

  if (!current) return null;

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === tab.key
                ? "gradient-sunset text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Slideshow */}
      <div className="relative rounded-2xl overflow-hidden group aspect-[16/9]">
        <img
          src={current.image_url || ""}
          alt={current.name}
          className="w-full h-full object-cover transition-all duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-primary-foreground mb-1">{current.name}</h3>
          <p className="text-primary-foreground/80 text-sm mb-3 line-clamp-2">{current.description}</p>
          <div className="flex items-center gap-4 text-primary-foreground/70 text-xs">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{current.region}</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-accent text-accent" />{current.rating}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{current.visit_count?.toLocaleString()} visits</span>
          </div>
        </div>

        {/* Nav arrows */}
        {filtered.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </>
        )}

        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {filtered.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-primary-foreground w-4" : "bg-primary-foreground/40"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
