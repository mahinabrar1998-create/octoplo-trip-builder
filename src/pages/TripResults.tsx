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
        {/* Underwater Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400 via-blue-500 to-blue-900" />
        
        {/* Animated bubbles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20 animate-[bubble_4s_ease-in-out_infinite]"
              style={{
                width: `${8 + Math.random() * 16}px`,
                height: `${8 + Math.random() * 16}px`,
                left: `${Math.random() * 100}%`,
                bottom: `-20px`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 text-center space-y-6 p-8">
          {/* Underwater Scene */}
          <div className="relative w-80 h-56 mx-auto">
            {/* Underwater Mountains/Rocks */}
            <svg viewBox="0 0 320 224" className="absolute inset-0 w-full h-full">
              {/* Background mountain */}
              <polygon 
                points="0,224 60,140 100,180 160,100 220,160 280,120 320,224" 
                className="fill-blue-800/60"
              />
              {/* Foreground mountain */}
              <polygon 
                points="0,224 40,170 100,200 140,150 200,190 240,140 300,180 320,160 320,224" 
                className="fill-blue-900/80"
              />
              {/* Seafloor */}
              <ellipse cx="160" cy="224" rx="180" ry="30" className="fill-blue-950/50" />
              
              {/* Seaweed */}
              <path d="M50,224 Q45,200 55,180 Q50,165 55,150" className="stroke-emerald-600/70 fill-none stroke-[3] animate-[sway_3s_ease-in-out_infinite]" />
              <path d="M60,224 Q65,195 55,175 Q60,155 55,140" className="stroke-emerald-500/70 fill-none stroke-[3] animate-[sway_3s_ease-in-out_infinite_0.5s]" />
              <path d="M260,224 Q255,190 265,165 Q260,145 265,125" className="stroke-emerald-600/70 fill-none stroke-[3] animate-[sway_3s_ease-in-out_infinite_1s]" />
              <path d="M270,224 Q275,200 265,180 Q270,160 265,145" className="stroke-emerald-500/70 fill-none stroke-[3] animate-[sway_3s_ease-in-out_infinite_0.3s]" />
              
              {/* Small fish swimming opposite direction */}
              <g className="animate-[fishSwim_6s_linear_infinite]">
                <ellipse cx="0" cy="140" rx="8" ry="4" className="fill-yellow-400/60" />
                <polygon points="-8,140 -14,135 -14,145" className="fill-yellow-400/60" />
              </g>
              <g className="animate-[fishSwim_7s_linear_infinite_2s]">
                <ellipse cx="0" cy="110" rx="6" ry="3" className="fill-pink-400/50" />
                <polygon points="-6,110 -10,107 -10,113" className="fill-pink-400/50" />
              </g>
            </svg>
            
            {/* Swimming Octopus */}
            <div className="absolute animate-[swim_4s_ease-in-out_infinite]">
              <svg viewBox="0 0 100 100" className="w-20 h-20">
                {/* Octopus Body */}
                <ellipse cx="50" cy="35" rx="25" ry="22" className="fill-orange-500" />
                
                {/* Eyes */}
                <circle cx="42" cy="32" r="5" className="fill-white" />
                <circle cx="58" cy="32" r="5" className="fill-white" />
                <circle cx="43" cy="33" r="2.5" className="fill-gray-800" />
                <circle cx="59" cy="33" r="2.5" className="fill-gray-800" />
                
                {/* Smile */}
                <path d="M42,42 Q50,48 58,42" className="stroke-gray-800 stroke-2 fill-none" strokeLinecap="round" />
                
                {/* Tentacles with curls */}
                <path d="M30,50 Q20,60 25,75 Q28,82 22,85" className="stroke-orange-500 stroke-[6] fill-none animate-[tentacle1_1s_ease-in-out_infinite]" strokeLinecap="round" />
                <path d="M38,52 Q32,65 35,78 Q37,85 32,90" className="stroke-orange-500 stroke-[6] fill-none animate-[tentacle2_1s_ease-in-out_infinite_0.1s]" strokeLinecap="round" />
                <path d="M50,54 Q50,68 48,80 Q47,88 52,92" className="stroke-orange-500 stroke-[6] fill-none animate-[tentacle1_1s_ease-in-out_infinite_0.2s]" strokeLinecap="round" />
                <path d="M62,52 Q68,65 65,78 Q63,85 68,90" className="stroke-orange-500 stroke-[6] fill-none animate-[tentacle2_1s_ease-in-out_infinite_0.15s]" strokeLinecap="round" />
                <path d="M70,50 Q80,60 75,75 Q72,82 78,85" className="stroke-orange-500 stroke-[6] fill-none animate-[tentacle1_1s_ease-in-out_infinite_0.25s]" strokeLinecap="round" />
                
                {/* Highlight */}
                <ellipse cx="60" cy="28" rx="4" ry="3" className="fill-orange-300/50" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Crafting your perfect trip...
            </h2>
            <p className="text-white/80 max-w-md mx-auto">
              Our AI is creating a detailed itinerary with weather forecasts, transport tips, and optimal timing. This usually takes 20-40 seconds.
            </p>
          </div>
        </div>
        <style>{`
          @keyframes swim {
            0%, 100% { 
              left: 5%; 
              top: 25%;
              transform: scaleX(1);
            }
            45% { 
              left: 65%; 
              top: 35%;
              transform: scaleX(1);
            }
            50% { 
              left: 65%; 
              top: 35%;
              transform: scaleX(-1);
            }
            95% { 
              left: 5%; 
              top: 25%;
              transform: scaleX(-1);
            }
          }
          @keyframes tentacle1 {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
          }
          @keyframes tentacle2 {
            0%, 100% { transform: rotate(5deg); }
            50% { transform: rotate(-5deg); }
          }
          @keyframes bubble {
            0% { 
              transform: translateY(0) scale(1);
              opacity: 0.6;
            }
            100% { 
              transform: translateY(-400px) scale(0.5);
              opacity: 0;
            }
          }
          @keyframes sway {
            0%, 100% { transform: skewX(-5deg); }
            50% { transform: skewX(5deg); }
          }
          @keyframes fishSwim {
            0% { transform: translateX(0); }
            100% { transform: translateX(400px); }
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
