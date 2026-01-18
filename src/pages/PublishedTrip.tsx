import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  CloudLightning,
  CloudSun,
  Thermometer,
  Plane,
  Utensils,
  Camera,
  Sparkles,
  Navigation,
  Loader2,
  Mountain,
  Palmtree,
  Building2,
  Waves,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  bgDark: string;
  bgDarker: string;
};

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

type TripPlan = {
  name: string;
  theme: string;
  summary: string;
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
  theme_colors?: ThemeColors;
  created_at: string;
};

const categoryIcons: Record<string, React.ReactNode> = {
  food: <Utensils className="w-4 h-4" />,
  activity: <Camera className="w-4 h-4" />,
  transport: <Plane className="w-4 h-4" />,
  accommodation: <MapPin className="w-4 h-4" />,
  "free-time": <Sparkles className="w-4 h-4" />,
};

// Get destination type for themed icons
const getDestinationIcon = (destination: string) => {
  const dest = destination.toLowerCase();
  if (dest.includes("bali") || dest.includes("hawaii") || dest.includes("maldives") || dest.includes("caribbean") || dest.includes("miami") || dest.includes("beach")) {
    return <Palmtree className="w-6 h-6" />;
  }
  if (dest.includes("alps") || dest.includes("colorado") || dest.includes("breckenridge") || dest.includes("aspen") || dest.includes("switzerland") || dest.includes("ski") || dest.includes("mountain")) {
    return <Mountain className="w-6 h-6" />;
  }
  if (dest.includes("new york") || dest.includes("london") || dest.includes("tokyo") || dest.includes("paris") || dest.includes("singapore") || dest.includes("san francisco")) {
    return <Building2 className="w-6 h-6" />;
  }
  if (dest.includes("iceland") || dest.includes("norway") || dest.includes("cruise")) {
    return <Waves className="w-6 h-6" />;
  }
  return <MapPin className="w-6 h-6" />;
};

// Generate theme based on destination
const getDestinationTheme = (destination: string): ThemeColors => {
  const dest = destination.toLowerCase();
  
  // Mountain/Ski destinations - cool blues and slate
  if (dest.includes("breckenridge") || dest.includes("aspen") || dest.includes("colorado") || dest.includes("alps") || dest.includes("switzerland") || dest.includes("ski")) {
    return {
      primary: "210 70% 55%",
      secondary: "210 40% 25%",
      accent: "185 60% 50%",
      gradient: "from-blue-500/30 via-slate-600/20 to-cyan-500/20",
      bgDark: "215 30% 12%",
      bgDarker: "215 35% 8%",
    };
  }
  
  // Beach/Tropical destinations - warm oranges and teals
  if (dest.includes("bali") || dest.includes("hawaii") || dest.includes("maldives") || dest.includes("caribbean") || dest.includes("miami") || dest.includes("beach") || dest.includes("tropical")) {
    return {
      primary: "35 85% 55%",
      secondary: "35 50% 25%",
      accent: "175 60% 45%",
      gradient: "from-amber-500/30 via-orange-600/20 to-teal-500/20",
      bgDark: "25 25% 12%",
      bgDarker: "25 30% 8%",
    };
  }
  
  // City destinations - sophisticated purples and golds
  if (dest.includes("new york") || dest.includes("london") || dest.includes("tokyo") || dest.includes("paris") || dest.includes("singapore") || dest.includes("san francisco")) {
    return {
      primary: "260 60% 55%",
      secondary: "260 30% 20%",
      accent: "45 70% 55%",
      gradient: "from-purple-500/30 via-indigo-600/20 to-amber-500/20",
      bgDark: "260 25% 12%",
      bgDarker: "260 30% 8%",
    };
  }
  
  // Nordic/Cold destinations - aurora greens and deep blues
  if (dest.includes("iceland") || dest.includes("norway") || dest.includes("finland") || dest.includes("arctic") || dest.includes("northern")) {
    return {
      primary: "160 60% 45%",
      secondary: "160 40% 20%",
      accent: "280 50% 60%",
      gradient: "from-emerald-500/30 via-teal-600/20 to-purple-500/20",
      bgDark: "200 30% 10%",
      bgDarker: "200 35% 6%",
    };
  }
  
  // Default - elegant slate and teal
  return {
    primary: "180 50% 50%",
    secondary: "180 30% 20%",
    accent: "180 60% 60%",
    gradient: "from-teal-500/30 via-slate-600/20 to-cyan-500/20",
    bgDark: "220 25% 12%",
    bgDarker: "220 30% 8%",
  };
};

