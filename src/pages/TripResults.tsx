import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
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
  Globe,
  Check,
  Copy,
  Plane,
  Hotel,
  Star,
  ArrowRight,
} from "lucide-react";
import SoothingGradient from "@/components/SoothingGradient";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

type Hotel = {
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
  hotel?: Hotel;
  days: Day[];
  estimatedTotalCost: string;
  highlights: string[];
  packingTips?: string[];
};

const categoryColors: Record<string, string> = {
  food: "bg-orange-100 text-orange-700 border-orange-200",
  activity: "bg-blue-100 text-blue-700 border-blue-200",
  transport: "bg-purple-100 text-purple-700 border-purple-200",
  accommodation: "bg-green-100 text-green-700 border-green-200",
  "free-time": "bg-gray-100 text-gray-700 border-gray-200",
};

const WeatherIcon = ({ condition }: { condition: Weather["condition"] }) => {
  const iconClass = "w-6 h-6";
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

const TripResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDays, setOpenDays] = useState<number[]>([1]);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tripData = location.state?.tripData;

  const toggleDay = (dayNumber: number) => {
    setOpenDays((prev) =>
      prev.includes(dayNumber)
        ? prev.filter((d) => d !== dayNumber)
        : [...prev, dayNumber]
    );
  };


  // Generate AI hero image for the destination
  const generateHeroImage = async (destination: string, theme: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-hero-image", {
        body: { destination, theme },
      });

      if (error) {
        console.error("Error generating hero image:", error);
        throw error;
      }

      if (data?.imageUrl) {
        return data.imageUrl;
      }

      throw new Error("No image URL returned");
    } catch (err) {
      console.error("Failed to generate hero image:", err);
      // Fallback to a default travel image
      return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop";
    }
  };

  // Generate destination theme colors
  const getDestinationTheme = (destination: string): { primary: string; secondary: string; accent: string; gradient: string } => {
    const dest = destination.toLowerCase();
    
    // Tropical destinations
    if (dest.includes("bali") || dest.includes("hawaii") || dest.includes("maldives") || dest.includes("caribbean") || dest.includes("fiji")) {
      return { primary: "158 64% 52%", secondary: "180 60% 90%", accent: "43 96% 56%", gradient: "from-teal-500/20 via-cyan-400/10 to-yellow-400/20" };
    }
    // European cities
    if (dest.includes("paris") || dest.includes("rome") || dest.includes("venice") || dest.includes("florence")) {
      return { primary: "15 80% 50%", secondary: "30 50% 95%", accent: "45 93% 47%", gradient: "from-amber-500/20 via-orange-400/10 to-rose-400/20" };
    }
    // Nordic/Cold destinations
    if (dest.includes("iceland") || dest.includes("norway") || dest.includes("sweden") || dest.includes("finland") || dest.includes("alaska")) {
      return { primary: "200 80% 50%", secondary: "200 30% 95%", accent: "170 80% 40%", gradient: "from-blue-400/20 via-cyan-300/10 to-teal-400/20" };
    }
    // Asian destinations
    if (dest.includes("tokyo") || dest.includes("japan") || dest.includes("kyoto")) {
      return { primary: "350 80% 60%", secondary: "350 20% 95%", accent: "150 50% 45%", gradient: "from-pink-400/20 via-rose-300/10 to-green-400/20" };
    }
    if (dest.includes("thailand") || dest.includes("bangkok") || dest.includes("vietnam")) {
      return { primary: "35 90% 55%", secondary: "35 40% 95%", accent: "160 60% 45%", gradient: "from-orange-400/20 via-amber-300/10 to-emerald-400/20" };
    }
    // Desert/Middle East
    if (dest.includes("dubai") || dest.includes("morocco") || dest.includes("egypt") || dest.includes("jordan")) {
      return { primary: "30 70% 50%", secondary: "30 30% 95%", accent: "20 80% 45%", gradient: "from-amber-500/20 via-orange-400/10 to-red-400/20" };
    }
    // Mountain destinations
    if (dest.includes("switzerland") || dest.includes("alps") || dest.includes("colorado") || dest.includes("aspen") || dest.includes("breckenridge")) {
      return { primary: "210 60% 50%", secondary: "210 20% 95%", accent: "150 60% 40%", gradient: "from-blue-400/20 via-slate-300/10 to-emerald-400/20" };
    }
    // Beach destinations
    if (dest.includes("miami") || dest.includes("cancun") || dest.includes("bahamas")) {
      return { primary: "185 70% 50%", secondary: "185 30% 95%", accent: "330 70% 55%", gradient: "from-cyan-400/20 via-teal-300/10 to-pink-400/20" };
    }
    // Urban metropolis
    if (dest.includes("new york") || dest.includes("london") || dest.includes("singapore") || dest.includes("hong kong")) {
      return { primary: "220 60% 45%", secondary: "220 20% 95%", accent: "40 80% 50%", gradient: "from-slate-400/20 via-gray-300/10 to-amber-400/20" };
    }
    // Default warm travel theme
    return { primary: "20 80% 55%", secondary: "20 30% 95%", accent: "180 60% 45%", gradient: "from-orange-400/20 via-amber-300/10 to-teal-400/20" };
  };

  const handlePublish = async () => {
    if (!plan || !tripData) return;

    setPublishing(true);
    try {
      toast({
        title: "Generating your website...",
        description: "Creating a custom hero image for your trip.",
      });

      const heroImageUrl = await generateHeroImage(tripData.destination, plan.theme);
      const themeColors = getDestinationTheme(tripData.destination);
      
      const { data, error: insertError } = await supabase
        .from("published_trips" as never)
        .insert({
          destination: tripData.destination,
          start_date: tripData.startDate,
          end_date: tripData.endDate,
          plan: plan as unknown,
          hero_image_url: heroImageUrl,
          theme_colors: themeColors as unknown,
        } as never)
        .select("id")
        .single();

      if (insertError) throw insertError;

      const tripId = (data as { id: string }).id;
      const url = `${window.location.origin}/trip/${tripId}`;
      setPublishedUrl(url);
      
      toast({
        title: "Trip Published! 🎉",
        description: "Your trip website is ready to share.",
      });
    } catch (err) {
      console.error("Error publishing trip:", err);
      toast({
        title: "Failed to publish",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!publishedUrl) return;
    await navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "Share it with your travel companions.",
    });
  };

  useEffect(() => {
    if (!tripData) {
      navigate("/generate");
      return;
    }

    const generateTrip = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fnError } = await supabase.functions.invoke("generate-trip", {
          body: tripData,
        });

        if (fnError) {
          throw new Error(fnError.message || "Failed to generate trip");
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        if (!data?.plan) {
          throw new Error("Invalid response from AI");
        }

        setPlan(data.plan);
      } catch (err) {
        console.error("Error generating trip:", err);
        const message = err instanceof Error ? err.message : "Failed to generate trip";
        setError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    generateTrip();
  }, [tripData, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
        <SoothingGradient />
        <div className="relative z-10 text-center space-y-6 p-8">
          {/* Fun Climber Animation */}
          <div className="relative w-48 h-64 mx-auto">
            {/* Mountain */}
            <svg viewBox="0 0 200 260" className="w-full h-full">
              {/* Mountain Background */}
              <polygon 
                points="100,20 180,240 20,240" 
                className="fill-muted stroke-border" 
                strokeWidth="2"
              />
              {/* Snow Cap */}
              <polygon 
                points="100,20 130,80 70,80" 
                className="fill-background stroke-border" 
                strokeWidth="1"
              />
              {/* Mountain Path (dotted line) */}
              <path 
                d="M 40,220 Q 60,180 80,160 Q 100,140 90,110 Q 85,90 100,60" 
                fill="none" 
                className="stroke-primary/40" 
                strokeWidth="2" 
                strokeDasharray="4 4"
              />
              {/* Climber */}
              <g className="animate-[climb_3s_ease-in-out_infinite]">
                {/* Body */}
                <circle cx="0" cy="0" r="8" className="fill-primary" />
                {/* Backpack */}
                <rect x="4" y="-4" width="8" height="12" rx="2" className="fill-primary/80" />
                {/* Legs */}
                <line x1="-2" y1="8" x2="-5" y2="16" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
                <line x1="2" y1="8" x2="5" y2="16" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
                {/* Arms */}
                <line x1="-6" y1="2" x2="-10" y2="-4" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="2" x2="8" y2="6" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
                {/* Walking stick */}
                <line x1="8" y1="6" x2="14" y2="18" className="stroke-foreground/60" strokeWidth="1.5" strokeLinecap="round" />
              </g>
              {/* Flag at peak */}
              <g>
                <line x1="100" y1="20" x2="100" y2="5" className="stroke-foreground" strokeWidth="1.5" />
                <polygon points="100,5 115,10 100,15" className="fill-primary animate-[wave_1s_ease-in-out_infinite]" />
              </g>
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Crafting your perfect trip...
            </h2>
            <p className="text-muted-foreground max-w-md">
              Our AI is creating a detailed itinerary with weather forecasts, transport tips, and optimal timing. This usually takes 20-40 seconds.
            </p>
          </div>
        </div>
        <style>{`
          @keyframes climb {
            0%, 100% { transform: translate(50px, 200px); }
            25% { transform: translate(70px, 165px); }
            50% { transform: translate(88px, 125px); }
            75% { transform: translate(92px, 95px); }
          }
          @keyframes wave {
            0%, 100% { transform: skewY(0deg); }
            50% { transform: skewY(5deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <SoothingGradient />
        <div className="relative z-10 text-center space-y-6 p-8">
          <div className="text-6xl">😕</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Something went wrong
            </h2>
            <p className="text-muted-foreground max-w-md">
              {error || "We couldn't generate your trip plan. Please try again."}
            </p>
          </div>
          <Button onClick={() => navigate("/generate")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Try Again
          </Button>
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
            onClick={() => navigate("/generate")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Start Over
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Generated
          </div>
        </div>
      </header>

      {/* Plan Header */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            {plan.theme}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {plan.name}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {plan.summary}
          </p>
          
          {/* First line: Dates and Days */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-1 bg-muted text-muted-foreground px-3 py-1.5 rounded-full">
              <Calendar className="w-4 h-4" />
              {new Date(plan.days[0]?.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(plan.days[plan.days.length - 1]?.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1 bg-muted text-muted-foreground px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" />
              {plan.days.length} days
            </span>
          </div>
          
          {/* Second line: Total Cost - simplified with dark grey fill and white border */}
          <div className="flex items-center justify-center">
            <span className="flex items-center gap-2 bg-muted text-foreground border border-foreground/20 px-4 py-2 rounded-full text-sm font-medium">
              <DollarSign className="w-4 h-4" />
              {plan.estimatedTotalCost.split('(')[0].trim()}
            </span>
          </div>
        </div>

        {/* Flights Section */}
        {plan.flights && (
          <div className="bg-card rounded-xl p-5 mb-6 border border-border/50 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <Plane className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Flights</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Outbound Flight */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">Outbound</span>
                  <span className="text-xs text-muted-foreground">{plan.flights.outbound.class}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{plan.flights.outbound.airline}</span>
                  <span className="text-xs text-muted-foreground">{plan.flights.outbound.flightNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-foreground">{plan.flights.outbound.departure}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{plan.flights.outbound.arrival}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{plan.flights.outbound.duration}</span>
                  <span className="font-medium text-foreground">{plan.flights.outbound.estimatedCost}</span>
                </div>
                {plan.flights.outbound.note && (
                  <p className="text-xs text-muted-foreground mt-2">💡 {plan.flights.outbound.note}</p>
                )}
              </div>
              {/* Return Flight */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">Return</span>
                  <span className="text-xs text-muted-foreground">{plan.flights.return.class}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{plan.flights.return.airline}</span>
                  <span className="text-xs text-muted-foreground">{plan.flights.return.flightNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-foreground">{plan.flights.return.departure}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{plan.flights.return.arrival}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{plan.flights.return.duration}</span>
                  <span className="font-medium text-foreground">{plan.flights.return.estimatedCost}</span>
                </div>
                {plan.flights.return.note && (
                  <p className="text-xs text-muted-foreground mt-2">💡 {plan.flights.return.note}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hotel Section */}
        {plan.hotel && (
          <div className="bg-card rounded-xl p-5 mb-6 border border-border/50 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <Hotel className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Accommodation</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-foreground text-lg">{plan.hotel.name}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: plan.hotel.starRating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-medium text-foreground">{plan.hotel.estimatedCostPerNight}</span>
                  <span className="text-xs text-muted-foreground block">per night</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p>{plan.hotel.address}</p>
                  <p className="text-xs">{plan.hotel.neighborhood}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {plan.hotel.amenities.slice(0, 5).map((amenity, i) => (
                  <span key={i} className="text-xs bg-background px-2 py-1 rounded-full border border-border/50">
                    {amenity}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{plan.hotel.whyRecommended}</p>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>Check-in: {plan.hotel.checkIn}</span>
                  <span>Check-out: {plan.hotel.checkOut}</span>
                </div>
                <span className="font-medium text-foreground">Total: {plan.hotel.totalEstimatedCost}</span>
              </div>
              {plan.hotel.bookingTip && (
                <p className="text-xs text-muted-foreground">💡 {plan.hotel.bookingTip}</p>
              )}
            </div>
          </div>
        )}

        {/* Days - Accordion Style */}
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Daily Itinerary
        </h3>
        <div className="space-y-3">
          {plan.days.map((day) => {
            const isOpen = openDays.includes(day.dayNumber);
            const formattedDate = new Date(day.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            return (
              <Collapsible
                key={day.dayNumber}
                open={isOpen}
                onOpenChange={() => toggleDay(day.dayNumber)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full bg-card rounded-xl p-4 shadow-soft border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="font-semibold text-primary">
                          Day {day.dayNumber}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {day.blocks.length} activities planned
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Weather */}
                        <div className="flex items-center gap-2 text-right">
                          <div className="hidden sm:block">
                            <p className="text-sm font-medium text-foreground">
                              {formattedDate}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                              <Thermometer className="w-3 h-3" />
                              {day.weather.lowTemp}° - {day.weather.highTemp}°F
                            </div>
                          </div>
                          <WeatherIcon condition={day.weather.condition} />
                        </div>

                        <ChevronDown
                          className={cn(
                            "w-5 h-5 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                        />
                      </div>
                    </div>

                    {/* Weather note */}
                    {day.weather.note && (
                      <p className="text-xs text-muted-foreground mt-2 text-left">
                        💡 {day.weather.note}
                      </p>
                    )}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                  <div className="pt-3 pl-6 space-y-3">
                    {day.blocks.map((block, i) => (
                      <div
                        key={i}
                        className="flex gap-4 p-4 rounded-xl bg-card border border-border/50 hover:shadow-sm transition-shadow"
                      >
                        <div className="text-sm font-medium text-muted-foreground w-16 shrink-0">
                          {block.time}
                          <br />
                          <span className="text-xs opacity-70">to {block.endTime}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-foreground">{block.title}</h4>
                            <span
                              className={`text-xs px-2 py-1 rounded-full border shrink-0 ${
                                categoryColors[block.category] || categoryColors["activity"]
                              }`}
                            >
                              {block.category}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{block.description}</p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {block.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {block.estimatedCost}
                            </span>
                          </div>

                          {/* Transport Note */}
                          {block.transportNote && (
                            <div className="flex items-start gap-2 text-xs bg-purple-50 text-purple-700 p-2 rounded-lg">
                              <Navigation className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{block.transportNote}</span>
                            </div>
                          )}

                          {/* Weather Consideration */}
                          {block.weatherConsideration && (
                            <div className="flex items-start gap-2 text-xs bg-blue-50 text-blue-700 p-2 rounded-lg">
                              <Cloud className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{block.weatherConsideration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        {/* CTA - Publish Website */}
        <div className="text-center mt-12 pb-8 space-y-4">
          {!publishedUrl ? (
            <Button
              size="lg"
              onClick={handlePublish}
              disabled={publishing}
              className="px-8 py-6 text-lg rounded-xl gap-3"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5" />
                  Publish Website
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                <Check className="w-4 h-4" />
                Website Published!
              </div>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publishedUrl}
                  className="bg-card border border-border rounded-lg px-4 py-2 text-sm w-80 text-muted-foreground"
                />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => window.open(publishedUrl, "_blank")}
                className="gap-2"
              >
                <Globe className="w-4 h-4" />
                View Website
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripResults;
