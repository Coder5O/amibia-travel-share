import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewedUserId: string;
  reviewedDisplayName?: string;
  tripId?: string | null;
  onSubmitted?: () => void;
}

export default function LeaveReviewDialog({ open, onOpenChange, reviewedUserId, reviewedDisplayName, tripId, onSubmitted }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [score, setScore] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (user.id === reviewedUserId) {
      toast({ title: "You cannot review yourself", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("ratings").insert({
      reviewer_id: user.id,
      reviewed_user_id: reviewedUserId,
      score,
      review_text: text.trim() || null,
      trip_id: tripId || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not save review", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Review submitted ⭐" });
    setText(""); setScore(5);
    onOpenChange(false);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate {reviewedDisplayName || "this traveler"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setScore(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} stars`}
                className="p-1"
              >
                <Star className={`w-8 h-8 transition-all ${(hover || score) >= n ? "fill-accent text-accent" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share your experience (optional)" rows={4} maxLength={500} />
          <Button onClick={submit} disabled={saving} className="w-full gradient-sunset text-primary-foreground">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
