import { useAuth } from "@/contexts/AuthContext";
import DestinationSlideshow from "@/components/DestinationSlideshow";
import PostFeed from "@/components/PostFeed";
import logo from "@/assets/logo.png";

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <img src={logo} alt="Ride With Me" className="w-8 h-8" width={512} height={512} />
        <h1 className="text-xl font-bold text-gradient-sunset">Ride With Me</h1>
      </div>

      {/* Destinations */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-3">Discover Namibia 🇳🇦</h2>
        <DestinationSlideshow />
      </section>

      {/* Feed */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Travel Feed</h2>
        <PostFeed />
      </section>
    </div>
  );
}
