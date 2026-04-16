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
  UserPlus,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import DeleteTripDialog from "@/components/DeleteTripDialog";
import InviteGuestsDrawer from "@/components/InviteGuestsDrawer";
import GuestResponsesSummary from "@/components/GuestResponsesSummary";

type SavedTrip = {
  id: string;
  name: string | null;
  destination: string;
  start_date: string;
  end_date: string;
  created_at: string;
  owner_token?: string;
  plan: {
    name: string;
    days: { dayNumber: number; date: string; blocks: { title: string; time: string; endTime: string }[] }[];
  };
};

// Helper to get owner tokens from localStorage
const getOwnerTokens = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem("trip_owner_tokens") || "{}");
  } catch {
    return {};
  }
};

// Helper to check if current user owns a trip
const isOwnedTrip = (tripId: string): boolean => {
  const tokens = getOwnerTokens();
  return !!tokens[tripId];
};

// Helper to get owner token for a trip
const getOwnerToken = (tripId: string): string | undefined => {
  const tokens = getOwnerTokens();
  return tokens[tripId];
};

const SavedPlans = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<SavedTrip | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Invite state
  const [inviteTarget, setInviteTarget] = useState<SavedTrip | null>(null);
  
  // Responses state
  const [responsesTarget, setResponsesTarget] = useState<SavedTrip | null>(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      // Get trips the user owns (has tokens for)
      const ownerTokens = getOwnerTokens();
      const ownedTripIds = Object.keys(ownerTokens);
      
      if (ownedTripIds.length === 0) {
        setTrips([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("published_trips" as never)
        .select("id, name, destination, start_date, end_date, created_at, plan")
        .in("id", ownedTripIds)
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    const ownerToken = getOwnerToken(deleteTarget.id);
    if (!ownerToken) {
      toast({
        title: "Unauthorized",
        description: "You don't have permission to delete this trip.",
        variant: "destructive",
      });
      setDeleteTarget(null);
      return;
    }
    
    setDeleting(true);
    try {
      // Use secure RPC function to verify ownership and delete
      const { error } = await supabase.rpc("delete_trip_secure", {
        p_trip_id: deleteTarget.id,
        p_owner_token: ownerToken,
      });

      if (error) throw error;
      
      // Remove from localStorage
      const tokens = getOwnerTokens();
      delete tokens[deleteTarget.id];
      localStorage.setItem("trip_owner_tokens", JSON.stringify(tokens));
      
      setTrips((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast({ title: "Trip deleted" });
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting trip:", err);
      toast({
        title: "Error",
        description: "Failed to delete trip. You may not have permission.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
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
        <div className="relative z-10">
          <MountainClimber message="Loading your saved plans..." />
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
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground break-words sm:truncate">
                            {trip.name || trip.plan?.name || `Trip to ${trip.destination}`}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 min-w-0">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{trip.destination}</span>
                          </div>
                          <div className="mt-2 grid gap-1.5 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                            <span className="flex items-start gap-1 min-w-0">
                              <Calendar className="w-3 h-3 shrink-0 mt-0.5" />
                              <span className="min-w-0 break-words">
                                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                              </span>
                            </span>
                            <span className="flex items-start gap-1 min-w-0">
                              <Clock className="w-3 h-3 shrink-0 mt-0.5" />
                              <span className="min-w-0 break-words">
                                {daysCount} days, {activitiesCount} activities
                              </span>
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(trip)}
                          className="text-muted-foreground hover:text-destructive shrink-0 self-end sm:self-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(trip.id)}
                          className="w-full justify-center gap-1 px-2 text-xs sm:w-auto sm:px-3"
                        >
                          {copiedId === trip.id ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Share</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/trip/${trip.id}`, "_blank")}
                          className="w-full justify-center gap-1 px-2 text-xs sm:w-auto sm:px-3"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInviteTarget(trip)}
                          className="w-full justify-center gap-1 px-2 text-xs sm:w-auto sm:px-3"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Invite</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResponsesTarget(trip)}
                          className="w-full justify-center gap-1 px-2 text-xs sm:w-auto sm:px-3"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Responses</span>
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

      {/* Delete Dialog */}
      <DeleteTripDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        tripName={deleteTarget?.name || deleteTarget?.plan?.name || "this trip"}
        loading={deleting}
      />

      {/* Invite Drawer */}
      <InviteGuestsDrawer
        open={!!inviteTarget}
        onOpenChange={(open) => !open && setInviteTarget(null)}
        tripId={inviteTarget?.id || ""}
        tripName={inviteTarget?.name || inviteTarget?.plan?.name || "this trip"}
      />

      {/* Responses Summary Drawer */}
      <GuestResponsesSummary
        open={!!responsesTarget}
        onOpenChange={(open) => !open && setResponsesTarget(null)}
        tripId={responsesTarget?.id || ""}
        tripName={responsesTarget?.name || responsesTarget?.plan?.name || "this trip"}
        days={responsesTarget?.plan?.days || []}
      />
    </div>
  );
};

export default SavedPlans;
