import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, ShieldCheck, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LeaveReviewDialog from "@/components/LeaveReviewDialog";

const ACTIVITIES = [
  { key: "lunch", label: "Casual Dining (Lunch)", emoji: "🥗" },
  { key: "dinner", label: "Evening Dining", emoji: "🍷" },
  { key: "club", label: "Nightlife / Clubbing", emoji: "🎶" },
  { key: "party", label: "Party / Celebration", emoji: "🎉" },
  { key: "formal", label: "Formal Event", emoji: "🎩" },
  { key: "casual", label: "Informal Outing", emoji: "☕" },
  { key: "ceremony", label: "Ceremonial Gathering", emoji: "🕊️" },
  { key: "weekend", label: "Weekend Getaway", emoji: "🏞️" },
  { key: "business", label: "Business Trip", emoji: "💼" },
  { key: "night_out", label: "Night Out", emoji: "🌃" },
];

type Profile = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  location: string | null;
  verified: boolean;
  interests: string[] | null;
};

export default function TopRatedTravelers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [loading, setLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ userId: string; name: string } | null>(null);

  useEffect(() => {
    if (!activity) {
      setProfiles([]);
      return;
    }
    loadTopRated(activity);
  }, [activity]);

  const loadTopRated = async (act: string) => {
    setLoading(true);
    // Fetch profiles whose interests array contains this activity
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,user_id,display_name,avatar_url,location,verified,interests")
      .contains("interests", [act]);

    if (!profs || profs.length === 0) {
      setProfiles([]);
      setRatings({});
      setLoading(false);
      return;
    }

    const ids = profs.map((p) => p.user_id);
    const { data: r } = await supabase
      .from("ratings")
      .select("reviewed_user_id, score")
      .in("reviewed_user_id", ids);

    const map: Record<string, { sum: number; count: number }> = {};
    (r || []).forEach((row) => {
      if (!map[row.reviewed_user_id]) map[row.reviewed_user_id] = { sum: 0, count: 0 };
      map[row.reviewed_user_id].sum += row.score;
      map[row.reviewed_user_id].count += 1;
    });
    const final: Record<string, { avg: number; count: number }> = {};
    Object.entries(map).forEach(([k, v]) => {
      final[k] = { avg: v.sum / v.count, count: v.count };
    });

    const sorted = [...profs].sort((a, b) => {
      const ra = final[a.user_id]?.avg ?? 0;
      const rb = final[b.user_id]?.avg ?? 0;
      if (rb !== ra) return rb - ra;
      const ca = final[a.user_id]?.count ?? 0;
      const cb = final[b.user_id]?.count ?? 0;
      return cb - ca;
    });

    setProfiles(sorted);
    setRatings(final);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 fill-accent text-accent" />
        <h2 className="text-base font-semibold text-foreground">Top Rated Travelers</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Pick an activity to see top rated buddies for it.
      </p>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
        {ACTIVITIES.map((a) => (
          <button
            key={a.key}
            onClick={() => setActivity(activity === a.key ? null : a.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activity === a.key
                ? "gradient-sunset text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {a.emoji} {a.label}
          </button>
        ))}
      </div>

      {activity && (
        <div className="space-y-2">
          {loading && (
            <p className="text-center text-xs text-muted-foreground py-6">Loading…</p>
          )}
          {!loading && profiles.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No travelers listed for this activity yet.
              </p>
            </div>
          )}
          {!loading &&
            profiles.slice(0, 10).map((p, idx) => {
              const r = ratings[p.user_id];
              const isSelf = user?.id === p.user_id;
              return (
                <div
                  key={p.id}
                  className="bg-card border border-border rounded-2xl p-3 hover:border-primary/40 transition-colors"
                >
                  <button
                    onClick={() => navigate("/chat")}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <span className="w-6 text-sm font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div className="relative w-12 h-12 flex-shrink-0">
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={p.display_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground font-bold">
                          {p.display_name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      {p.verified && (
                        <ShieldCheck className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-primary bg-background rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {p.display_name}
                      </p>
                      {p.location && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3" />
                          {p.location}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {r ? (
                        <>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-0.5 justify-end">
                            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                            {r.avg.toFixed(1)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {r.count} review{r.count === 1 ? "" : "s"}
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">No ratings</p>
                      )}
                    </div>
                  </button>
                  {!isSelf && user && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewTarget({ userId: p.user_id, name: p.display_name });
                      }}
                      className="mt-2 w-full text-xs font-semibold gradient-sunset text-primary-foreground rounded-full py-1.5 flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
                      aria-label={`Leave a review for ${p.display_name}`}
                    >
                      <Star className="w-3.5 h-3.5 fill-primary-foreground" /> Leave a review
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {reviewTarget && (
        <LeaveReviewDialog
          open={!!reviewTarget}
          onOpenChange={(o) => { if (!o) setReviewTarget(null); }}
          reviewedUserId={reviewTarget.userId}
          reviewedDisplayName={reviewTarget.name}
          onSubmitted={() => activity && loadTopRated(activity)}
        />
      )}
    </div>
  );
}
