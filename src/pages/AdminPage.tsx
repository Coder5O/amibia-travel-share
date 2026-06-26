import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Users, Map, Image, ShieldCheck, Trash2, Ban,
  Search, AlertTriangle, BookOpen, Plus, X, RefreshCw
} from "lucide-react";

type AdminTab = "users" | "trips" | "posts" | "rules";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [searchQuery, setSearchQuery] = useState("");

  // Data
  const [users, setUsers] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);

  // Rule editor
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({ title: "", description: "", category: "general" });

  // Stats
  const [stats, setStats] = useState({ users: 0, trips: 0, posts: 0, banned: 0 });

  useEffect(() => {
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    setIsAdmin(data?.role === "admin");
  };

  const loadData = async () => {
    // Load stats
    const [usersRes, tripsRes, postsRes, bannedRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("trips").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_banned", true),
    ]);
    setStats({
      users: usersRes.count || 0,
      trips: tripsRes.count || 0,
      posts: postsRes.count || 0,
      banned: bannedRes.count || 0,
    });

    // Load tab-specific data
    if (activeTab === "users") {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setUsers(data || []);
    } else if (activeTab === "trips") {
      const { data } = await supabase.from("trips").select("*, profiles!trips_creator_id_fkey(display_name)").order("created_at", { ascending: false });
      setTrips(data || []);
    } else if (activeTab === "posts") {
      const { data } = await supabase.from("posts").select("*, profiles!posts_user_id_fkey(display_name)").order("created_at", { ascending: false });
      setPosts(data || []);
    } else if (activeTab === "rules") {
      const { data } = await supabase.from("community_rules").select("*").order("sort_order");
      setRules(data || []);
    }
  };

  const banUser = async (profileId: string, userId: string, reason: string) => {
    if (!reason) {
      toast({ title: "Please provide a ban reason", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: true, ban_reason: reason } as any)
      .eq("id", profileId);
    if (error) {
      toast({ title: "Error banning user", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User banned ⛔" });
      loadData();
    }
  };

  const unbanUser = async (profileId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: false, ban_reason: null } as any)
      .eq("id", profileId);
    if (error) {
      toast({ title: "Error unbanning user", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User unbanned ✅" });
      loadData();
    }
  };

  const deleteUser = async (userId: string) => {
    // Delete profile (cascade will handle related data)
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) {
      toast({ title: "Error deleting user", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User deleted permanently 🗑️" });
      loadData();
    }
  };

  const deleteTrip = async (tripId: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", tripId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trip deleted" });
      loadData();
    }
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post deleted" });
      loadData();
    }
  };

  const addRule = async () => {
    if (!newRule.title || !newRule.description) return;
    const { error } = await supabase.from("community_rules").insert({
      title: newRule.title,
      description: newRule.description,
      category: newRule.category,
      sort_order: rules.length + 1,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rule added ✅" });
      setNewRule({ title: "", description: "", category: "general" });
      setShowAddRule(false);
      loadData();
    }
  };

  const deleteRule = async (ruleId: string) => {
    const { error } = await supabase.from("community_rules").delete().eq("id", ruleId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rule deleted" });
      loadData();
    }
  };

  // Access denied
  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldCheck className="w-16 h-16 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          You do not have admin permissions. This page is restricted.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  // Loading
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTrips = trips.filter(t =>
    t.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.origin?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { key: "users" as AdminTab, label: "Users", icon: Users, count: stats.users },
    { key: "trips" as AdminTab, label: "Trips", icon: Map, count: stats.trips },
    { key: "posts" as AdminTab, label: "Posts", icon: Image, count: stats.posts },
    { key: "rules" as AdminTab, label: "Rules", icon: BookOpen, count: rules.length },
  ];

  return (
    <div className="space-y-4 pb-24 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Admin Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">Manage users, content & community rules</p>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <button onClick={loadData} className="p-2 rounded-full hover:bg-muted transition-colors" title="Refresh Data">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-destructive">
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Users", value: stats.users, color: "text-blue-500" },
          { label: "Trips", value: stats.trips, color: "text-green-500" },
          { label: "Posts", value: stats.posts, color: "text-purple-500" },
          { label: "Banned", value: stats.banned, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setSearchQuery(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all border-b-2 ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
            <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search (for users and trips) */}
      {(activeTab === "users" || activeTab === "trips") && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === "users" ? "Search users by name or location..." : "Search trips by destination..."}
            className="pl-9"
          />
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-2">
          {filteredUsers.map((u) => (
            <UserCard
              key={u.id}
              profile={u}
              onBan={(reason) => banUser(u.id, u.user_id, reason)}
              onUnban={() => unbanUser(u.id)}
              onDelete={() => deleteUser(u.user_id)}
            />
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No users found</p>
          )}
        </div>
      )}

      {/* Trips Tab */}
      {activeTab === "trips" && (
        <div className="space-y-2">
          {filteredTrips.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {t.origin || "?"} ➔ {t.destination}
                </p>
                <p className="text-xs text-muted-foreground">
                  by {t.profiles?.display_name || "Unknown"} · {new Date(t.departure_date).toLocaleDateString()} · {t.available_seats} seats
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteTrip(t.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {filteredTrips.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No trips found</p>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <div className="grid grid-cols-2 gap-2">
          {posts.map((p) => (
            <div key={p.id} className="relative group rounded-xl overflow-hidden bg-muted border border-border">
              {p.image_url && (
                <img src={p.image_url} alt={p.caption || ""} className="w-full aspect-square object-cover" />
              )}
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <p className="text-xs text-foreground font-medium text-center truncate w-full">
                  {p.profiles?.display_name || "Unknown"}
                </p>
                {p.caption && <p className="text-[10px] text-muted-foreground text-center line-clamp-2">{p.caption}</p>}
                <Button variant="destructive" size="sm" onClick={() => deletePost(p.id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <p className="col-span-2 text-center text-sm text-muted-foreground py-8">No posts found</p>
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-3">
          {rules.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.category === "safety" ? "bg-green-500/10 text-green-500" : r.category === "privacy" ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"}`}>
                    {r.category}
                  </span>
                  <p className="font-semibold text-sm text-foreground">{r.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteRule(r.id)} className="text-destructive hover:text-destructive shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {showAddRule ? (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3 animate-fade-in">
              <h4 className="font-semibold text-sm text-foreground">Add New Rule</h4>
              <Input
                placeholder="Rule title"
                value={newRule.title}
                onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
              />
              <Textarea
                placeholder="Rule description"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                rows={3}
              />
              <div className="flex gap-2">
                {["general", "safety", "privacy", "conduct"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewRule({ ...newRule, category: cat })}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${newRule.category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={addRule} className="flex-1 gradient-sunset text-primary-foreground" size="sm">Save Rule</Button>
                <Button variant="ghost" onClick={() => setShowAddRule(false)} size="sm"><X className="w-4 h-4" /></Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowAddRule(true)} className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Rule
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// User card sub-component
function UserCard({ profile, onBan, onUnban, onDelete }: {
  profile: any;
  onBan: (reason: string) => void;
  onUnban: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`bg-card border rounded-xl p-3 space-y-2 ${profile.is_banned ? "border-destructive/50" : "border-border"}`}>
      <div className="flex items-center gap-3">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
            {profile.display_name?.charAt(0) || "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-foreground truncate">{profile.display_name}</p>
            {profile.is_banned && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">BANNED</span>
            )}
            {profile.role === "admin" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">ADMIN</span>
            )}
            {profile.verified && (
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {profile.location || "No location"} · Joined {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {profile.is_banned && profile.ban_reason && (
        <p className="text-xs text-destructive bg-destructive/5 rounded-lg p-2">
          <span className="font-medium">Ban reason:</span> {profile.ban_reason}
        </p>
      )}

      {showActions && (
        <div className="space-y-2 pt-2 border-t border-border animate-fade-in">
          {profile.is_banned ? (
            <Button variant="outline" size="sm" onClick={onUnban} className="w-full text-green-600">
              ✅ Unban User
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Reason for ban (required)"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onBan(banReason); setBanReason(""); setShowActions(false); }}
                className="w-full text-orange-600"
                disabled={!banReason}
              >
                <Ban className="w-3 h-3 mr-1" /> Ban User
              </Button>
            </div>
          )}

          {confirmDelete ? (
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={() => { onDelete(); setConfirmDelete(false); }} className="flex-1">
                Yes, Delete Permanently
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="w-full text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Delete User Permanently
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
