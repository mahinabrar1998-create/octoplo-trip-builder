import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import SoothingGradient from "@/components/SoothingGradient";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type SavedTrip = {
  id: string;
  name: string | null;
  destination: string;
  start_date: string;
  end_date: string;
  created_at: string;
  plan: {
    name: string;
    days: { blocks: unknown[] }[];
  };
};

const SavedPlans = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from("published_trips" as never)
        .select("id, name, destination, start_date, end_date, created_at, plan")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrips((data as unknown as SavedTrip[]) || []);
    } catch (err) {
      console.error("Error fetching trips:", err);
      toast({
        title: "Error loading trips",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (tripId: string) => {
    const url = `${window.location.origin}/trip/${tripId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(tripId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Link copied!",
      description: "Share it with your travel companions.",
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <SoothingGradient />
        <div className="relative z-10 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your saved plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <SoothingGradient />

      {/* Header */}
      <header className="relative z-10 p-4 md:p-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Saved Plans</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {trips.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">No saved plans yet</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Start planning your next adventure and save it here to share with friends and family.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={() => navigate("/generate")} className="gap-2">
                Generate a Trip
              </Button>
              <Button variant="outline" onClick={() => navigate("/build")} className="gap-2">
                Build Your Own
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {trips.length} saved plan{trips.length !== 1 ? "s" : ""}
            </p>
            
            <div className="grid gap-4">
              {trips.map((trip) => {
                const activitiesCount = trip.plan?.days?.reduce(
                  (acc, d) => acc + (d.blocks?.length || 0),
                  0
                ) || 0;
                const daysCount = trip.plan?.days?.length || 0;

                return (
                  <div
                    key={trip.id}
                    className="bg-card rounded-xl p-4 border border-border/50 shadow-soft hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {trip.name || trip.plan?.name || `Trip to ${trip.destination}`}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{trip.destination}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {daysCount} days, {activitiesCount} activities
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(trip.id)}
                          className="gap-1.5"
                        >
                          {copiedId === trip.id ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/trip/${trip.id}`, "_blank")}
                          className="gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPlans;
