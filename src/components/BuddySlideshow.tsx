import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, ChevronLeft, ChevronRight, MessageCircle, ShieldCheck, Car, Users, Crown } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileDialog from "@/components/UserProfileDialog";
interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  category: "has_means" | "needs_ride" | "has_both";
  fun_fact: string | null;
  location: string | null;
  availability_status: string | null;
  available_from: string | null;
  available_to: string | null;
  trip_type: string | null;
  desired_destinations: string[] | null;
  verified: boolean;
  interests: string[] | null;
}

const categoryMeta: Record<string, { label: string; icon: any }> = {
  has_means: { label: "Has the Means", icon: Car },
  needs_ride: { label: "Needs the Means", icon: Users },
  has_both: { label: "Has Both", icon: Crown },
};

const statusColors: Record<string, string> = {
  available: "bg-green-500",
  planning: "bg-amber-500",
  busy: "bg-muted-foreground",
};

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function BuddySlideshow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("availability_status", "available")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          if (user) {
            setProfiles(data.filter((p: any) => p.user_id !== user.id) as any);
          } else {
            setProfiles(data as any);
          }
        }
      });
  }, [user]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (profiles.length <= 1) return;
    const interval = setInterval(() => {
      if (emblaApi) emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [profiles.length, emblaApi]);

  if (profiles.length === 0) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden group bg-card border border-border shadow-md">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {profiles.map((current, index) => {
            const Cat = categoryMeta[current.category]?.icon || Users;
            const catLabel = categoryMeta[current.category]?.label || "Traveler";
            const statusDot = statusColors[current.availability_status || "available"] || statusColors.available;

            return (
              <div className="flex-[0_0_100%] min-w-0" key={current.id}>
                <div className="p-5 flex gap-4 items-start">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {current.avatar_url ? (
                      <img src={current.avatar_url} alt={current.display_name} className="w-20 h-20 rounded-2xl object-cover border-2 border-primary shadow-sm" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl gradient-sunset flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-sm">
                        {current.display_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-card ${statusDot}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h3 className="font-bold text-foreground text-base truncate">{current.display_name}</h3>
                      {current.verified && <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Cat className="w-3 h-3 text-primary" />{catLabel}</span>
                      {current.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" />{current.location}</span>}
                    </div>
                    {current.fun_fact && <p className="text-xs text-foreground/80 mt-2 line-clamp-2 italic border-l-2 border-primary/30 pl-2">"{current.fun_fact}"</p>}
                  </div>
                </div>

                {/* Availability */}
                <div className="px-5 pb-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs bg-muted/40 p-2 rounded-lg">
                    <span className={`w-2 h-2 rounded-full ${statusDot} animate-pulse`} />
                    <span className="font-medium capitalize text-foreground">{current.availability_status || "available"}</span>
                    {(current.available_from || current.available_to) && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground ml-auto">
                        <Calendar className="w-3 h-3" />
                        {formatDate(current.available_from)} – {formatDate(current.available_to)}
                      </span>
                    )}
                  </div>
                  {current.trip_type && (
                    <div className="text-xs text-muted-foreground px-1">
                      <span className="text-foreground font-medium">Trip:</span> {current.trip_type}
                    </div>
                  )}
                  {current.desired_destinations && current.desired_destinations.length > 0 && (
                    <div className="flex gap-1 flex-wrap px-1">
                      {current.desired_destinations.slice(0, 3).map((d) => (
                        <span key={d} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold tracking-wide">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-5 pb-8">
                  <button
                    onClick={() => setSelectedUserId(current.user_id)}
                    className="w-full py-2.5 rounded-xl gradient-sunset text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] transition-transform"
                  >
                    <MessageCircle className="w-4 h-4" /> View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nav */}
      {profiles.length > 1 && (
        <>
          <button onClick={scrollPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-background z-10">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={scrollNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-background z-10">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </>
      )}

      {/* Dots */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {profiles.slice(0, 8).map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === selectedIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/60"}`}
          />
        ))}
      </div>

      <UserProfileDialog open={!!selectedUserId} onOpenChange={(o) => !o && setSelectedUserId(null)} userId={selectedUserId} />
    </div>
  );
}
