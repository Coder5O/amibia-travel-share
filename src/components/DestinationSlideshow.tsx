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

const locationImageFallbacks: Record<string, string> = {
  sossusvlei: "https://commons.wikimedia.org/wiki/Special:FilePath/Dune_45%2C_Sossusvlei_%282017%29.jpg",
  "etosha national park": "https://commons.wikimedia.org/wiki/Special:FilePath/Etosha_National_Park%2C_Namibia_%282856072100%29.jpg",
  swakopmund: "https://commons.wikimedia.org/wiki/Special:FilePath/Jetty%2C_Swakopmund%2C_Namibia%2C_2018-08-04%2C_DD_68-70_HDR.jpg",
  "joe's beerhouse": "https://commons.wikimedia.org/wiki/Special:FilePath/Joes-Beerhouse_Windhoek-Namibia1.jpg",
  "windhoek nightlife": "https://commons.wikimedia.org/wiki/Special:FilePath/Windhoek-Skyline.jpg",
  "brewers market": "https://commons.wikimedia.org/wiki/Special:FilePath/Windhoek-Skyline.jpg",
  "chopsi's bar": "https://commons.wikimedia.org/wiki/Special:FilePath/Windhoek-Skyline.jpg",
  "the social club": "https://commons.wikimedia.org/wiki/Special:FilePath/Windhoek-Skyline.jpg",
  "andy's pub": "https://commons.wikimedia.org/wiki/Special:FilePath/Windhoek-Skyline.jpg",
  windhoek: "https://commons.wikimedia.org/wiki/Special:FilePath/Windhoek-Skyline.jpg",
};

const categoryImageFallbacks: Record<string, string> = {
  nature: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
  restaurant: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
  nightlife: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
  cultural: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80",
};

export default function DestinationSlideshow() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrorByLocation, setImageErrorByLocation] = useState<Record<string, boolean>>({});
  const [emblaRef, emblaApi] = useEmblaCarousel({ dragFree: true, align: "start", loop: true });

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

  useEffect(() => {
    if (!emblaApi || filtered.length <= 1 || isPaused) return;
    const interval = window.setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [emblaApi, filtered.length, isPaused]);

  const getCategoryFallback = (loc: Location) => {
    const categoryKey = (loc.category || "").toLowerCase().trim();
    if (categoryImageFallbacks[categoryKey]) return categoryImageFallbacks[categoryKey];
    return "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80";
  };

  const getLocationImage = (loc: Location) => {
    if (loc.image_url && !imageErrorByLocation[loc.id]) return loc.image_url;
    const nameKey = loc.name.toLowerCase().trim();
    if (locationImageFallbacks[nameKey]) return locationImageFallbacks[nameKey];
    return getCategoryFallback(loc);
  };

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
        <div
          className="overflow-hidden -mx-4 px-4"
          ref={emblaRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          onTouchCancel={() => setIsPaused(false)}
        >
          <div className="flex gap-4 touch-pan-x pb-4">
            {filtered.map((loc) => (
              <button
                key={loc.id}
                onClick={() => navigate(`/location/${loc.id}`)}
                className="flex-shrink-0 w-64 group relative rounded-2xl overflow-hidden aspect-[4/3] shadow-md border border-border"
                aria-label={`View ${loc.name}`}
              >
                <img
                  src={getLocationImage(loc)}
                  alt={loc.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={() => {
                    setImageErrorByLocation((prev) => (prev[loc.id] ? prev : { ...prev, [loc.id]: true }));
                  }}
                />
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
