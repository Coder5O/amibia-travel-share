import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SOSButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      supabase.from("emergency_contacts").select("*").eq("user_id", user.id)
        .then(({ data }) => setContacts(data || []));
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
          () => setLocation(null)
        );
      }
    }
  }, [open, user]);

  const callContact = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const shareLocation = (phone: string) => {
    if (!location) {
      toast({ title: "Location unavailable", description: "Allow location access to share.", variant: "destructive" });
      return;
    }
    const msg = encodeURIComponent(`🚨 SOS! I need help. My location: https://maps.google.com/?q=${location}`);
    window.location.href = `sms:${phone}?body=${msg}`;
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Emergency SOS"
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-destructive text-destructive-foreground shadow-2xl flex items-center justify-center hover:scale-105 transition-transform animate-pulse-slow"
      >
        <AlertTriangle className="w-6 h-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Emergency SOS
            </DialogTitle>
            <DialogDescription>
              Quickly call or share your location with emergency contacts.
            </DialogDescription>
          </DialogHeader>

          {location && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 px-3 py-2 bg-muted rounded-lg">
              <MapPin className="w-3 h-3" /> {location}
            </div>
          )}

          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No emergency contacts. Add some in your profile under the SOS tab.
            </p>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{c.contact_name}</p>
                    <p className="text-xs text-muted-foreground">{c.relationship || "Contact"} · {c.phone}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline" onClick={() => callContact(c.phone)}><Phone className="w-4 h-4" /></Button>
                    <Button size="icon" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => shareLocation(c.phone)}>
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={() => callContact("10111")} className="w-full">
            <Phone className="w-4 h-4 mr-2" /> Call Police (10111)
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
