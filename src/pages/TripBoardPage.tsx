import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Users, DollarSign, Plus, X, Calculator, Check, Clock, Edit2 } from "lucide-react";
import UserProfileDialog from "@/components/UserProfileDialog";

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
  trip_type?: string | null;
  departure_time?: string | null;
  created_at: string;
  profile?: { display_name: string; category: string; avatar_url: string | null };
}

const WINDHOEK_CLUBS = [
  "Brewers Market",
  "The Boiler Room (Warehouse Theatre)",
  "Chopsi's Bar",
  "XS Lounge",
  "The Social Club",
  "Vinyls Music Lounge",
  "Joe's Beerhouse",
  "Stratos Restaurant and Bar",
  "Mynt Nightclub",
  "Other"
];

export default function TripBoardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showCalc, setShowCalc] = useState<string | null>(null);
  const [calcPeople, setCalcPeople] = useState(2);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [form, setForm] = useState({
    destination: "",
    custom_destination: "",
    departure_date: "",
    departure_time: "",
    return_date: "",
    available_seats: "2",
    budget: "",
    cost_split_method: "equal",
    trip_type: "Day Trip",
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
      const { data: profiles } = userIds.length ? await supabase.from("profiles").select("user_id, display_name, category, avatar_url").in("user_id", userIds) : { data: [] };
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

  const createOrUpdateTrip = async () => {
    const finalDest = form.destination === "Other" ? form.custom_destination : form.destination;
    if (!user || !finalDest || !form.departure_date) return;

    const payload = {
      user_id: user.id,
      destination: finalDest,
      departure_date: form.departure_date,
      departure_time: form.departure_time || null,
      return_date: form.return_date || null,
      available_seats: parseInt(form.available_seats) || 2,
      budget: form.budget ? parseFloat(form.budget) : null,
      cost_split_method: form.cost_split_method,
      trip_type: form.trip_type,
      description: form.description || null,
      region: form.region || null,
    };

    if (editingTripId) {
      const { error } = await supabase.from("trips").update(payload).eq("id", editingTripId);
      if (error) toast({ title: "Error updating", description: error.message, variant: "destructive" });
      else {
        toast({ title: "Trip updated! 🗺️" });
        resetForm();
        loadTrips();
      }
    } else {
      const { error } = await supabase.from("trips").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else {
        toast({ title: "Trip posted! 🗺️" });
        resetForm();
        loadTrips();
      }
    }
  };

  const resetForm = () => {
    setShowCreate(false);
    setEditingTripId(null);
    setForm({ destination: "", custom_destination: "", departure_date: "", departure_time: "", return_date: "", available_seats: "2", budget: "", cost_split_method: "equal", trip_type: "Day Trip", description: "", region: "" });
  };

  const startEdit = (trip: Trip) => {
    const isPreset = WINDHOEK_CLUBS.includes(trip.destination);
    setForm({
      destination: isPreset ? trip.destination : "Other",
      custom_destination: isPreset ? "" : trip.destination,
      departure_date: trip.departure_date,
      departure_time: trip.departure_time || "",
      return_date: trip.return_date || "",
      available_seats: String(trip.available_seats),
      budget: trip.budget ? String(trip.budget) : "",
      cost_split_method: trip.cost_split_method || "equal",
      trip_type: trip.trip_type || "Day Trip",
      description: trip.description || "",
      region: trip.region || "",
    });
    setEditingTripId(trip.id);
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categoryEmoji: Record<string, string> = { has_means: "🚗", needs_ride: "🙋", has_both: "👑" };

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Trip Board</h2>
        <Button size="sm" onClick={() => { if(showCreate) resetForm(); else setShowCreate(true); }} className="gradient-sunset text-primary-foreground">
          {showCreate ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" /> Post Trip</>}
        </Button>
      </div>

      {showCreate && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-6 animate-slide-in space-y-3">
          <div>
            <Label>Destination</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            >
              <option value="" disabled>Select a destination</option>
              {WINDHOEK_CLUBS.map(club => <option key={club} value={club}>{club}</option>)}
            </select>
            {form.destination === "Other" && (
              <Input className="mt-2" value={form.custom_destination} onChange={(e) => setForm({ ...form, custom_destination: e.target.value })} placeholder="Type custom destination" />
            )}
          </div>
          <div>
            <Label>Trip Type</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {["Day Trip", "Weekend", "Road Trip", "Lunch", "Dinner", "Club", "Long Haul"].map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, trip_type: t })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${form.trip_type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Departure</Label>
              <Input type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} />
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
          <Button onClick={createOrUpdateTrip} className="w-full gradient-sunset text-primary-foreground">
            {editingTripId ? "Save Trip" : "Post Trip"}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-card rounded-2xl border border-border p-4 animate-fade-in">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedUserId(trip.user_id)}>
                  {trip.profile?.avatar_url ? (
                    <img src={trip.profile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {trip.profile?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </button>
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-primary" /> {trip.destination}
                  </h3>
                  <button onClick={() => setSelectedUserId(trip.user_id)} className="text-xs text-muted-foreground mt-0.5 text-left hover:underline">
                    {categoryEmoji[trip.profile?.category || ""] || ""} {trip.profile?.display_name || "Traveler"}
                  </button>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{trip.status}</span>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(trip.departure_date).toLocaleDateString()} {trip.departure_time ? `at ${trip.departure_time}` : ""}
              </span>
              {trip.trip_type && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary/50 font-medium text-secondary-foreground">{trip.trip_type}</span>}
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {trip.available_seats} seats</span>
              {trip.budget && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> N${trip.budget}</span>}
            </div>

            {trip.description && <p className="text-sm text-foreground mb-3">{trip.description}</p>}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowCalc(showCalc === trip.id ? null : trip.id)} className="text-xs">
                <Calculator className="w-3 h-3 mr-1" /> Split Cost
              </Button>

              {user && trip.user_id === user.id && (
                <Button size="sm" variant="ghost" onClick={() => startEdit(trip)} className="text-xs text-muted-foreground hover:text-foreground">
                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                </Button>
              )}

              {user && trip.user_id !== user.id && (
                myRequests[trip.id] === "pending" ? (
                  <Button size="sm" variant="outline" onClick={() => cancelRequest(trip.id)} className="text-xs">
                    <Clock className="w-3 h-3 mr-1" /> Pending — cancel
                  </Button>
                ) : myRequests[trip.id] === "accepted" ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
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
      <UserProfileDialog open={!!selectedUserId} onOpenChange={(o) => !o && setSelectedUserId(null)} userId={selectedUserId} />
    </div>
  );
}
