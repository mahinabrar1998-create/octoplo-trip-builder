import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import SoothingGradient from "@/components/SoothingGradient";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Check,
  HelpCircle,
  X,
  ChevronDown,
  Sparkles,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  CloudLightning,
  CloudSun,
  Thermometer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type ResponseType = "going" | "maybe" | "not_going";

type Weather = {
  condition: "sunny" | "partly-cloudy" | "cloudy" | "rainy" | "stormy" | "snowy" | "windy";
  highTemp: number;
  lowTemp: number;
};

type TimeBlock = {
  time: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  category: string;
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
};

type TripData = {
  id: string;
  destination: string;
  plan: TripPlan;
};

type InviteData = {
  id: string;
  guest_name: string;
  guest_email: string;
  trip_id: string;
};

type BlockResponse = {
  dayIndex: number;
  blockIndex: number;
  response: ResponseType;
};

const categoryColors: Record<string, string> = {
  food: "bg-orange-100 text-orange-700 border-orange-200",
  activity: "bg-blue-100 text-blue-700 border-blue-200",
  transport: "bg-purple-100 text-purple-700 border-purple-200",
  accommodation: "bg-green-100 text-green-700 border-green-200",
  "free-time": "bg-gray-100 text-gray-700 border-gray-200",
};

const WeatherIcon = ({ condition }: { condition: Weather["condition"] }) => {
  const iconClass = "w-4 h-4";
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

const GuestResponse = () => {
  const { tripId, token } = useParams<{ tripId: string; token: string }>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [responses, setResponses] = useState<Map<string, ResponseType>>(new Map());
  const [openDays, setOpenDays] = useState<number[]>([1]);

  const getKey = (dayIndex: number, blockIndex: number) => `${dayIndex}-${blockIndex}`;

  useEffect(() => {
    const fetchData = async () => {
      if (!tripId || !token) {
        setError("Invalid link");
        setLoading(false);
        return;
      }

      try {
        // Fetch invite
        const { data: invite, error: inviteError } = await supabase
          .from("trip_invites" as never)
          .select("id, guest_name, guest_email, trip_id")
          .eq("trip_id", tripId)
          .eq("invite_token", token)
          .maybeSingle();

        if (inviteError) throw inviteError;
        if (!invite) throw new Error("Invalid or expired invite link");

        setInviteData(invite as unknown as InviteData);

        // Fetch trip
        const { data: trip, error: tripError } = await supabase
          .from("published_trips")
          .select("id, destination, plan")
          .eq("id", tripId)
          .maybeSingle();

        if (tripError) throw tripError;
        if (!trip) throw new Error("Trip not found");

        setTripData(trip as unknown as TripData);

        // Fetch existing responses
        const { data: existingResponses, error: respError } = await supabase
          .from("trip_block_responses" as never)
          .select("day_index, block_index, response")
          .eq("invite_id", (invite as { id: string }).id);

        if (respError) throw respError;

        const respMap = new Map<string, ResponseType>();
        (existingResponses as { day_index: number; block_index: number; response: ResponseType }[] || []).forEach((r) => {
          respMap.set(getKey(r.day_index, r.block_index), r.response);
        });
        setResponses(respMap);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tripId, token]);

  const toggleDay = (dayNumber: number) => {
    setOpenDays((prev) =>
      prev.includes(dayNumber) ? prev.filter((d) => d !== dayNumber) : [...prev, dayNumber]
    );
  };

  const setResponse = (dayIndex: number, blockIndex: number, response: ResponseType) => {
    setResponses((prev) => {
      const newMap = new Map(prev);
      newMap.set(getKey(dayIndex, blockIndex), response);
      return newMap;
    });
  };

  const saveResponses = async () => {
    if (!inviteData) return;

    setSaving(true);
    try {
      // Convert responses map to array for upsert
      const responsesArray: BlockResponse[] = [];
      responses.forEach((response, key) => {
        const [dayIndex, blockIndex] = key.split("-").map(Number);
        responsesArray.push({ dayIndex, blockIndex, response });
      });

      // Delete existing and insert new (simpler than upsert for this case)
      await supabase
        .from("trip_block_responses" as never)
        .delete()
        .eq("invite_id", inviteData.id);

      if (responsesArray.length > 0) {
        const { error } = await supabase
          .from("trip_block_responses" as never)
          .insert(
            responsesArray.map((r) => ({
              invite_id: inviteData.id,
              day_index: r.dayIndex,
              block_index: r.blockIndex,
              response: r.response,
            })) as never
          );

        if (error) throw error;
      }

      toast({
        title: "Responses saved!",
        description: "Your preferences have been recorded.",
      });
    } catch (err) {
      console.error("Error saving responses:", err);
      toast({
        title: "Error",
        description: "Failed to save responses.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <SoothingGradient />
        <div className="relative z-10 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (error || !tripData || !inviteData) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <SoothingGradient />
        <div className="relative z-10 text-center space-y-4 p-8">
          <div className="text-6xl">🔗</div>
          <h1 className="text-2xl font-bold text-foreground">Invalid Link</h1>
          <p className="text-muted-foreground">{error || "This invite link is invalid or has expired."}</p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline">
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  const { plan } = tripData;

  return (
    <div className="min-h-screen bg-background relative pb-24">
      <SoothingGradient />

      {/* Header */}
      <header className="relative z-10 p-4 md:p-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Hi {inviteData.guest_name}, you're invited to:
            </p>
            <h1 className="text-lg font-semibold text-foreground">{plan.name}</h1>
            <p className="text-xs text-muted-foreground">{tripData.destination}</p>
          </div>
        </div>
      </header>

      {/* Instructions */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-4">
        <div className="bg-primary/10 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground text-sm">Share your availability</h3>
              <p className="text-xs text-muted-foreground mt-1">
                For each activity, tap to indicate if you're Going, Maybe, or Can't make it.
                Your responses help the group plan better!
              </p>
            </div>
          </div>
        </div>

        {/* Days */}
        <div className="space-y-3">
          {plan.days.map((day, dayIndex) => (
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
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                        <WeatherIcon condition={day.weather.condition} />
                        <Thermometer className="w-3 h-3" />
                        <span>
                          {day.weather.highTemp}°/{day.weather.lowTemp}°
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          openDays.includes(day.dayNumber) && "rotate-180"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="mt-2 space-y-2 pl-2">
                  {day.blocks.map((block, blockIndex) => {
                    const key = getKey(dayIndex, blockIndex);
                    const currentResponse = responses.get(key);

                    return (
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
                              <span
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full border capitalize",
                                  categoryColors[block.category] || categoryColors["activity"]
                                )}
                              >
                                {block.category}
                              </span>
                            </div>
                            <h4 className="font-medium text-foreground text-sm">{block.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {block.description}
                            </p>
                            {block.location && (
                              <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {block.location}
                              </div>
                            )}

                            {/* Response Buttons */}
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                variant={currentResponse === "going" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setResponse(dayIndex, blockIndex, "going")}
                                className={cn(
                                  "h-8 gap-1.5 text-xs",
                                  currentResponse === "going" && "bg-green-600 hover:bg-green-700"
                                )}
                              >
                                <Check className="w-3.5 h-3.5" />
                                Going
                              </Button>
                              <Button
                                variant={currentResponse === "maybe" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setResponse(dayIndex, blockIndex, "maybe")}
                                className={cn(
                                  "h-8 gap-1.5 text-xs",
                                  currentResponse === "maybe" && "bg-yellow-600 hover:bg-yellow-700"
                                )}
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                Maybe
                              </Button>
                              <Button
                                variant={currentResponse === "not_going" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setResponse(dayIndex, blockIndex, "not_going")}
                                className={cn(
                                  "h-8 gap-1.5 text-xs",
                                  currentResponse === "not_going" && "bg-red-600 hover:bg-red-700"
                                )}
                              >
                                <X className="w-3.5 h-3.5" />
                                Can't
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-4xl mx-auto">
          <Button onClick={saveResponses} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save My Responses
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestResponse;
