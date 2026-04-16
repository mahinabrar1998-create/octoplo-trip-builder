import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Coins,
  Sparkles,
  Loader2,
  ChevronDown,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  CloudLightning,
  CloudSun,
  Navigation,
  Thermometer,
  Plane,
  Hotel,
  Star,
  ArrowRight,
  Luggage,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import SoothingGradient from "@/components/SoothingGradient";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Weather = {
  condition: "sunny" | "partly-cloudy" | "cloudy" | "rainy" | "stormy" | "snowy" | "windy";
  highTemp: number;
  lowTemp: number;
  note: string;
};

type TimeBlock = {
  time: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  estimatedCost: string;
  category: "food" | "activity" | "transport" | "accommodation" | "free-time";
  transportNote?: string;
  weatherConsideration?: string;
};

type Day = {
  dayNumber: number;
  date: string;
  weather: Weather;
  blocks: TimeBlock[];
};

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

type HotelType = {
  name: string;
  address: string;
  neighborhood: string;
  starRating: number;
  estimatedCostPerNight: string;
  totalEstimatedCost: string;
  amenities: string[];
  whyRecommended: string;
  checkIn: string;
  checkOut: string;
  bookingTip: string;
};

type TripPlan = {
  name: string;
  theme: string;
  summary: string;
  flights?: Flights;
  hotel?: HotelType;
  days: Day[];
  estimatedTotalCost: string;
  highlights: string[];
  packingTips?: string[];
};

type PublishedTripData = {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  plan: TripPlan;
  hero_image_url: string;
  created_at: string;
  name: string | null;
};

const categoryColors: Record<string, string> = {
  food: "bg-orange-100 text-orange-700 border-orange-200",
  activity: "bg-blue-100 text-blue-700 border-blue-200",
  transport: "bg-purple-100 text-purple-700 border-purple-200",
  accommodation: "bg-green-100 text-green-700 border-green-200",
  "free-time": "bg-gray-100 text-gray-700 border-gray-200",
};

const WeatherIcon = ({ condition }: { condition: Weather["condition"] }) => {
  const iconClass = "w-5 h-5";
  switch (condition) {
    case "sunny":
      return <Sun className={cn(iconClass, "text-yellow-500")} />;
    case "partly-cloudy":
      return <CloudSun className={cn(iconClass, "text-yellow-400")} />;
    case "cloudy":
      return <Cloud className={cn(iconClass, "text-gray-400")} />;
    case "rainy":
      return <CloudRain className={cn(iconClass, "text-blue-400")} />;
    case "stormy":
      return <CloudLightning className={cn(iconClass, "text-purple-500")} />;
    case "snowy":
      return <CloudSnow className={cn(iconClass, "text-blue-200")} />;
    case "windy":
      return <Wind className={cn(iconClass, "text-teal-400")} />;
    default:
      return <Sun className={cn(iconClass, "text-yellow-500")} />;
  }
};

