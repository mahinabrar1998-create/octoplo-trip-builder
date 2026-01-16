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
} from "lucide-react";
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
  created_at: string;
};

const categoryIcons: Record<string, React.ReactNode> = {
  food: <Utensils className="w-4 h-4" />,
  activity: <Camera className="w-4 h-4" />,
  transport: <Plane className="w-4 h-4" />,
  accommodation: <MapPin className="w-4 h-4" />,
  "free-time": <Sparkles className="w-4 h-4" />,
};

const WeatherIcon = ({ condition, className }: { condition: Weather["condition"]; className?: string }) => {
  const iconClass = cn("w-8 h-8", className);
  switch (condition) {
    case "sunny":
      return <Sun className={cn(iconClass, "text-yellow-400")} />;
    case "partly-cloudy":
      return <CloudSun className={cn(iconClass, "text-yellow-300")} />;
    case "cloudy":
      return <Cloud className={cn(iconClass, "text-gray-300")} />;
    case "rainy":
      return <CloudRain className={cn(iconClass, "text-blue-300")} />;
    case "stormy":
      return <CloudLightning className={cn(iconClass, "text-purple-400")} />;
    case "snowy":
      return <CloudSnow className={cn(iconClass, "text-blue-100")} />;
    case "windy":
      return <Wind className={cn(iconClass, "text-teal-300")} />;
    default:
      return <Sun className={cn(iconClass, "text-yellow-400")} />;
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
      <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">🗺️</div>
          <h1 className="text-2xl font-bold text-foreground">Trip Not Found</h1>
          <p className="text-muted-foreground">{error || "This trip may have been removed or the link is incorrect."}</p>
        </div>
      </div>
    );
  }

  const { plan, destination, start_date, end_date, hero_image_url } = tripData;
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${hero_image_url})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
        
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-40 right-10 w-40 h-40 rounded-full bg-secondary/30 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="inline-flex items-center gap-2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            {plan.theme}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {destination}
          </h1>
          <p className="text-xl text-white/90 mb-6 max-w-2xl drop-shadow-md">
            {plan.summary}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-white/90">
            <span className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
              <Calendar className="w-4 h-4" />
              {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              {tripDuration} days
            </span>
            <span className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
              <DollarSign className="w-4 h-4" />
              {plan.estimatedTotalCost}
            </span>
          </div>
        </div>
      </div>

      {/* Highlights Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Trip Highlights</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {plan.highlights.map((highlight, i) => (
              <span
                key={i}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-full text-sm font-medium border border-primary/20"
              >
                ✨ {highlight}
              </span>
            ))}
          </div>
        </div>

        {/* Packing Tips */}
        {plan.packingTips && plan.packingTips.length > 0 && (
          <div className="bg-card rounded-2xl p-6 mb-12 border border-border shadow-sm">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="text-xl">🎒</span> What to Pack
            </h3>
            <div className="flex flex-wrap gap-2">
              {plan.packingTips.map((tip, i) => (
                <span
                  key={i}
                  className="bg-primary/10 text-foreground px-3 py-1.5 rounded-full text-sm"
                >
                  {tip}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Daily Itinerary */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Daily Itinerary</h2>
          
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
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-4 mb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg">
                        {day.dayNumber}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-foreground">Day {day.dayNumber}</h3>
                        <p className="text-muted-foreground">{formattedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-border">
                      <WeatherIcon condition={day.weather.condition} className="w-6 h-6" />
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <Thermometer className="w-3 h-3" />
                          {day.weather.lowTemp}° - {day.weather.highTemp}°F
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{day.weather.condition.replace("-", " ")}</p>
                      </div>
                    </div>
                  </div>
                  {day.weather.note && (
                    <p className="mt-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg">
                      💡 {day.weather.note}
                    </p>
                  )}
                </div>

                {/* Time Blocks */}
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  {day.blocks.map((block, i) => (
                    <div
                      key={i}
                      className="relative pl-8 pb-4"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-0 w-4 h-4 -translate-x-[9px] rounded-full bg-primary border-4 border-background shadow-sm" />
                      
                      <div className="bg-card rounded-xl p-5 border border-border hover:border-primary/30 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                              {categoryIcons[block.category] || <Sparkles className="w-4 h-4" />}
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{block.title}</h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {block.time} - {block.endTime}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {block.estimatedCost}
                          </span>
                        </div>

                        <p className="text-muted-foreground mb-3">{block.description}</p>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>{block.location}</span>
                        </div>

                        {block.transportNote && (
                          <div className="flex items-start gap-2 text-sm bg-secondary/50 text-foreground p-3 rounded-lg mb-2">
                            <Navigation className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                            <span>{block.transportNote}</span>
                          </div>
                        )}

                        {block.weatherConsideration && (
                          <div className="flex items-start gap-2 text-sm bg-primary/5 text-foreground p-3 rounded-lg">
                            <Cloud className="w-4 h-4 mt-0.5 text-primary shrink-0" />
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

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Octoplo</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Trip planned with AI • Share the adventure
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublishedTrip;
