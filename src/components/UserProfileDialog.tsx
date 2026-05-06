import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ShieldCheck, Star, MessageCircle, StarIcon, Info, Users, Car, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LeaveReviewDialog from "./LeaveReviewDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryIcons: Record<string, any> = {
  has_means: Car,
  needs_ride: Users,
  has_both: Crown,
};

const categoryLabels: Record<string, string> = {
  has_means: "Has the Means",
  needs_ride: "Needs a Ride",
  has_both: "Has Both",
};

export default function UserProfileDialog({ userId, open, onOpenChange }: UserProfileDialogProps) {
  const [profile, setProfile] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId) {
      loadProfileData(userId);
    } else {
      setProfile(null);
      setRatings([]);
    }
  }, [open, userId]);

  const loadProfileData = async (uid: string) => {
    setLoading(true);
    const { data: profData } = await supabase.from("profiles").select("*").eq("user_id", uid).single();
    if (profData) setProfile(profData);

    const { data: ratData } = await supabase.from("ratings").select("*").eq("reviewed_user_id", uid);
    if (ratData) setRatings(ratData);

    setLoading(false);
  };

  const startChat = async () => {
    if (!currentUser || !profile) return;
    try {
      // Check if conversation already exists
      const { data: myConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUser.id);

      const { data: theirConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", profile.user_id);

      const myIds = new Set(myConvos?.map(c => c.conversation_id) || []);
      const commonConvo = theirConvos?.find(c => myIds.has(c.conversation_id));

      if (commonConvo) {
        onOpenChange(false);
        navigate('/chat', { state: { conversationId: commonConvo.conversation_id } });
        return;
      }

      // Create new conversation
      const { data: convo, error: convoErr } = await supabase.from("conversations").insert({}).select().single();
      if (convoErr) throw convoErr;

      await supabase.from("conversation_participants").insert([
        { conversation_id: convo.id, user_id: currentUser.id },
        { conversation_id: convo.id, user_id: profile.user_id },
      ]);

      onOpenChange(false);
      navigate('/chat', { state: { conversationId: convo.id } });
    } catch (err: any) {
      toast({ title: "Could not start chat", description: err.message, variant: "destructive" });
    }
  };

  if (!userId) return null;

  const avgRating = ratings.length ? (ratings.reduce((s: number, r: any) => s + r.score, 0) / ratings.length).toFixed(1) : null;
  const CategoryIcon = profile?.category ? categoryIcons[profile.category] : Info;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-background">
          {loading || !profile ? (
            <div className="p-8 text-center text-muted-foreground">Loading profile...</div>
          ) : (
            <div className="flex flex-col">
              <div className="gradient-sunset p-6 pb-12 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-primary-foreground flex items-center gap-1">
                      {profile.display_name}
                      {profile.verified && <ShieldCheck className="w-5 h-5 text-primary-foreground" />}
                    </h2>
                    {profile.category && (
                      <span className="inline-flex items-center gap-1 mt-1 px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs font-medium">
                        <CategoryIcon className="w-3 h-3" /> {categoryLabels[profile.category] || "Traveler"}
                      </span>
                    )}
                    {avgRating && (
                      <span className="inline-flex items-center gap-1 ml-2 mt-1 px-2 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs">
                        <Star className="w-3 h-3 fill-current" /> {avgRating} ({ratings.length})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 relative">
                <div className="absolute -top-10 left-6">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="w-20 h-20 rounded-full border-4 border-background object-cover bg-background" />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-4 border-background gradient-sunset flex items-center justify-center text-primary-foreground text-2xl font-bold">
                      {profile.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                <div className="pt-12 space-y-4">
                  {profile.bio && (
                    <div>
                      <p className="text-sm text-foreground">{profile.bio}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {profile.location}
                      </span>
                    )}
                  </div>

                  {profile.fun_fact && (
                    <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                      <p className="text-xs text-primary font-bold mb-1 flex items-center gap-1">
                         Fun Fact
                      </p>
                      <p className="text-sm text-foreground">{profile.fun_fact}</p>
                    </div>
                  )}

                  {profile.interests && profile.interests.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">Interests</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.interests.map((i: string) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-muted text-muted-foreground">
                            {i}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profile.languages && profile.languages.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">Languages</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.languages.map((l: string) => (
                          <Badge key={l} variant="outline" className="text-xs">
                            {l}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentUser?.id !== profile.user_id && (
                    <div className="pt-4 flex gap-2 border-t border-border mt-4">
                      <Button onClick={startChat} className="flex-1 gradient-sunset text-primary-foreground font-bold">
                        <MessageCircle className="w-4 h-4 mr-2" /> Message
                      </Button>
                      <Button variant="outline" onClick={() => setShowReview(true)} className="flex-1 font-bold">
                        <StarIcon className="w-4 h-4 mr-2" /> Review
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <LeaveReviewDialog
        open={showReview}
        onOpenChange={setShowReview}
        reviewedUserId={userId!}
        reviewedDisplayName={profile?.display_name}
        onSubmitted={() => loadProfileData(userId!)}
      />
    </>
  );
}
