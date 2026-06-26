import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShieldCheck, Users, Lock, AlertTriangle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categoryIcons: Record<string, { icon: typeof ShieldCheck; color: string }> = {
  safety: { icon: ShieldCheck, color: "text-green-500" },
  conduct: { icon: Users, color: "text-orange-500" },
  privacy: { icon: Lock, color: "text-blue-500" },
  general: { icon: BookOpen, color: "text-purple-500" },
};

export default function CommunityRulesPage() {
  const navigate = useNavigate();
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const { data } = await supabase.from("community_rules").select("*").order("sort_order");
    setRules(data || []);
  };

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Community Rules</h1>
          <p className="text-xs text-muted-foreground">Safety guidelines for all VoyageBuddy travelers</p>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold">🤝 Our Promise:</span> VoyageBuddy is committed to creating a safe, respectful, and enjoyable travel community for everyone in Namibia. Please read and follow these rules.
        </p>
      </div>

      <div className="space-y-3">
        {rules.map((rule, i) => {
          const cat = categoryIcons[rule.category] || categoryIcons.general;
          const Icon = cat.icon;
          return (
            <div key={rule.id} className="bg-card border border-border rounded-xl p-4 flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cat.color} bg-muted`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground mb-1">
                  {i + 1}. {rule.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-foreground">
            <span className="font-semibold">Violations:</span> Users who violate these rules may be warned, temporarily banned, or permanently removed from VoyageBuddy. Repeated or severe violations will result in account deletion.
          </p>
        </div>
      </div>
    </div>
  );
}
