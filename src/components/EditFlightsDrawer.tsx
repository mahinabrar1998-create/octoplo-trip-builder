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
import { Sparkles, Loader2, Check, X, Plane, MapPin, Navigation, Search, AlertCircle } from "lucide-react";
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

type RealFlightResult = {
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: string;
  currency: string;
  cabinClass: string;
  departureAirport: string;
  arrivalAirport: string;
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
  "virginia": "IAD",
  "northern virginia": "IAD",
};

function getAirportCode(city: string): string {
  const normalized = city.toLowerCase().trim();
  for (const [key, code] of Object.entries(cityToAirport)) {
    if (normalized.includes(key)) {
      return code;
    }
  }
  // If it looks like an airport code already (3 letters uppercase), return as-is
  if (/^[A-Z]{3}$/.test(city.trim())) {
    return city.trim();
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
  const [flightResults, setFlightResults] = useState<{ outbound: RealFlightResult[]; return: RealFlightResult[] }>({ outbound: [], return: [] });
  const [searching, setSearching] = useState<"outbound" | "return" | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
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
      if ("geolocation" in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 300000,
          });
        });

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
              description: `Departure from ${city} (${getAirportCode(city)})`,
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

    toast({
      title: "Enter your departure city",
      description: "We couldn't detect your location automatically.",
    });
  };

  const searchRealFlights = async (type: "outbound" | "return") => {
    if (!userLocation) {
      toast({
        title: "Enter departure city",
        description: "Please enter your departure city or airport code first.",
        variant: "destructive",
      });
      return;
    }

    setSearching(type);
    setSearchError(null);

    try {
      const originCode = getAirportCode(type === "outbound" ? userLocation : destination);
      const destCode = getAirportCode(type === "outbound" ? destination : userLocation);
      const date = type === "outbound" ? tripDates.start : tripDates.end;

      console.log(`Searching ${type} flights: ${originCode} → ${destCode} on ${date}`);

      const { data, error } = await supabase.functions.invoke("search-flights", {
        body: {
          origin: originCode,
          destination: destCode,
          departureDate: date,
          adults: 1,
          maxResults: 3,
        },
      });

      if (error) throw error;

      if (data?.error) {
        setSearchError(data.error);
        toast({
          title: "Search failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data?.flights && data.flights.length > 0) {
        setFlightResults(prev => ({ ...prev, [type]: data.flights }));
        toast({
          title: `Found ${data.flights.length} flights`,
          description: "Real-time results from Amadeus",
        });
      } else {
        setSearchError("No flights found for this route and date.");
        toast({
          title: "No flights found",
          description: "Try different dates or check airport codes.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error searching flights:", err);
      setSearchError("Failed to search flights. Please try again.");
      toast({
        title: "Search error",
        description: "Could not connect to flight search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(null);
    }
  };

  const selectFlight = (flight: RealFlightResult, type: "outbound" | "return") => {
    if (!editedFlights) return;
    
    setEditedFlights({
      ...editedFlights,
      [type]: {
        ...editedFlights[type],
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        departure: `${flight.departureAirport} ${flight.departureTime}`,
        arrival: `${flight.arrivalAirport} ${flight.arrivalTime}`,
        duration: flight.duration,
        estimatedCost: `$${flight.price}`,
        class: flight.cabinClass,
        note: flight.stops === 0 ? "Direct flight" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`,
      },
    });
    setFlightResults(prev => ({ ...prev, [type]: [] }));
    toast({ title: "Flight selected" });
  };

  const handleSave = () => {
    if (!editedFlights) return;
    onSave(editedFlights);
    onOpenChange(false);
    setFlightResults({ outbound: [], return: [] });
  };

  const handleClose = () => {
    onOpenChange(false);
    setFlightResults({ outbound: [], return: [] });
    setSearchError(null);
  };

  if (!flights || !editedFlights) return null;

  const currentFlight = editedFlights[activeTab];
  const currentResults = flightResults[activeTab];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Search Flights
            </DrawerTitle>
            <DrawerDescription>
              Real-time flight search powered by Amadeus
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            {/* Departure City */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Departure City / Airport Code
              </Label>
              <div className="flex gap-2">
                <Input
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  placeholder="e.g., New York or JFK"
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
                  Route: {getAirportCode(userLocation)} ↔ {getAirportCode(destination)}
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
                Outbound ({tripDates.start.split("T")[0]})
              </Button>
              <Button
                variant={activeTab === "return" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("return")}
                className="flex-1"
              >
                Inbound ({tripDates.end.split("T")[0]})
              </Button>
            </div>

            {/* Search Button */}
            <Button
              onClick={() => searchRealFlights(activeTab)}
              disabled={searching !== null || !userLocation}
              className="w-full gap-2"
            >
              {searching === activeTab ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching flights...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Real Flights
                </>
              )}
            </Button>

            {/* Search Error */}
            {searchError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {searchError}
              </div>
            )}

            {/* Flight Results */}
            {currentResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Live Flight Results:
                </p>
                {currentResults.map((flight, i) => (
                  <button
                    key={i}
                    onClick={() => selectFlight(flight, activeTab)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {flight.airline}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        ${flight.price}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{flight.flightNumber}</span>
                      <span>•</span>
                      <span>{flight.departureAirport} {flight.departureTime}</span>
                      <span>→</span>
                      <span>{flight.arrivalAirport} {flight.arrivalTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{flight.duration}</span>
                      <span>•</span>
                      <span>{flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}</span>
                      <span>•</span>
                      <span className="capitalize">{flight.cabinClass.toLowerCase()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Manual Edit Form */}
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">Or enter details manually:</p>
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
