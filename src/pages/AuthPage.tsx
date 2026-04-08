import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Car, Users, Crown, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-namibia.jpg";
import logo from "@/assets/logo.png";

type Category = "has_means" | "needs_ride" | "has_both";

const categories = [
  { value: "has_means" as Category, label: "I Have the Means", desc: "I have a car or budget to travel", icon: Car },
  { value: "needs_ride" as Category, label: "I Need a Ride", desc: "Looking for a travel buddy with means", icon: Users },
  { value: "has_both" as Category, label: "I Have Both", desc: "I'm flexible — car, budget & good vibes", icon: Crown },
];

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [funFact, setFunFact] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (!category) {
          toast({ title: "Pick your travel style!", variant: "destructive" });
          setLoading(false);
          return;
        }
        await signUp(email, password, { display_name: displayName, category, fun_fact: funFact });
        toast({ title: "Welcome to Ride With Me! 🎉", description: "Check your email to confirm your account." });
      } else {
        await signIn(email, password);
        toast({ title: "Welcome back! 🚗" });
      }
    } catch (err: any) {
      toast({ title: "Oops!", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={heroImage} alt="Namibian desert dunes at sunset" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 gradient-hero opacity-60" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <h1 className="text-5xl font-bold text-primary-foreground mb-4">Ride With Me</h1>
          <p className="text-xl text-primary-foreground/90 max-w-md">
            Find your perfect travel buddy in Namibia. Adventure awaits — together.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md animate-slide-in">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={logo} alt="Ride With Me" className="w-10 h-10" width={512} height={512} />
            <h1 className="text-2xl font-bold text-gradient-sunset">Ride With Me</h1>
          </div>
          <div className="hidden lg:flex items-center gap-3 mb-8">
            <img src={logo} alt="Ride With Me" className="w-10 h-10" width={512} height={512} />
            <span className="text-sm font-medium text-muted-foreground">Start your journey</span>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-2">
            {isSignUp ? "Join the Adventure" : "Welcome Back"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isSignUp ? "Create your travel profile" : "Sign in to continue exploring"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your travel name" required />
                </div>

                <div>
                  <Label>Your Travel Style</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          category === cat.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <cat.icon className={`w-5 h-5 ${category === cat.value ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <p className={`font-medium text-sm ${category === cat.value ? "text-primary" : "text-foreground"}`}>{cat.label}</p>
                          <p className="text-xs text-muted-foreground">{cat.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="funfact">Fun Fact About You <Sparkles className="inline w-4 h-4 text-accent" /></Label>
                  <Textarea id="funfact" value={funFact} onChange={(e) => setFunFact(e.target.value)} placeholder="I once hitchhiked across the Namib Desert..." className="resize-none" rows={2} />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="adventurer@email.com" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>

            <Button type="submit" className="w-full gradient-sunset text-primary-foreground font-semibold" size="lg" disabled={loading}>
              {loading ? "Loading..." : isSignUp ? "Start Your Journey" : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? "Already have an account?" : "New to Ride With Me?"}{" "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium hover:underline">
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
