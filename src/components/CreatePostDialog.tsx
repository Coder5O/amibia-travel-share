import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Loader2, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function CreatePostDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState("");
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setFile(null); setPreview(null); setCaption(""); setLocationName(""); setUploading(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!user || !file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("posts").upload(path, file);
    if (upErr) {
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
    const { error: insErr } = await supabase.from("posts").insert({
      user_id: user.id,
      image_url: urlData.publicUrl,
      caption: caption.trim() || null,
      location_name: locationName.trim() || null,
    });
    if (insErr) {
      toast({ title: "Could not share post", description: insErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    toast({ title: "Post shared! 🌍" });
    reset();
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share your adventure</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full aspect-square object-cover rounded-xl" />
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
              <ImagePlus className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Tap to choose a photo</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          )}

          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Tell your story..." rows={3} maxLength={500} />
          </div>
          <div>
            <Label htmlFor="loc">Location</Label>
            <Input id="loc" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Sossusvlei" />
          </div>

          <Button onClick={submit} disabled={!file || uploading} className="w-full gradient-sunset text-primary-foreground">
            {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sharing...</> : "Share Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
