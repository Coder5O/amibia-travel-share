import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, ChevronLeft, ChevronRight, MessageCircle, ShieldCheck, Car, Users, Crown } from "lucide-react";

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
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("availability_status", "available")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setProfiles(data as any);
      });
  }, []);

  const current = profiles[index];

  const next = () => setIndex((i) => (i + 1) % profiles.length);
  const prev = () => setIndex((i) => (i - 1 + profiles.length) % profiles.length);

  useEffect(() => {
    if (profiles.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [profiles.length, index]);

  if (!current) return null;

  const Cat = categoryMeta[current.category]?.icon || Users;
  const catLabel = categoryMeta[current.category]?.label || "Traveler";
  const statusDot = statusColors[current.availability_status || "available"] || statusColors.available;

  return (
    <div className="relative rounded-2xl overflow-hidden group bg-card border border-border">
      <div className="p-5 flex gap-4 items-start">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {current.avatar_url ? (
            <img src={current.avatar_url} alt={current.display_name} className="w-20 h-20 rounded-2xl object-cover border-2 border-primary" />
          ) : (
            <div className="w-20 h-20 rounded-2xl gradient-sunset flex items-center justify-center text-primary-foreground text-2xl font-bold">
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
            <span className="inline-flex items-center gap-1"><Cat className="w-3 h-3" />{catLabel}</span>
            {current.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{current.location}</span>}
          </div>
          {current.fun_fact && <p className="text-xs text-foreground/80 mt-2 line-clamp-2 italic">"{current.fun_fact}"</p>}
        </div>
      </div>

      {/* Availability */}
      <div className="px-5 pb-3 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
          <span className="font-medium capitalize text-foreground">{current.availability_status || "available"}</span>
          {(current.available_from || current.available_to) && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDate(current.available_from)} – {formatDate(current.available_to)}
            </span>
          )}
        </div>
        {current.trip_type && (
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Trip type:</span> {current.trip_type}
          </div>
        )}
        {current.desired_destinations && current.desired_destinations.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {current.desired_destinations.slice(0, 3).map((d) => (
              <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {d}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="px-5 pb-5">
        <button
          onClick={() => navigate("/chat")}
          className="w-full py-2 rounded-xl gradient-sunset text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" /> Message {current.display_name.split(" ")[0]}
        </button>
      </div>

      {/* Nav */}
      {profiles.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </>
      )}

      {/* Dots */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
        {profiles.slice(0, 8).map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
