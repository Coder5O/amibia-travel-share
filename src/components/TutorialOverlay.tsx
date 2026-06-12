import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, Download, MapPin, Users, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const SLIDES = [
  {
    title: "Welcome to VoyageBuddy! 🇳🇦",
    description: "The premier travel-sharing community for exploring Namibia and beyond. Let's get you up to speed on how everything works.",
    icon: Heart,
    color: "text-red-500",
  },
  {
    title: "Find Your Perfect Travel Buddy",
    description: "Use the Search tab to browse verified profiles. Filter by town, trip type, or category (whether they have a car, need a ride, or both!).",
    icon: Users,
    color: "text-blue-500",
  },
  {
    title: "The Trip Board",
    description: "Got a journey planned? Post a trip specifying your Origin, Waypoints, and Destination. Other users can request to join and split the fuel costs.",
    icon: MapPin,
    color: "text-green-500",
  },
  {
    title: "Trust & Safety First",
    description: "Look for the blue Verification Badge on profiles. Always check a user's Star Rating before traveling, and share your trip details with family.",
    icon: ShieldCheck,
    color: "text-purple-500",
  }
];

export default function TutorialOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Check if user has already seen the tutorial
    const hasSeen = localStorage.getItem("voyagebuddy_tutorial_seen");
    if (!hasSeen) {
      // Small delay for smooth entry
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("voyagebuddy_tutorial_seen", "true");
    setIsVisible(false);
  };

  const handleDownloadGuide = () => {
    const link = document.createElement('a');
    link.href = '/VoyageBuddy_InDepth_Guide.html';
    link.download = 'VoyageBuddy_InDepth_Guide.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isVisible) return null;

  const SlideIcon = SLIDES[currentSlide].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-card w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Quick Tour ({currentSlide + 1}/{SLIDES.length})
          </span>
          <button onClick={dismiss} className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center text-center flex-1 overflow-y-auto">
          <div className={`w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 shadow-inner`}>
            <SlideIcon className={`w-10 h-10 ${SLIDES[currentSlide].color}`} />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">{SLIDES[currentSlide].title}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {SLIDES[currentSlide].description}
          </p>

          {currentSlide === SLIDES.length - 1 && (
            <div className="mt-8 p-4 bg-primary/10 rounded-2xl border border-primary/20 w-full animate-fade-in">
              <h3 className="font-bold text-primary mb-2 text-sm">Need more details?</h3>
              <p className="text-xs text-muted-foreground mb-3">
                You can download our full, in-depth guide directly to your device for offline reading.
              </p>
              <Button onClick={handleDownloadGuide} variant="outline" className="w-full text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Download className="w-3 h-3 mr-2" /> Download In-Depth Guide
              </Button>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {currentSlide < SLIDES.length - 1 ? (
            <Button onClick={() => setCurrentSlide(prev => prev + 1)} className="gradient-sunset text-primary-foreground">
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={dismiss} className="gradient-sunset text-primary-foreground">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
