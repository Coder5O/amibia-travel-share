import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Eye } from "lucide-react";
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

const fallbackLocations: Location[] = [
  {
    id: "fallback-swakopmund",
    name: "Swakopmund",
    description: "Coastal city with adventure activities and ocean views.",
    image_url: null,
    category: "nature",
    rating: 4.8,
    visit_count: 148,
    region: "Erongo",
  },
  {
    id: "fallback-etosha",
    name: "Etosha National Park",
    description: "Wildlife safari hotspot with unforgettable sunsets.",
    image_url: null,
    category: "nature",
    rating: 4.9,
    visit_count: 212,
    region: "Oshikoto",
  },
  {
    id: "fallback-joe-pub",
    name: "Joe's Beerhouse",
    description: "A local favorite for food and social vibes.",
    image_url: null,
    category: "restaurant",
    rating: 4.6,
    visit_count: 119,
    region: "Khomas",
  },
  {
    id: "fallback-sossusvlei",
    name: "Sossusvlei",
    description: "Iconic red dunes and desert landscapes.",
    image_url: null,
    category: "nature",
    rating: 4.9,
    visit_count: 175,
    region: "Hardap",
  },
  {
    id: "fallback-nightlife",
    name: "Windhoek Nightlife",
    description: "Lively spots for music and meeting new people.",
    image_url: null,
    category: "nightlife",
    rating: 4.4,
    visit_count: 93,
    region: "Khomas",
  },
];

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
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [emblaRef, emblaApi] = useEmblaCarousel({ dragFree: true, align: "start" });

  useEffect(() => {
    supabase.from("locations").select("*").then(({ data, error }) => {
      if (error || !data || data.length === 0) {
        setLocations(fallbackLocations);
        return;
      }
      setLocations(data as Location[]);
    });
  }, []);

  const categoryAliases: Record<string, string[]> = {
    nightlife: ["club", "clubs", "nightlife"],
    nature: ["nature", "outdoors"],
    restaurant: ["restaurant", "restaurants", "food"],
    cultural: ["cultural", "culture", "history"],
  };

  const filtered = activeFilter === "all"
    ? locations
    : activeFilter === "most_visited"
      ? [...locations].sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0)).slice(0, 10)
      : activeFilter === "top_rated"
        ? [...locations].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10)
        : locations.filter((l) => {
            const aliases = categoryAliases[activeFilter] || [activeFilter];
            const normalizedCategory = (l.category || "").toLowerCase().trim();
            return aliases.includes(normalizedCategory);
          });

  useEffect(() => {
    if (emblaApi) emblaApi.scrollTo(0);
  }, [activeFilter, emblaApi]);

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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-sunset flex items-center justify-center mb-4 opacity-60">
            <MapPin className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No destinations found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different category or check back soon!</p>
        </div>
      ) : (
        /* Swipable Carousel */
        <div className="overflow-hidden -mx-4 px-4" ref={emblaRef}>
          <div className="flex gap-4 touch-pan-x pb-4">
            {filtered.map((loc) => (
              <button
                key={loc.id}
                onClick={() => navigate(`/location/${loc.id}`)}
                className="flex-shrink-0 w-64 group relative rounded-2xl overflow-hidden aspect-[4/3] shadow-md border border-border"
                aria-label={`View ${loc.name}`}
              >
                {loc.image_url ? (
                  <img
                    src={loc.image_url}
                    alt={loc.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/70 via-accent/60 to-primary/30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                  <h3 className="text-lg font-bold text-white mb-1 leading-tight">{loc.name}</h3>
                  <div className="flex items-center gap-3 text-white/80 text-[10px] font-medium">
                    {loc.region && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{loc.region}</span>}
                    {loc.rating && <span className="flex items-center gap-0.5 text-accent"><Star className="w-3 h-3 fill-accent" />{loc.rating}</span>}
                    {loc.visit_count != null && <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{loc.visit_count}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
