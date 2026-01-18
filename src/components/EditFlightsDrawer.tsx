import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Check, X, Plane } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type FlightInfo = {
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  duration: string;
  estimatedCost: string;
  class: string;
  note: string;
};

type Flights = {
  outbound: FlightInfo;
  return: FlightInfo;
};

type FlightSuggestion = {
  airline: string;
  departure: string;
  arrival: string;
  duration: string;
  estimatedCost: string;
  reason: string;
};

interface EditFlightsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flights: Flights | null;
  destination: string;
  tripDates: { start: string; end: string };
  onSave: (updatedFlights: Flights) => void;
}

export function EditFlightsDrawer({
  open,
  onOpenChange,
  flights,
  destination,
  tripDates,
  onSave,
}: EditFlightsDrawerProps) {
  const { toast } = useToast();
  const [editedFlights, setEditedFlights] = useState<Flights | null>(null);
  const [suggestions, setSuggestions] = useState<{ outbound: FlightSuggestion[]; return: FlightSuggestion[] }>({ outbound: [], return: [] });
  const [loadingSuggestions, setLoadingSuggestions] = useState<"outbound" | "return" | null>(null);
  const [activeTab, setActiveTab] = useState<"outbound" | "return">("outbound");

  useEffect(() => {
    if (flights && open) {
      setEditedFlights({ ...flights });
    }
  }, [flights, open]);

  const handleGetSuggestions = async (type: "outbound" | "return") => {
    if (!editedFlights) return;

    setLoadingSuggestions(type);

    try {
      const { data, error } = await supabase.functions.invoke("suggest-alternatives", {
        body: {
          block: {
            time: editedFlights[type].departure,
            endTime: editedFlights[type].arrival,
            title: `${editedFlights[type].airline} Flight`,
            description: `${type === "outbound" ? "Outbound" : "Return"} flight to ${destination}`,
            location: destination,
            estimatedCost: editedFlights[type].estimatedCost,
            category: "transport",
          },
          destination,
          tripDates,
          context: `Looking for alternative ${type} flights. Current: ${editedFlights[type].airline} ${editedFlights[type].flightNumber}`,
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        const flightSuggestions = data.suggestions.map((s: any) => ({
          airline: s.title.replace(" Flight", "").replace("Flight with ", ""),
          departure: s.location.split(" to ")[0] || editedFlights[type].departure,
          arrival: s.location.split(" to ")[1] || editedFlights[type].arrival,
          duration: editedFlights[type].duration,
          estimatedCost: s.estimatedCost,
          reason: s.reason,
        }));
        setSuggestions(prev => ({ ...prev, [type]: flightSuggestions }));
      }
    } catch (err) {
      console.error("Error getting flight suggestions:", err);
      toast({
        title: "Couldn't get suggestions",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestions(null);
    }
  };

  const applySuggestion = (suggestion: FlightSuggestion, type: "outbound" | "return") => {
    if (!editedFlights) return;
    setEditedFlights({
      ...editedFlights,
      [type]: {
        ...editedFlights[type],
        airline: suggestion.airline,
        estimatedCost: suggestion.estimatedCost,
        note: suggestion.reason,
      },
    });
    setSuggestions(prev => ({ ...prev, [type]: [] }));
    toast({ title: "Suggestion applied" });
  };

  const handleSave = () => {
    if (!editedFlights) return;
    onSave(editedFlights);
    onOpenChange(false);
    setSuggestions({ outbound: [], return: [] });
  };

  const handleClose = () => {
    onOpenChange(false);
    setSuggestions({ outbound: [], return: [] });
  };

  if (!flights || !editedFlights) return null;

  const currentFlight = editedFlights[activeTab];
  const currentSuggestions = suggestions[activeTab];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Edit Flights
            </DrawerTitle>
            <DrawerDescription>
              {tripDates.start} to {tripDates.end}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            {/* Tab Switcher */}
            <div className="flex gap-2">
              <Button
                variant={activeTab === "outbound" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("outbound")}
                className="flex-1"
              >
                Outbound
              </Button>
              <Button
                variant={activeTab === "return" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("return")}
                className="flex-1"
              >
                Return
              </Button>
            </div>

            {/* AI Suggestions */}
            <Button
              variant="outline"
              onClick={() => handleGetSuggestions(activeTab)}
              disabled={loadingSuggestions !== null}
              className="w-full gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
            >
              {loadingSuggestions === activeTab ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding alternatives...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-primary" />
                  Get AI Flight Suggestions
                </>
              )}
            </Button>

            {currentSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">AI Alternatives:</p>
                {currentSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => applySuggestion(suggestion, activeTab)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">{suggestion.airline}</span>
                      <span className="text-xs text-muted-foreground">{suggestion.estimatedCost}</span>
                    </div>
                    <p className="text-xs text-primary">{suggestion.reason}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Edit Form */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Airline</Label>
                  <Input
                    value={currentFlight.airline}
                    onChange={(e) => setEditedFlights({
                      ...editedFlights,
                      [activeTab]: { ...currentFlight, airline: e.target.value }
                    })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Flight Number</Label>
                  <Input
                    value={currentFlight.flightNumber}
                    onChange={(e) => setEditedFlights({
                      ...editedFlights,
                      [activeTab]: { ...currentFlight, flightNumber: e.target.value }
                    })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Departure</Label>
                  <Input
                    value={currentFlight.departure}
                    onChange={(e) => setEditedFlights({
                      ...editedFlights,
                      [activeTab]: { ...currentFlight, departure: e.target.value }
                    })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Arrival</Label>
                  <Input
                    value={currentFlight.arrival}
                    onChange={(e) => setEditedFlights({
                      ...editedFlights,
                      [activeTab]: { ...currentFlight, arrival: e.target.value }
                    })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Duration</Label>
                  <Input
                    value={currentFlight.duration}
                    onChange={(e) => setEditedFlights({
                      ...editedFlights,
                      [activeTab]: { ...currentFlight, duration: e.target.value }
                    })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cost</Label>
                  <Input
                    value={currentFlight.estimatedCost}
                    onChange={(e) => setEditedFlights({
                      ...editedFlights,
                      [activeTab]: { ...currentFlight, estimatedCost: e.target.value }
                    })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Class</Label>
                  <Input
                    value={currentFlight.class}
                    onChange={(e) => setEditedFlights({
                      ...editedFlights,
                      [activeTab]: { ...currentFlight, class: e.target.value }
                    })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2">
            <DrawerClose asChild>
              <Button variant="outline" onClick={handleClose} className="flex-1 gap-1">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </DrawerClose>
            <Button onClick={handleSave} className="flex-1 gap-1">
              <Check className="w-4 h-4" />
              Save Changes
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
