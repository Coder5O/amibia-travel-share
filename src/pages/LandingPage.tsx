import { Car, Users, MapPin, ShieldCheck, Camera, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

interface Props {
  onGetStarted: () => void;
}

const highlights = [
  { icon: Car, title: "Find a ride or share yours", desc: "Connect with travellers who have a car, or with passengers ready to split the journey." },
  { icon: MapPin, title: "Discover Namibia", desc: "Explore Sossusvlei, Etosha, Fish River Canyon and the country's hidden gems." },
  { icon: Users, title: "Travel buddies, your vibe", desc: "Filter by language, interests, gender and verified profiles." },
  { icon: ShieldCheck, title: "Built-in safety", desc: "Verified IDs, encrypted chat and an SOS button on every screen." },
];

export default function LandingPage({ onGetStarted }: Props) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1600&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative max-w-lg mx-auto px-6 pt-16 pb-12 text-center">
          <img src={logo} alt="Ride With Me" className="w-16 h-16 mx-auto mb-4" width={512} height={512} />
          <h1 className="text-4xl font-bold text-gradient-sunset mb-3">Ride With Me</h1>
          <p className="text-base text-muted-foreground mb-6 leading-relaxed">
            Namibia's social travel app — find buddies, share rides and explore the country together.
          </p>
          <Button onClick={onGetStarted} size="lg" className="gradient-sunset text-primary-foreground px-10 shadow-lg">
            Get Started
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Free to join · Verified community</p>
        </div>
      </section>

      {/* Highlights */}
      <section className="max-w-lg mx-auto px-6 py-8 space-y-4">
        <h2 className="text-xl font-bold text-foreground text-center mb-2">Why Ride With Me?</h2>
        {highlights.map((h) => (
          <div key={h.title} className="flex gap-4 p-4 rounded-2xl bg-card border border-border">
            <div className="w-12 h-12 rounded-xl gradient-sunset flex items-center justify-center flex-shrink-0">
              <h.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{h.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{h.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Secondary features strip */}
      <section className="max-w-lg mx-auto px-6 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-muted/50 text-center">
            <Camera className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-xs font-medium text-foreground">Share your trips</p>
          </div>
          <div className="p-4 rounded-2xl bg-muted/50 text-center">
            <MessageCircle className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-xs font-medium text-foreground">Encrypted chat</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-lg mx-auto px-6 pb-16 text-center">
        <Button onClick={onGetStarted} size="lg" className="w-full gradient-sunset text-primary-foreground shadow-lg">
          Join the journey
        </Button>
        <p className="text-xs text-muted-foreground mt-3">Already have an account? Tap above to sign in.</p>
      </section>
    </div>
  );
}