const PublishedTrip = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [tripData, setTripData] = useState<PublishedTripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDays, setOpenDays] = useState<number[]>([1]);

  const toggleDay = (dayNumber: number) => {
    setOpenDays((prev) =>
      prev.includes(dayNumber)
        ? prev.filter((d) => d !== dayNumber)
        : [...prev, dayNumber]
    );
  };

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) {
        setError("Trip not found");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("published_trips")
          .select("*")
          .eq("id", tripId)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Trip not found");

        setTripData(data as unknown as PublishedTripData);
      } catch (err) {
        console.error("Error fetching trip:", err);
        setError("Trip not found or has been removed");
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
        <SoothingGradient />
        <div className="relative z-10">
          <MountainClimber message="Loading your trip..." />
        </div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <SoothingGradient />
        <div className="relative z-10 text-center space-y-4 p-8">
          <div className="text-6xl">🗺️</div>
          <h1 className="text-2xl font-bold text-foreground">Trip Not Found</h1>
          <p className="text-muted-foreground">{error || "This trip may have been removed or the link is incorrect."}</p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline">
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  const { plan } = tripData;

  return (
    <div className="min-h-screen bg-background relative">
      <SoothingGradient />

      {/* Header */}
      <header className="relative z-10 p-4 md:p-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to Octoplo
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            Saved Plan
          </div>
        </div>
      </header>

      {/* Plan Header */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            {plan.theme}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {plan.name}
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            {plan.summary}
          </p>
          
          <div className="flex items-center justify-center gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1 bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
              <Calendar className="w-3 h-3" />
              {new Date(plan.days[0]?.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(plan.days[plan.days.length - 1]?.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span className="flex items-center gap-1 bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {plan.days.length} days
            </span>
            <span className="flex items-center gap-1 bg-muted text-foreground border border-foreground/20 px-2.5 py-1 rounded-full font-medium">
              {(() => {
                const cost = plan.estimatedTotalCost.split('(')[0].trim();
                const cleanCost = cost.startsWith('$') ? cost.substring(1).trim() : cost;
                return (
                  <>
                    <Coins className="w-3 h-3" />
                    {cleanCost}
                  </>
                );
              })()}
            </span>
          </div>
        </div>

        {/* Packing Tips */}
        {plan.packingTips && plan.packingTips.length > 0 && (
          <div className="bg-card rounded-xl p-4 mb-4 border border-border/50 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Luggage className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground text-sm">Packing Tips</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {plan.packingTips.slice(0, 3).map((tip, i) => (
                <span key={i} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                  {tip}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Flights Section */}
        {plan.flights && (
          <div className="bg-card rounded-xl p-4 mb-4 border border-border/50 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <Plane className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground text-sm">Flights</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase">Outbound</span>
                  <span className="text-xs text-muted-foreground">{plan.flights.outbound.class}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-medium text-foreground">{plan.flights.outbound.airline}</span>
                  <span className="text-xs text-muted-foreground">{plan.flights.outbound.flightNumber}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{plan.flights.outbound.departure}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{plan.flights.outbound.arrival}</span>
                  <span className="ml-auto font-medium text-foreground">{plan.flights.outbound.estimatedCost}</span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase">Return</span>
                  <span className="text-xs text-muted-foreground">{plan.flights.return.class}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-medium text-foreground">{plan.flights.return.airline}</span>
                  <span className="text-xs text-muted-foreground">{plan.flights.return.flightNumber}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{plan.flights.return.departure}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{plan.flights.return.arrival}</span>
                  <span className="ml-auto font-medium text-foreground">{plan.flights.return.estimatedCost}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hotel Section */}
        {plan.hotel && (
          <div className="bg-card rounded-xl p-4 mb-4 border border-border/50 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <Hotel className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground text-sm">Accommodation</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-foreground text-sm">{plan.hotel.name}</div>
                  <div className="text-xs text-muted-foreground">{plan.hotel.neighborhood}</div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(plan.hotel.starRating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{plan.hotel.estimatedCostPerNight}/night</span>
                <span className="font-medium text-foreground">{plan.hotel.totalEstimatedCost} total</span>
              </div>
              {plan.hotel.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {plan.hotel.amenities.slice(0, 4).map((a, i) => (
                    <span key={i} className="text-xs bg-background text-muted-foreground px-2 py-0.5 rounded">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Day-by-Day Itinerary */}
        <div className="space-y-3">
          {plan.days.map((day) => (
            <Collapsible
              key={day.dayNumber}
              open={openDays.includes(day.dayNumber)}
              onOpenChange={() => toggleDay(day.dayNumber)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="bg-card rounded-xl p-3 border border-border/50 shadow-soft hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {day.dayNumber}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-foreground text-sm">Day {day.dayNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                        <WeatherIcon condition={day.weather.condition} />
                        <Thermometer className="w-3 h-3" />
                        <span>{day.weather.highTemp}°/{day.weather.lowTemp}°</span>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        openDays.includes(day.dayNumber) && "rotate-180"
                      )} />
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="mt-2 space-y-2 pl-2">
                  {day.blocks.map((block, blockIndex) => (
                    <div
                      key={blockIndex}
                      className="bg-card rounded-lg p-3 border border-border/30 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-muted-foreground pt-0.5 w-20 flex-shrink-0 leading-relaxed">
                          {block.time} - {block.endTime || "—"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full border capitalize",
                              categoryColors[block.category]
                            )}>
                              {block.category}
                            </span>
                            {block.estimatedCost && block.estimatedCost !== "$0" && (
                              <span className="text-xs text-muted-foreground">{block.estimatedCost}</span>
                            )}
                          </div>
                          <h4 className="font-medium text-foreground text-sm">{block.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{block.description}</p>
                          {block.location && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {block.location}
                            </div>
                          )}
                          {block.transportNote && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                              <Navigation className="w-3 h-3" />
                              {block.transportNote}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublishedTrip;
