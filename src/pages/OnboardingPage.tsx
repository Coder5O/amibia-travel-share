import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Car, Users, Crown, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Category = "has_means" | "needs_ride" | "has_both";

const categories = [
  { value: "has_means" as Category, label: "Has the Means", desc: "I have a car or budget to travel", icon: Car },
  { value: "needs_ride" as Category, label: "Needs the Means", desc: "Looking for a travel buddy with means", icon: Users },
  { value: "has_both" as Category, label: "Has Both", desc: "I'm flexible — car, budget & good vibes", icon: Crown },
];

const availableInterests = ["Hiking", "Photography", "Nightlife", "Wildlife", "Culture", "Food", "Surfing", "Camping", "Road Trips", "History"];
const availableLanguages = ["English", "Afrikaans", "Oshiwambo", "German", "Otjiherero", "Portuguese", "French"];

interface OnboardingProps {
  onComplete: () => void;
}

export default function OnboardingPage({ onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | "">("");
  const [funFact, setFunFact] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [travelVibe, setTravelVibe] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (i: string) => setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const toggleLanguage = (l: string) => setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
  };

  const handleComplete = async () => {
    if (!user || !category) return;
    setLoading(true);

    try {
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }

      await supabase.from("profiles").update({
        category,
        fun_fact: funFact,
        avatar_url: avatarUrl,
        interests,
        languages,
        travel_vibe: travelVibe,
        ...(idFile ? { verified: true } : {})
      }).eq("user_id", user.id);

      toast({ title: "You're all set! 🎉" });
      onComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="flex gap-2 p-4 pt-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? "gradient-sunset" : "bg-muted"}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-6 pb-6">
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-slide-in">
            <h2 className="text-2xl font-bold text-foreground mt-4">Add your photo</h2>
            <p className="text-muted-foreground text-sm mt-1 mb-8">Let other buddies see who you are</p>

            <div className="flex-1 flex items-center justify-center">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                {avatarPreview ? (
                  <div className="relative">
                    <img src={avatarPreview} alt="Avatar" className="w-40 h-40 rounded-full object-cover border-4 border-primary" />
                    <div className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <Camera className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-full border-4 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Tap to upload</span>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col animate-slide-in">
            <h2 className="text-2xl font-bold text-foreground mt-4">Your travel style</h2>
            <p className="text-muted-foreground text-sm mt-1 mb-6">Pick your category & share a fun fact</p>

            <div className="space-y-3 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left w-full ${
                    category === cat.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <cat.icon className={`w-6 h-6 ${category === cat.value ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <p className={`font-semibold text-sm ${category === cat.value ? "text-primary" : "text-foreground"}`}>{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div>
              <Label htmlFor="funfact">Fun Fact About You ✨</Label>
              <Textarea
                id="funfact"
                value={funFact}
                onChange={(e) => setFunFact(e.target.value)}
                placeholder="I once hitchhiked across the Namib Desert..."
                className="resize-none mt-1"
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col animate-slide-in">
            <h2 className="text-2xl font-bold text-foreground mt-4">Interests & Languages</h2>
            <p className="text-muted-foreground text-sm mt-1 mb-6">Select what you love and what you speak</p>

            <div className="space-y-6">
              <div>
                <Label className="text-base mb-3 block">Travel Vibe</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { value: "chatty", label: "I'm chatty 💬" },
                    { value: "quiet", label: "I prefer quiet 🤫" },
                    { value: "depends", label: "Depends on the vibe 🎲" }
                  ].map((vibe) => (
                    <button key={vibe.value} type="button" onClick={() => setTravelVibe(vibe.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${travelVibe === vibe.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 text-foreground"}`}>
                      <span className="font-medium text-sm">{vibe.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-3 block">Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {availableInterests.map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        interests.includes(interest)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-3 block">Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map(language => (
                    <button
                      key={language}
                      onClick={() => toggleLanguage(language)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        languages.includes(language)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col animate-slide-in">
            <h2 className="text-2xl font-bold text-foreground mt-4">Verify your identity</h2>
            <p className="text-muted-foreground text-sm mt-1 mb-8">Upload a photo of your ID for safety (optional)</p>

            <div className="flex-1 flex items-center justify-center">
              <label className="cursor-pointer w-full max-w-xs">
                <input type="file" accept="image/*" className="hidden" onChange={handleIdSelect} />
                {idPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-primary">
                    <img src={idPreview} alt="ID" className="w-full aspect-[3/2] object-cover" />
                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[3/2] rounded-2xl border-4 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tap to upload ID</span>
                    <span className="text-xs text-muted-foreground/60">This step is optional</span>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="flex-1 gradient-sunset text-primary-foreground"
              disabled={step === 2 && !category}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="flex-1 gradient-sunset text-primary-foreground"
              disabled={loading || !category}
            >
              {loading ? "Setting up..." : "Let's Go! 🚀"}
            </Button>
          )}
        </div>

        {step === 4 && (
          <button onClick={handleComplete} className="text-sm text-muted-foreground text-center mt-3 hover:underline">
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
