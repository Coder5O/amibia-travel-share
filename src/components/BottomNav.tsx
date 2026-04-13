import { Home, Search, Map, MessageCircle, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/search", icon: Search, label: "Search" },
  { path: "/trips", icon: Map, label: "Trips" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 transition-colors py-1 px-3 ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <tab.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
