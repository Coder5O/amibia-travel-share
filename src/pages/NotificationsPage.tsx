import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Heart, MessageCircle, MapPin, CheckCircle, XCircle } from "lucide-react";
import { getInitials } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  reference_id: string | null;
  actor: {
    display_name: string;
    avatar_url: string | null;
  };
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          type,
          read,
          created_at,
          reference_id,
          actor:profiles!notifications_actor_id_fkey(display_name, avatar_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setNotifications(data as unknown as Notification[]);
      }
      setLoading(false);

      // Mark all as read when viewed
      const unreadIds = data?.filter((n) => !n.read).map((n) => n.id) || [];
      if (unreadIds.length > 0) {
        await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleNotificationClick = (n: Notification) => {
    switch (n.type) {
      case "like":
      case "comment":
        // Navigate to the post? Currently no standalone post page, maybe index or profile. 
        navigate("/");
        break;
      case "trip_request":
      case "trip_approved":
      case "trip_rejected":
        navigate("/trips"); // Navigate to trips board
        break;
      default:
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case "comment": return <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-500" />;
      case "trip_request": return <MapPin className="w-4 h-4 text-amber-500" />;
      case "trip_approved": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "trip_rejected": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const getMessage = (n: Notification) => {
    const name = n.actor?.display_name || "Someone";
    switch (n.type) {
      case "like": return <span><b>{name}</b> liked your post.</span>;
      case "comment": return <span><b>{name}</b> commented on your post.</span>;
      case "trip_request": return <span><b>{name}</b> requested to join your trip.</span>;
      case "trip_approved": return <span><b>{name}</b> approved your trip request!</span>;
      case "trip_rejected": return <span><b>{name}</b> declined your trip request.</span>;
      default: return <span><b>{name}</b> interacted with you.</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 h-14">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 -ml-2 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Notifications</h1>
      </header>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">All caught up!</h2>
            <p className="text-sm text-muted-foreground">You don't have any notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                onClick={() => handleNotificationClick(n)}
                className={`flex gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
              >
                <div className="relative flex-shrink-0">
                  {n.actor?.avatar_url ? (
                    <img src={n.actor.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground font-bold">
                      {getInitials(n.actor?.display_name || "A")}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border shadow-sm">
                    {getIcon(n.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm text-foreground">{getMessage(n)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
