import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, MapPin, Edit2, Save } from "lucide-react";

const categoryBadge: Record<string, { label: string; emoji: string }> = {
  has_means: { label: "Has the Means", emoji: "🚗" },
  needs_ride: { label: "Needs a Ride", emoji: "🙋" },
  has_both: { label: "Has Both", emoji: "👑" },
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: "", bio: "", fun_fact: "", location: "", travel_style: "" });
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadPosts();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    if (data) {
      setProfile(data);
      setForm({ display_name: data.display_name || "", bio: data.bio || "", fun_fact: data.fun_fact || "", location: data.location || "", travel_style: data.travel_style || "" });
    }
  };

  const loadPosts = async () => {
    if (!user) return;
    const { data } = await supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(form).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated! ✨" });
      setEditing(false);
      loadProfile();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from("posts").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
    
    const caption = prompt("Add a caption for your post:") || "";
    const locationName = prompt("Where was this taken?") || "";

    await supabase.from("posts").insert({
      user_id: user.id,
      image_url: urlData.publicUrl,
      caption,
      location_name: locationName,
    });

    toast({ title: "Post shared! 🌍" });
    loadPosts();
  };

  if (!profile) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const badge = categoryBadge[profile.category] || { label: "Traveler", emoji: "🌍" };

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
          </div>
          <button onClick={() => setEditing(!editing)} className="text-primary-foreground/80 hover:text-primary-foreground">
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Avatar */}
      <div className="relative -mt-10 flex justify-center">
        <div className="w-20 h-20 rounded-full border-4 border-background gradient-sunset flex items-center justify-center text-primary-foreground text-2xl font-bold">
          {profile.display_name?.[0]?.toUpperCase() || "?"}
        </div>
      </div>

      {/* Profile info */}
      <div className="mt-4 px-4 space-y-4">
        {editing ? (
          <div className="space-y-3 animate-fade-in">
            <div>
              <Label>Display Name</Label>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Fun Fact</Label>
              <Textarea value={form.fun_fact} onChange={(e) => setForm({ ...form, fun_fact: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label>Travel Style</Label>
              <Input value={form.travel_style} onChange={(e) => setForm({ ...form, travel_style: e.target.value })} placeholder="Adventurous, relaxed, road-tripper..." />
            </div>
            <Button onClick={saveProfile} className="w-full gradient-sunset text-primary-foreground">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {profile.fun_fact && (
              <div className="bg-accent/20 rounded-xl p-3">
                <p className="text-xs text-muted-foreground font-medium mb-1">✨ Fun Fact</p>
                <p className="text-sm text-foreground">{profile.fun_fact}</p>
              </div>
            )}
            {profile.bio && <p className="text-sm text-foreground">{profile.bio}</p>}
            {profile.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {profile.location}
              </p>
            )}
            {profile.travel_style && (
              <p className="text-sm text-muted-foreground">🎒 {profile.travel_style}</p>
            )}
          </div>
        )}

        {/* Post a photo */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">My Adventures</h3>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <div className="flex items-center gap-1 text-sm text-primary font-medium">
                <Camera className="w-4 h-4" /> Post
              </div>
            </label>
          </div>

          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No posts yet. Share your first adventure!</p>
          ) : (
            <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
              {posts.map((post) => (
                <img key={post.id} src={post.image_url} alt={post.caption || ""} className="aspect-square object-cover" loading="lazy" />
              ))}
            </div>
          )}
        </div>

        <Button variant="ghost" onClick={signOut} className="w-full text-destructive mt-4">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
