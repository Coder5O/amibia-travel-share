import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Clock, UserPlus, MapPin } from "lucide-react";

interface Activity {
  id: string;
  type: "trip" | "member";
  title: string;
  subtitle: string;
  created_at: string;
  icon: "trip" | "member";
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      // Fetch newest profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id:user_id, display_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (profileError) throw profileError;

      // Fetch newest trips
      const { data: trips, error: tripError } = await supabase
        .from("trips")
        .select("id, destination, created_at, profiles!inner(display_name)")
        .order("created_at", { ascending: false })
        .limit(5);

      if (tripError) throw tripError;

      const profileActivities: Activity[] = (profiles || []).map((p) => ({
        id: `profile-${p.id}`,
        type: "member",
        title: "New member joined!",
        subtitle: `${p.display_name} just signed up.`,
        created_at: p.created_at,
        icon: "member",
      }));

      const tripActivities: Activity[] = (trips || []).map((t: any) => ({
        id: `trip-${t.id}`,
        type: "trip",
        title: "New trip planned!",
        subtitle: `${t.profiles?.display_name || "Someone"} is going to ${t.destination}.`,
        created_at: t.created_at,
        icon: "trip",
      }));

      const combined = [...profileActivities, ...tripActivities]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setActivities(combined);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (activities.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8 shadow-sm">
      <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-green-500 absolute top-0 left-0 animate-ping opacity-75"></div>
        </div>
        <h3 className="font-semibold text-sm text-foreground">Live Activity</h3>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity) => (
          <div key={activity.id} className="p-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'member' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
              {activity.icon === "member" ? <UserPlus className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{activity.subtitle}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 mt-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }).replace("about ", "")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
