import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Users, DollarSign, Plus, X, Calculator, Check, Clock } from "lucide-react";

interface Trip {
  id: string;
  user_id: string;
  destination: string;
  departure_date: string;
  return_date: string | null;
  available_seats: number;
  budget: number | null;
  cost_split_method: string;
  description: string | null;
  region: string | null;
  status: string;
  created_at: string;
  profile?: { display_name: string; category: string };
}

export default function TripBoardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showCalc, setShowCalc] = useState<string | null>(null);
  const [calcPeople, setCalcPeople] = useState(2);
  const [form, setForm] = useState({
    destination: "",
    departure_date: "",
    return_date: "",
    available_seats: "2",
    budget: "",
    cost_split_method: "equal",
    description: "",
    region: "",
  });

  const [participants, setParticipants] = useState<Record<string, any[]>>({});
  const [myRequests, setMyRequests] = useState<Record<string, string>>({}); // trip_id -> status

  useEffect(() => { loadTrips(); }, []);
  useEffect(() => { if (user) loadParticipantData(); }, [user, trips.length]);

  const loadTrips = async () => {
    const { data } = await supabase.from("trips").select("*").eq("status", "open").order("departure_date", { ascending: true });
    if (data) {
      const userIds = [...new Set(data.map((t) => t.user_id))];
      const { data: profiles } = userIds.length ? await supabase.from("profiles").select("user_id, display_name, category").in("user_id", userIds) : { data: [] };
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p] as const));
      setTrips(data.map((t) => ({ ...t, profile: profileMap.get(t.user_id) as any })));
    }
  };

  const loadParticipantData = async () => {
    if (!user || !trips.length) return;
    const tripIds = trips.map((t) => t.id);
    const { data } = await supabase.from("trip_participants").select("*").in("trip_id", tripIds);
    if (!data) return;
    const grouped: Record<string, any[]> = {};
    const mine: Record<string, string> = {};
    for (const p of data) {
      grouped[p.trip_id] = grouped[p.trip_id] || [];
      grouped[p.trip_id].push(p);
      if (p.user_id === user.id) mine[p.trip_id] = p.status;
    }
    setParticipants(grouped);
    setMyRequests(mine);
  };

  const requestToJoin = async (tripId: string) => {
    if (!user) return;
    const { error } = await supabase.from("trip_participants").insert({ trip_id: tripId, user_id: user.id });
    if (error) toast({ title: "Couldn't request", description: error.message, variant: "destructive" });
    else { toast({ title: "Request sent! 🙋" }); loadParticipantData(); }
  };

  const cancelRequest = async (tripId: string) => {
    if (!user) return;
    await supabase.from("trip_participants").delete().eq("trip_id", tripId).eq("user_id", user.id);
    loadParticipantData();
  };

  const respondToRequest = async (participantId: string, status: "accepted" | "declined") => {
    await supabase.from("trip_participants").update({ status }).eq("id", participantId);
    toast({ title: status === "accepted" ? "Buddy accepted! 🎉" : "Request declined" });
    loadParticipantData();
  };

  const createTrip = async () => {
    if (!user || !form.destination || !form.departure_date) return;
    const { error } = await supabase.from("trips").insert({
      user_id: user.id,
      destination: form.destination,
      departure_date: form.departure_date,
      return_date: form.return_date || null,
      available_seats: parseInt(form.available_seats) || 2,
      budget: form.budget ? parseFloat(form.budget) : null,
      cost_split_method: form.cost_split_method,
      description: form.description || null,
      region: form.region || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trip posted! 🗺️" });
      setShowCreate(false);
      setForm({ destination: "", departure_date: "", return_date: "", available_seats: "2", budget: "", cost_split_method: "equal", description: "", region: "" });
      loadTrips();
    }
  };

  const categoryEmoji: Record<string, string> = { has_means: "🚗", needs_ride: "🙋", has_both: "👑" };

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Trip Board</h2>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="gradient-sunset text-primary-foreground">
          {showCreate ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" /> Post Trip</>}
        </Button>
      </div>

      {showCreate && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-6 animate-slide-in space-y-3">
          <div>
            <Label>Destination</Label>
            <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Sossusvlei" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Departure</Label>
              <Input type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} />
            </div>
            <div>
              <Label>Return</Label>
              <Input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Seats</Label>
              <Input type="number" min="1" value={form.available_seats} onChange={(e) => setForm({ ...form, available_seats: e.target.value })} />
            </div>
            <div>
              <Label>Budget (N$)</Label>
              <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="5000" />
            </div>
          </div>
          <div>
            <Label>Split Method</Label>
            <div className="flex gap-2 mt-1">
              {["equal", "driver-pays-fuel", "percentage"].map((m) => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, cost_split_method: m })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.cost_split_method === m ? "gradient-sunset text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {m.replace(/-/g, " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Weekend road trip..." rows={2} className="resize-none" />
          </div>
          <Button onClick={createTrip} className="w-full gradient-sunset text-primary-foreground">Post Trip</Button>
        </div>
      )}

      <div className="space-y-3">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-card rounded-2xl border border-border p-4 animate-fade-in">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary" /> {trip.destination}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {categoryEmoji[trip.profile?.category || ""] || ""} {trip.profile?.display_name || "Traveler"}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{trip.status}</span>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(trip.departure_date).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {trip.available_seats} seats</span>
              {trip.budget && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> N${trip.budget}</span>}
            </div>

            {trip.description && <p className="text-sm text-foreground mb-3">{trip.description}</p>}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowCalc(showCalc === trip.id ? null : trip.id)} className="text-xs">
                <Calculator className="w-3 h-3 mr-1" /> Split Cost
              </Button>

              {user && trip.user_id !== user.id && (
                myRequests[trip.id] === "pending" ? (
                  <Button size="sm" variant="outline" onClick={() => cancelRequest(trip.id)} className="text-xs">
                    <Clock className="w-3 h-3 mr-1" /> Pending — cancel
                  </Button>
                ) : myRequests[trip.id] === "accepted" ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> You're in!
                  </span>
                ) : myRequests[trip.id] === "declined" ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Declined</span>
                ) : (
                  <Button size="sm" onClick={() => requestToJoin(trip.id)} className="gradient-sunset text-primary-foreground text-xs">
                    <Users className="w-3 h-3 mr-1" /> Request to Join
                  </Button>
                )
              )}
            </div>

            {/* Owner: incoming join requests */}
            {user && trip.user_id === user.id && participants[trip.id]?.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-muted/50 space-y-2">
                <p className="text-xs font-semibold text-foreground">Join requests ({participants[trip.id].length})</p>
                {participants[trip.id].map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{p.user_id.slice(0, 8)}… <span className="text-muted-foreground">· {p.status}</span></span>
                    {p.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => respondToRequest(p.id, "accepted")}><Check className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => respondToRequest(p.id, "declined")}><X className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showCalc === trip.id && trip.budget && (
              <div className="mt-3 p-3 rounded-xl bg-muted animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-xs">People:</Label>
                  <Input type="number" min="2" value={calcPeople} onChange={(e) => setCalcPeople(parseInt(e.target.value) || 2)} className="w-16 h-8 text-xs" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  N${(Number(trip.budget) / calcPeople).toFixed(2)} per person
                </p>
              </div>
            )}
          </div>
        ))}

        {trips.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No trips posted yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
