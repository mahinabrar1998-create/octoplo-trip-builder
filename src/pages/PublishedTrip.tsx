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
  if (dest.includes("alps") || dest.includes("colorado") || dest.includes("breckenridge") || dest.includes("aspen") || dest.includes("switzerland")) {
    return <Mountain className="w-6 h-6" />;
  }
  if (dest.includes("new york") || dest.includes("london") || dest.includes("tokyo") || dest.includes("paris") || dest.includes("singapore")) {
    return <Building2 className="w-6 h-6" />;
  }
  if (dest.includes("iceland") || dest.includes("norway") || dest.includes("cruise")) {
    return <Waves className="w-6 h-6" />;
  }
  return <MapPin className="w-6 h-6" />;
};

const WeatherIcon = ({ condition, className }: { condition: Weather["condition"]; className?: string }) => {
  const iconClass = cn("w-8 h-8", className);
  switch (condition) {
    case "sunny":
      return <Sun className={iconClass} style={{ color: "var(--theme-accent)" }} />;
    case "partly-cloudy":
      return <CloudSun className={iconClass} style={{ color: "var(--theme-accent)" }} />;
    case "cloudy":
      return <Cloud className={cn(iconClass, "text-gray-400")} />;
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

// Default theme for trips without theme_colors
const defaultTheme: ThemeColors = {
  primary: "20 80% 55%",
  secondary: "20 30% 95%",
  accent: "180 60% 45%",
  gradient: "from-orange-400/20 via-amber-300/10 to-teal-400/20",
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" />
          <p className="text-white/70">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">🗺️</div>
          <h1 className="text-2xl font-bold text-white">Trip Not Found</h1>
          <p className="text-white/70">{error || "This trip may have been removed or the link is incorrect."}</p>
        </div>
      </div>
    );
  }

  const { plan, destination, start_date, end_date, hero_image_url, theme_colors } = tripData;
  const theme = theme_colors || defaultTheme;
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Apply theme as CSS variables
  const themeStyle = {
    "--theme-primary": `hsl(${theme.primary})`,
    "--theme-secondary": `hsl(${theme.secondary})`,
    "--theme-accent": `hsl(${theme.accent})`,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen" style={themeStyle}>
      {/* Hero Section with destination-themed styling */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: `url(${hero_image_url})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
        
        {/* Themed floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className={cn("absolute top-20 left-10 w-40 h-40 rounded-full blur-3xl animate-pulse opacity-40", `bg-gradient-to-r ${theme.gradient}`)} 
          />
          <div 
            className={cn("absolute bottom-40 right-10 w-56 h-56 rounded-full blur-3xl animate-pulse opacity-30", `bg-gradient-to-r ${theme.gradient}`)}
            style={{ animationDelay: "1s" }} 
          />
          <div 
            className={cn("absolute top-1/2 left-1/4 w-32 h-32 rounded-full blur-3xl animate-pulse opacity-20", `bg-gradient-to-r ${theme.gradient}`)}
            style={{ animationDelay: "2s" }} 
          />
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          {/* Destination icon */}
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 backdrop-blur-sm"
            style={{ backgroundColor: "var(--theme-primary)", color: "white" }}
          >
            {getDestinationIcon(destination)}
          </div>
          
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 backdrop-blur-sm text-white"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            <Sparkles className="w-4 h-4" />
            {plan.theme}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg tracking-tight">
            {destination}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl drop-shadow-md font-light">
            {plan.summary}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-white/90">
            <span 
              className="flex items-center gap-2 backdrop-blur-sm px-5 py-3 rounded-full font-medium"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
              <Calendar className="w-5 h-5" />
              {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span 
              className="flex items-center gap-2 backdrop-blur-sm px-5 py-3 rounded-full font-medium"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
              <Clock className="w-5 h-5" />
              {tripDuration} days
            </span>
            <span 
              className="flex items-center gap-2 backdrop-blur-sm px-5 py-3 rounded-full font-medium"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
              <DollarSign className="w-5 h-5" />
              {plan.estimatedTotalCost}
            </span>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 rounded-full bg-white/70 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main content with themed background */}
      <div 
        className={cn("bg-gradient-to-b", theme.gradient, "min-h-screen")}
        style={{ backgroundColor: "var(--theme-secondary)" }}
      >
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Highlights Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-6" style={{ color: "hsl(220, 20%, 20%)" }}>
              Trip Highlights
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {plan.highlights.map((highlight, i) => (
                <span
                  key={i}
                  className="px-5 py-2.5 rounded-full text-sm font-medium shadow-sm"
                  style={{ 
                    backgroundColor: "white",
                    color: "var(--theme-primary)",
                    border: "2px solid var(--theme-primary)"
                  }}
                >
                  ✨ {highlight}
                </span>
              ))}
            </div>
          </div>

          {/* Packing Tips */}
          {plan.packingTips && plan.packingTips.length > 0 && (
            <div 
              className="rounded-2xl p-6 mb-12 shadow-lg"
              style={{ backgroundColor: "white" }}
            >
              <h3 
                className="font-semibold mb-4 flex items-center gap-2 text-lg"
                style={{ color: "hsl(220, 20%, 20%)" }}
              >
                <span className="text-2xl">🎒</span> What to Pack
              </h3>
              <div className="flex flex-wrap gap-2">
                {plan.packingTips.map((tip, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: "var(--theme-secondary)",
                      color: "hsl(220, 20%, 30%)"
                    }}
                  >
                    {tip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Daily Itinerary */}
          <div className="space-y-10">
            <h2 
              className="text-3xl font-bold text-center mb-10"
              style={{ color: "hsl(220, 20%, 20%)" }}
            >
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
                    className="sticky top-0 z-20 backdrop-blur-md py-4 mb-6 rounded-xl px-4 shadow-sm"
                    style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg text-white"
                          style={{ backgroundColor: "var(--theme-primary)" }}
                        >
                          {day.dayNumber}
                        </div>
                        <div>
                          <h3 className="font-bold text-xl" style={{ color: "hsl(220, 20%, 20%)" }}>
                            Day {day.dayNumber}
                          </h3>
                          <p className="text-gray-500">{formattedDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                        <WeatherIcon condition={day.weather.condition} className="w-6 h-6" />
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "hsl(220, 20%, 20%)" }}>
                            <Thermometer className="w-3 h-3" />
                            {day.weather.lowTemp}° - {day.weather.highTemp}°F
                          </div>
                          <p className="text-xs text-gray-500 capitalize">{day.weather.condition.replace("-", " ")}</p>
                        </div>
                      </div>
                    </div>
                    {day.weather.note && (
                      <p 
                        className="mt-3 text-sm px-4 py-2 rounded-lg"
                        style={{ backgroundColor: "var(--theme-secondary)", color: "hsl(220, 20%, 30%)" }}
                      >
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
                          className="absolute left-0 top-0 w-4 h-4 -translate-x-[10px] rounded-full border-4 border-white shadow-md"
                          style={{ backgroundColor: "var(--theme-primary)" }}
                        />
                        
                        <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-gray-100">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: "var(--theme-secondary)", color: "var(--theme-primary)" }}
                              >
                                {categoryIcons[block.category] || <Sparkles className="w-4 h-4" />}
                              </div>
                              <div>
                                <h4 className="font-semibold" style={{ color: "hsl(220, 20%, 20%)" }}>{block.title}</h4>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {block.time} - {block.endTime}
                                </p>
                              </div>
                            </div>
                            <span 
                              className="text-sm font-medium px-3 py-1 rounded-full"
                              style={{ backgroundColor: "var(--theme-secondary)", color: "var(--theme-primary)" }}
                            >
                              {block.estimatedCost}
                            </span>
                          </div>

                          <p className="text-gray-600 mb-3">{block.description}</p>

                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                            <MapPin className="w-4 h-4" style={{ color: "var(--theme-primary)" }} />
                            <span>{block.location}</span>
                          </div>

                          {block.transportNote && (
                            <div 
                              className="flex items-start gap-2 text-sm p-3 rounded-lg mb-2"
                              style={{ backgroundColor: "var(--theme-secondary)", color: "hsl(220, 20%, 30%)" }}
                            >
                              <Navigation className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--theme-primary)" }} />
                              <span>{block.transportNote}</span>
                            </div>
                          )}

                          {block.weatherConsideration && (
                            <div className="flex items-start gap-2 text-sm bg-blue-50 text-blue-800 p-3 rounded-lg">
                              <Cloud className="w-4 h-4 mt-0.5 shrink-0" />
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

      {/* Footer */}
      <footer 
        className="py-10"
        style={{ backgroundColor: "hsl(220, 20%, 15%)" }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-white mb-3">
            <Sparkles className="w-5 h-5" style={{ color: "var(--theme-accent)" }} />
            <span className="font-semibold text-lg">Powered by Octoplo</span>
          </div>
          <p className="text-sm text-white/60">
            AI-crafted travel itinerary • Share the adventure
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublishedTrip;