const WeatherIcon = ({ condition, className }: { condition: Weather["condition"]; className?: string }) => {
  const iconClass = cn("w-8 h-8", className);
  switch (condition) {
    case "sunny":
      return <Sun className={iconClass} style={{ color: "var(--theme-accent)" }} />;
    case "partly-cloudy":
      return <CloudSun className={iconClass} style={{ color: "var(--theme-accent)" }} />;
    case "cloudy":
      return <Cloud className={cn(iconClass, "text-slate-400")} />;
    case "rainy":
      return <CloudRain className={cn(iconClass, "text-blue-400")} />;
    case "stormy":
      return <CloudLightning className={cn(iconClass, "text-purple-400")} />;
    case "snowy":
      return <CloudSnow className={cn(iconClass, "text-blue-200")} />;
    case "windy":
      return <Wind className={cn(iconClass, "text-teal-400")} />;
    default:
      return <Sun className={iconClass} style={{ color: "var(--theme-accent)" }} />;
  }
};

const PublishedTrip = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [tripData, setTripData] = useState<PublishedTripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) {
        setError("Trip not found");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("published_trips" as never)
          .select("*")
          .eq("id", tripId)
          .single();

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" />
          <p className="text-white/70">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">🗺️</div>
          <h1 className="text-2xl font-bold text-white">Trip Not Found</h1>
          <p className="text-white/70">{error || "This trip may have been removed or the link is incorrect."}</p>
        </div>
      </div>
    );
  }

  const { plan, destination, start_date, end_date, hero_image_url, theme_colors } = tripData;
  // Use stored theme or generate based on destination
  const theme = theme_colors || getDestinationTheme(destination);
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Apply theme as CSS variables
  const themeStyle = {
    "--theme-primary": `hsl(${theme.primary})`,
    "--theme-secondary": `hsl(${theme.secondary})`,
    "--theme-accent": `hsl(${theme.accent})`,
    "--theme-bg-dark": `hsl(${theme.bgDark || "220 25% 12%"})`,
    "--theme-bg-darker": `hsl(${theme.bgDarker || "220 30% 8%"})`,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen" style={themeStyle}>
      {/* Hero Section with gradient fade into dark background */}
      <div className="relative h-[80vh] min-h-[600px] overflow-hidden">
        {/* Hero Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${hero_image_url})`,
          }}
        />
        
        {/* Gradient overlay - fades image into dark background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, 
              transparent 0%, 
              transparent 20%,
              rgba(0,0,0,0.2) 40%,
              rgba(0,0,0,0.5) 60%,
              var(--theme-bg-darker) 85%,
              var(--theme-bg-darker) 100%
            )`,
          }}
        />
        
        {/* Side gradient for extra depth */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center top, transparent 0%, var(--theme-bg-darker) 100%)`,
            opacity: 0.4,
          }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-end text-center px-4 pb-16">
          {/* Destination icon */}
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 backdrop-blur-sm border border-white/20"
            style={{ backgroundColor: "var(--theme-primary)", color: "white" }}
          >
            {getDestinationIcon(destination)}
          </div>
          
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 backdrop-blur-sm text-white border border-white/10"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "var(--theme-accent)" }} />
            {plan.theme}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-2xl tracking-tight">
            {destination}
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl drop-shadow-md font-light">
            {plan.summary}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 text-white/90">
            <span 
              className="flex items-center gap-2 backdrop-blur-md px-5 py-3 rounded-full font-medium border border-white/10"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <Calendar className="w-5 h-5" style={{ color: "var(--theme-accent)" }} />
              {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span 
              className="flex items-center gap-2 backdrop-blur-md px-5 py-3 rounded-full font-medium border border-white/10"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <Clock className="w-5 h-5" style={{ color: "var(--theme-accent)" }} />
              {tripDuration} days
            </span>
            <span 
              className="flex items-center gap-2 backdrop-blur-md px-5 py-3 rounded-full font-medium border border-white/10"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <DollarSign className="w-5 h-5" style={{ color: "var(--theme-accent)" }} />
              {plan.estimatedTotalCost}
            </span>
          </div>
        </div>
      </div>

      {/* Main content with dark themed background */}
      <div 
        className="min-h-screen"
        style={{ backgroundColor: "var(--theme-bg-darker)" }}
      >
        <div className="max-w-4xl mx-auto px-4 py-16">

          {/* Daily Itinerary */}
          <div className="space-y-10">
            <h2 className="text-3xl font-bold text-center mb-10 text-white">
              Daily Itinerary
            </h2>
            
            {plan.days.map((day) => {
              const dayDate = new Date(day.date);
              const formattedDate = dayDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              });

              return (
                <div key={day.dayNumber} className="relative">
                  {/* Day Header */}
                  <div 
                    className="sticky top-0 z-20 backdrop-blur-xl py-4 mb-6 rounded-xl px-4 border"
                    style={{ 
                      backgroundColor: "rgba(0,0,0,0.7)",
                      borderColor: "rgba(255,255,255,0.1)"
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-xl text-white">
                          Day {day.dayNumber}
                        </h3>
                        <p className="text-white/60">{formattedDate}</p>
                      </div>
                      <div 
                        className="flex items-center gap-3 px-4 py-2 rounded-xl border"
                        style={{ 
                          backgroundColor: "rgba(255,255,255,0.05)",
                          borderColor: "rgba(255,255,255,0.1)"
                        }}
                      >
                        <WeatherIcon condition={day.weather.condition} className="w-6 h-6" />
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-medium text-white">
                            <Thermometer className="w-3 h-3" />
                            {day.weather.lowTemp}° - {day.weather.highTemp}°F
                          </div>
                          <p className="text-xs text-white/60 capitalize">{day.weather.condition.replace("-", " ")}</p>
                        </div>
                      </div>
                    </div>
                    {day.weather.note && (
                      <p className="mt-3 text-sm px-4 py-2 rounded-lg bg-white/10 text-white border border-white/10">
                        💡 {day.weather.note}
                      </p>
                    )}
                  </div>

                  {/* Time Blocks */}
                  <div 
                    className="space-y-4 pl-4 border-l-4"
                    style={{ borderColor: "var(--theme-primary)" }}
                  >
                    {day.blocks.map((block, i) => (
                      <div
                        key={i}
                        className="relative pl-8 pb-4"
                      >
                        {/* Timeline dot */}
                        <div 
                          className="absolute left-0 top-0 w-4 h-4 -translate-x-[10px] rounded-full border-4 shadow-md"
                          style={{ 
                            backgroundColor: "var(--theme-primary)",
                            borderColor: "var(--theme-bg-darker)"
                          }}
                        />
                        
                        <div 
                          className="rounded-xl p-5 border transition-all hover:border-opacity-50"
                          style={{ 
                            backgroundColor: "rgba(255,255,255,0.03)",
                            borderColor: "rgba(255,255,255,0.1)"
                          }}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ 
                                  backgroundColor: "var(--theme-secondary)", 
                                  color: "var(--theme-accent)" 
                                }}
                              >
                                {categoryIcons[block.category] || <Sparkles className="w-4 h-4" />}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{block.title}</h4>
                                <p className="text-sm text-white/50 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {block.time} - {block.endTime}
                                </p>
                              </div>
                            </div>
                            <span 
                              className="text-sm font-bold px-4 py-2 rounded-full border backdrop-blur-md whitespace-nowrap"
                              style={{ 
                                backgroundColor: "rgba(255,255,255,0.08)",
                                borderColor: "rgba(255,255,255,0.35)",
                                color: "rgba(255,255,255,0.95)",
                              }}
                            >
                              <DollarSign className="w-3 h-3 inline mr-1" style={{ color: "rgba(255,255,255,0.9)" }} />
                              {block.estimatedCost}
                            </span>
                          </div>

                          <p className="text-white/70 mb-3">{block.description}</p>

                          <div className="flex items-center gap-2 text-sm text-white/50 mb-3">
                            <MapPin className="w-4 h-4" style={{ color: "var(--theme-accent)" }} />
                            <span>{block.location}</span>
                          </div>

                          {block.transportNote && (
                            <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-violet-500/20 text-violet-200 border border-violet-500/30">
                              <Navigation className="w-4 h-4 mt-0.5 shrink-0 text-violet-300" />
                              <span>{block.transportNote}</span>
                            </div>
                          )}

                          {block.weatherConsideration && (
                            <div className="flex items-start gap-2 text-sm p-3 rounded-lg mt-2 bg-sky-500/20 text-sky-200 border border-sky-500/30">
                              <Cloud className="w-4 h-4 mt-0.5 shrink-0 text-sky-300" />
                              <span>{block.weatherConsideration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer - subtle, matches theme */}
      <footer 
        className="py-10 border-t"
        style={{ 
          backgroundColor: "var(--theme-bg-darker)",
          borderColor: "rgba(255,255,255,0.05)"
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-white/40">
            AI-crafted travel itinerary • Share the adventure
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublishedTrip;
