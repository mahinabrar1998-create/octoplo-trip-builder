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

type TripPlan = {
  name: string;
  theme: string;
  summary: string;
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

  const getHeroImageUrl = (destination: string) => {
    // Using Unsplash for destination images
    const encodedDest = encodeURIComponent(destination);
    return `https://source.unsplash.com/1920x1080/?${encodedDest},travel,landmark`;
  };

  const handlePublish = async () => {
    if (!plan || !tripData) return;

    setPublishing(true);
    try {
      const heroImageUrl = getHeroImageUrl(tripData.destination);
      
      const { data, error: insertError } = await supabase
        .from("published_trips" as never)
        .insert({
          destination: tripData.destination,
          start_date: tripData.startDate,
          end_date: tripData.endDate,
          plan: plan as unknown,
          hero_image_url: heroImageUrl,
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
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <SoothingGradient />
        <div className="relative z-10 text-center space-y-6 p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Crafting your perfect trip...
            </h2>
            <p className="text-muted-foreground max-w-md">
              Our AI is creating a detailed itinerary with weather forecasts, transport tips, and optimal timing. This usually takes 20-40 seconds.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Powered by Gemini</span>
          </div>
        </div>
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
          <div className="flex items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-primary" />
              {plan.estimatedTotalCost}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-primary" />
              {plan.days.length} days
            </span>
          </div>
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {plan.highlights.map((highlight, i) => (
            <span
              key={i}
              className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
            >
              {highlight}
            </span>
          ))}
        </div>

        {/* Packing Tips */}
        {plan.packingTips && plan.packingTips.length > 0 && (
          <div className="bg-card rounded-xl p-4 mb-8 border border-border/50">
            <h3 className="font-semibold text-foreground mb-2 text-sm">📦 Packing Tips</h3>
            <div className="flex flex-wrap gap-2">
              {plan.packingTips.map((tip, i) => (
                <span
                  key={i}
                  className="bg-primary/5 text-foreground/80 px-3 py-1 rounded-full text-xs"
                >
                  {tip}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Days - Accordion Style */}
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
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                          {day.dayNumber}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-foreground">
                            Day {day.dayNumber}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {day.blocks.length} activities planned
                          </p>
                        </div>
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
                      <p className="text-xs text-muted-foreground mt-2 text-left pl-16">
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
