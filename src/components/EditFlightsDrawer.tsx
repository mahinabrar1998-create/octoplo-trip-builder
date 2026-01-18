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
import { Sparkles, Loader2, Check, X, Plane, MapPin, Navigation } from "lucide-react";
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
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  estimatedCost: string;
  class: string;
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

// Map of major cities to their airport codes
const cityToAirport: Record<string, string> = {
  "new york": "JFK",
  "los angeles": "LAX",
  "chicago": "ORD",
  "houston": "IAH",
  "phoenix": "PHX",
  "philadelphia": "PHL",
  "san antonio": "SAT",
  "san diego": "SAN",
  "dallas": "DFW",
  "san jose": "SJC",
  "austin": "AUS",
  "jacksonville": "JAX",
  "san francisco": "SFO",
  "columbus": "CMH",
  "indianapolis": "IND",
  "seattle": "SEA",
  "denver": "DEN",
  "washington": "DCA",
  "boston": "BOS",
  "nashville": "BNA",
  "detroit": "DTW",
  "portland": "PDX",
  "las vegas": "LAS",
  "memphis": "MEM",
  "louisville": "SDF",
  "baltimore": "BWI",
  "milwaukee": "MKE",
  "albuquerque": "ABQ",
  "tucson": "TUS",
  "fresno": "FAT",
  "sacramento": "SMF",
  "miami": "MIA",
  "atlanta": "ATL",
  "london": "LHR",
  "paris": "CDG",
  "tokyo": "NRT",
  "sydney": "SYD",
  "dubai": "DXB",
  "singapore": "SIN",
  "hong kong": "HKG",
  "bangkok": "BKK",
  "rome": "FCO",
  "barcelona": "BCN",
  "amsterdam": "AMS",
  "frankfurt": "FRA",
  "munich": "MUC",
  "zurich": "ZRH",
  "toronto": "YYZ",
  "vancouver": "YVR",
  "montreal": "YUL",
  "mexico city": "MEX",
  "cancun": "CUN",
  "sao paulo": "GRU",
  "buenos aires": "EZE",
  "lima": "LIM",
  "bogota": "BOG",
  "cairo": "CAI",
  "johannesburg": "JNB",
  "cape town": "CPT",
  "istanbul": "IST",
  "mumbai": "BOM",
  "delhi": "DEL",
  "beijing": "PEK",
  "shanghai": "PVG",
  "seoul": "ICN",
  "manila": "MNL",
  "bali": "DPS",
  "hawaii": "HNL",
  "honolulu": "HNL",
};

function getAirportCode(city: string): string {
  const normalized = city.toLowerCase().trim();
  for (const [key, code] of Object.entries(cityToAirport)) {
    if (normalized.includes(key)) {
      return code;
    }
  }
  // Return first 3 letters uppercase as fallback
  return city.substring(0, 3).toUpperCase();
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
  const [userLocation, setUserLocation] = useState<string>("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    if (flights && open) {
      setEditedFlights({ ...flights });
    }
  }, [flights, open]);

  // Auto-detect user location on first open
  useEffect(() => {
    if (open && !userLocation) {
      detectUserLocation();
    }
  }, [open]);

  const detectUserLocation = async () => {
    setDetectingLocation(true);
    try {
      // Try to get location from browser geolocation
      if ("geolocation" in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 300000, // Cache for 5 minutes
          });
        });

        // Use reverse geocoding to get city name
        const { latitude, longitude } = position.coords;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        
        if (response.ok) {
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state;
          if (city) {
            setUserLocation(city);
            toast({
              title: "Location detected",
              description: `Departure from ${city}`,
            });
            return;
          }
        }
      }
    } catch (error) {
      console.log("Could not detect location:", error);
    } finally {
      setDetectingLocation(false);
    }

    // Fallback: Ask user to enter manually
    toast({
      title: "Enter your departure city",
      description: "We couldn't detect your location automatically.",
    });
  };

  const handleGetSuggestions = async (type: "outbound" | "return") => {
    if (!editedFlights) return;
    
    if (!userLocation) {
      toast({
        title: "Enter departure city",
        description: "Please enter your departure city first.",
        variant: "destructive",
      });
      return;
    }

    setLoadingSuggestions(type);

    try {
      const { data, error } = await supabase.functions.invoke("suggest-flights", {
        body: {
          type,
          origin: userLocation,
          destination,
          departureDate: type === "outbound" ? tripDates.start : tripDates.end,
          currentFlight: editedFlights[type].airline ? {
            airline: editedFlights[type].airline,
            flightNumber: editedFlights[type].flightNumber,
            departure: editedFlights[type].departure,
            arrival: editedFlights[type].arrival,
          } : undefined,
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(prev => ({ ...prev, [type]: data.suggestions }));
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
    
    const originCode = getAirportCode(userLocation);
    const destCode = getAirportCode(destination);
    
    setEditedFlights({
      ...editedFlights,
      [type]: {
        ...editedFlights[type],
        airline: suggestion.airline,
        flightNumber: suggestion.flightNumber,
        departure: type === "outbound" 
          ? `${originCode} ${suggestion.departureTime}` 
          : `${destCode} ${suggestion.departureTime}`,
        arrival: type === "outbound" 
          ? `${destCode} ${suggestion.arrivalTime}` 
          : `${originCode} ${suggestion.arrivalTime}`,
        duration: suggestion.duration,
        estimatedCost: suggestion.estimatedCost,
        class: suggestion.class || "Economy",
        note: suggestion.reason,
      },
    });
    setSuggestions(prev => ({ ...prev, [type]: [] }));
    toast({ title: "Flight details applied" });
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
            {/* Departure City */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Departure City
              </Label>
              <div className="flex gap-2">
                <Input
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  placeholder="Enter your departure city"
                  className="h-9 flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={detectUserLocation}
                  disabled={detectingLocation}
                  className="h-9 gap-1"
                >
                  {detectingLocation ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3" />
                  )}
                  Detect
                </Button>
              </div>
              {userLocation && (
                <p className="text-xs text-muted-foreground">
                  Flying {getAirportCode(userLocation)} ↔ {getAirportCode(destination)}
                </p>
              )}
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2">
              <Button
                variant={activeTab === "outbound" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("outbound")}
                className="flex-1"
              >
                Outbound ({tripDates.start})
              </Button>
              <Button
                variant={activeTab === "return" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("return")}
                className="flex-1"
              >
                Return ({tripDates.end})
              </Button>
            </div>

            {/* AI Suggestions */}
            <Button
              variant="outline"
              onClick={() => handleGetSuggestions(activeTab)}
              disabled={loadingSuggestions !== null || !userLocation}
              className="w-full gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
            >
              {loadingSuggestions === activeTab ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding flights...
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
                <p className="text-xs text-muted-foreground font-medium">AI Flight Options:</p>
                {currentSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => applySuggestion(suggestion, activeTab)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">
                        {suggestion.airline} {suggestion.flightNumber}
                      </span>
                      <span className="text-xs font-medium text-primary">{suggestion.estimatedCost}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{suggestion.departureTime}</span>
                      <span>→</span>
                      <span>{suggestion.arrivalTime}</span>
                      <span className="text-muted-foreground/60">({suggestion.duration})</span>
                    </div>
                    <p className="text-xs text-primary/80">{suggestion.reason}</p>
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
                    placeholder="e.g., United Airlines"
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
                    placeholder="e.g., UA1234"
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
                    placeholder="e.g., JFK 08:30"
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
                    placeholder="e.g., LAX 11:45"
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
                    placeholder="e.g., 5h 15m"
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
                    placeholder="e.g., $350"
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
                    placeholder="Economy"
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
