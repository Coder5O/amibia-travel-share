import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, MapPin, Edit2, Save, Phone, AlertTriangle, Star, Bookmark, Map } from "lucide-react";

const categoryBadge: Record<string, { label: string; emoji: string }> = {
  has_means: { label: "Has the Means", emoji: "🚗" },
  needs_ride: { label: "Needs the Means", emoji: "🙋" },
  has_both: { label: "Has Both", emoji: "👑" },
};

type Tab = "posts" | "trips" | "saved" | "sos";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [form, setForm] = useState({ display_name: "", bio: "", fun_fact: "", location: "", travel_style: "" });
  const [posts, setPosts] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [newContact, setNewContact] = useState({ contact_name: "", phone: "", relationship: "" });
  const [showAddContact, setShowAddContact] = useState(false);

  useEffect(() => {
    if (user) { loadProfile(); loadPosts(); loadTrips(); loadSaved(); loadEmergency(); loadRatings(); }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    if (data) { setProfile(data); setForm({ display_name: data.display_name || "", bio: data.bio || "", fun_fact: data.fun_fact || "", location: data.location || "", travel_style: data.travel_style || "" }); }
  };

  const loadPosts = async () => {
    if (!user) return;
    const { data } = await supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  const loadTrips = async () => {
    if (!user) return;
    const { data } = await supabase.from("trips").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setTrips(data);
  };

  const loadSaved = async () => {
    if (!user) return;
    const { data } = await supabase.from("saved_places").select("*, locations(*)").eq("user_id", user.id);
    if (data) setSavedPlaces(data);
  };

  const loadEmergency = async () => {
    if (!user) return;
    const { data } = await supabase.from("emergency_contacts").select("*").eq("user_id", user.id);
    if (data) setEmergencyContacts(data);
  };

  const loadRatings = async () => {
    if (!user) return;
    const { data } = await supabase.from("ratings").select("*").eq("reviewed_user_id", user.id);
    if (data) setRatings(data);
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(form).eq("user_id", user.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Profile updated! ✨" }); setEditing(false); loadProfile(); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("posts").upload(path, file);
    if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
    const caption = prompt("Add a caption:") || "";
    const locationName = prompt("Location?") || "";
    await supabase.from("posts").insert({ user_id: user.id, image_url: urlData.publicUrl, caption, location_name: locationName });
    toast({ title: "Post shared! 🌍" });
    loadPosts();
  };

  const addEmergencyContact = async () => {
    if (!user || !newContact.contact_name || !newContact.phone) return;
    await supabase.from("emergency_contacts").insert({ user_id: user.id, ...newContact });
    setNewContact({ contact_name: "", phone: "", relationship: "" });
    setShowAddContact(false);
    loadEmergency();
    toast({ title: "Emergency contact added" });
  };

  const deleteEmergencyContact = async (id: string) => {
    await supabase.from("emergency_contacts").delete().eq("id", id);
    loadEmergency();
  };

  if (!profile) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const badge = categoryBadge[profile.category] || { label: "Traveler", emoji: "🌍" };
  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : null;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "posts", label: "Posts", icon: Camera },
    { key: "trips", label: "Trips", icon: Map },
    { key: "saved", label: "Saved", icon: Bookmark },
    { key: "sos", label: "SOS", icon: AlertTriangle },
  ];

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="gradient-sunset rounded-b-3xl p-6 pb-16 -mx-4 -mt-4 relative">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-primary-foreground">{profile.display_name}</h2>
            <span className="inline-block mt-1 px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs font-medium">
              {badge.emoji} {badge.label}
            </span>
            {avgRating && (
              <span className="inline-flex items-center gap-1 ml-2 mt-1 px-2 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs">
                <Star className="w-3 h-3 fill-current" /> {avgRating}
              </span>
            )}
          </div>
          <button onClick={() => setEditing(!editing)} className="text-primary-foreground/80 hover:text-primary-foreground">
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Avatar */}
      <div className="relative -mt-10 flex justify-center">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name} className="w-20 h-20 rounded-full border-4 border-background object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full border-4 border-background gradient-sunset flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {profile.display_name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-8 mt-3 mb-4">
        <div className="text-center"><p className="font-bold text-foreground">{posts.length}</p><p className="text-xs text-muted-foreground">Posts</p></div>
        <div className="text-center"><p className="font-bold text-foreground">{trips.length}</p><p className="text-xs text-muted-foreground">Trips</p></div>
        <div className="text-center"><p className="font-bold text-foreground">{ratings.length}</p><p className="text-xs text-muted-foreground">Reviews</p></div>
      </div>

      {/* Profile info / edit */}
      <div className="px-4 space-y-4">
        {editing ? (
          <div className="space-y-3 animate-fade-in">
            <div><Label>Display Name</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
            <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} /></div>
            <div><Label>Fun Fact</Label><Textarea value={form.fun_fact} onChange={(e) => setForm({ ...form, fun_fact: e.target.value })} rows={2} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Travel Style</Label><Input value={form.travel_style} onChange={(e) => setForm({ ...form, travel_style: e.target.value })} placeholder="Adventurous, relaxed..." /></div>
            <Button onClick={saveProfile} className="w-full gradient-sunset text-primary-foreground"><Save className="w-4 h-4 mr-2" /> Save</Button>
          </div>
        ) : (
          <div className="space-y-2 animate-fade-in">
            {profile.bio && <p className="text-sm text-foreground">{profile.bio}</p>}
            {profile.fun_fact && <div className="bg-primary/5 rounded-xl p-3"><p className="text-xs text-muted-foreground font-medium mb-1">✨ Fun Fact</p><p className="text-sm text-foreground">{profile.fun_fact}</p></div>}
            {profile.location && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.location}</p>}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium transition-all border-b-2 ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "posts" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground text-sm">My Adventures</h3>
              <label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /><div className="flex items-center gap-1 text-sm text-primary font-medium"><Camera className="w-4 h-4" /> Post</div></label>
            </div>
            {posts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No posts yet</p> : (
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                {posts.map((post) => <img key={post.id} src={post.image_url} alt={post.caption || ""} className="aspect-square object-cover" loading="lazy" />)}
              </div>
            )}
          </div>
        )}

        {activeTab === "trips" && (
          <div className="space-y-3">
            {trips.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No trips yet</p> : trips.map((t) => (
              <div key={t.id} className="bg-muted rounded-xl p-3">
                <p className="font-semibold text-sm text-foreground flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> {t.destination}</p>
                <p className="text-xs text-muted-foreground">{new Date(t.departure_date).toLocaleDateString()} · {t.available_seats} seats · {t.status}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="space-y-3">
            {savedPlaces.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No saved places</p> : savedPlaces.map((sp: any) => (
              <div key={sp.id} className="bg-muted rounded-xl p-3">
                <p className="font-semibold text-sm text-foreground">{sp.locations?.name || "Place"}</p>
                <p className="text-xs text-muted-foreground">{sp.locations?.region}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "sos" && (
          <div className="space-y-3">
            <div className="bg-destructive/10 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <p className="text-xs text-foreground">Your emergency contacts will be notified if you trigger SOS during a trip.</p>
            </div>
            {emergencyContacts.map((c) => (
              <div key={c.id} className="bg-muted rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">{c.contact_name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone} · {c.relationship}</p>
                </div>
                <button onClick={() => deleteEmergencyContact(c.id)} className="text-xs text-destructive">Remove</button>
              </div>
            ))}
            {showAddContact ? (
              <div className="space-y-2 animate-fade-in">
                <Input placeholder="Name" value={newContact.contact_name} onChange={(e) => setNewContact({ ...newContact, contact_name: e.target.value })} />
                <Input placeholder="Phone" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
                <Input placeholder="Relationship" value={newContact.relationship} onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })} />
                <Button onClick={addEmergencyContact} className="w-full gradient-sunset text-primary-foreground" size="sm">Save Contact</Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowAddContact(true)} className="w-full" size="sm"><Phone className="w-3 h-3 mr-1" /> Add Emergency Contact</Button>
            )}

            {/* Ratings section */}
            {ratings.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-sm text-foreground mb-2">Reviews ({ratings.length})</h4>
                {ratings.map((r) => (
                  <div key={r.id} className="bg-muted rounded-xl p-3 mb-2">
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: r.score }).map((_, i) => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
                    </div>
                    {r.review_text && <p className="text-xs text-foreground">{r.review_text}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Button variant="ghost" onClick={signOut} className="w-full text-destructive mt-4">Sign Out</Button>
      </div>
    </div>
  );
}
