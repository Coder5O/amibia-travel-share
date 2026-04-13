import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-namibia.jpg";
import logo from "@/assets/logo.png";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, { display_name: displayName });
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
    <div className="min-h-screen flex flex-col">
      {/* Hero top section */}
      <div className="relative h-[40vh] lg:hidden">
        <img src={heroImage} alt="Namibian desert" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <img src={logo} alt="Ride With Me" className="w-10 h-10" />
          <span className="text-xl font-bold text-primary-foreground drop-shadow-lg">Ride With Me</span>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex lg:flex-1">
        <div className="lg:w-1/2 relative">
          <img src={heroImage} alt="Namibian desert dunes" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 gradient-hero opacity-60" />
          <div className="relative z-10 flex flex-col justify-end p-12">
            <h1 className="text-5xl font-bold text-primary-foreground mb-4">Ride With Me</h1>
            <p className="text-xl text-primary-foreground/90 max-w-md">Find your perfect travel buddy in Namibia.</p>
          </div>
        </div>
        <div className="lg:w-1/2 flex items-center justify-center p-6 bg-background">
          <FormContent isSignUp={isSignUp} setIsSignUp={setIsSignUp} email={email} setEmail={setEmail} password={password} setPassword={setPassword} displayName={displayName} setDisplayName={setDisplayName} loading={loading} onSubmit={handleSubmit} />
        </div>
      </div>

      {/* Mobile form */}
      <div className="flex-1 px-6 -mt-6 relative z-10 lg:hidden">
        <FormContent isSignUp={isSignUp} setIsSignUp={setIsSignUp} email={email} setEmail={setEmail} password={password} setPassword={setPassword} displayName={displayName} setDisplayName={setDisplayName} loading={loading} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

function FormContent({ isSignUp, setIsSignUp, email, setEmail, password, setPassword, displayName, setDisplayName, loading, onSubmit }: any) {
  return (
    <div className="w-full max-w-md animate-slide-in">
      <h2 className="text-2xl font-bold text-foreground mb-1">
        {isSignUp ? "Join the Adventure" : "Welcome Back"}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {isSignUp ? "Create your account to get started" : "Sign in to continue exploring"}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your travel name" required />
          </div>
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
          {loading ? "Loading..." : isSignUp ? "Get Started" : "Sign In"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {isSignUp ? "Already have an account?" : "New to Ride With Me?"}{" "}
        <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium hover:underline">
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>
    </div>
  );
}
