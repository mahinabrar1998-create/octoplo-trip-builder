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
  Pencil,
  Luggage,
} from "lucide-react";
import SoothingGradient from "@/components/SoothingGradient";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EditFlightsDrawer } from "@/components/EditFlightsDrawer";
import { EditHotelDrawer } from "@/components/EditHotelDrawer";
import { EditTimeBlockDrawer } from "@/components/EditTimeBlockDrawer";

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

  // Edit drawer state
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<{
    block: TimeBlock;
    dayNumber: number;
    blockIndex: number;
  } | null>(null);
  const [editFlightsOpen, setEditFlightsOpen] = useState(false);
  const [editHotelOpen, setEditHotelOpen] = useState(false);

  const tripData = location.state?.tripData;

  const toggleDay = (dayNumber: number) => {
    setOpenDays((prev) =>
      prev.includes(dayNumber)
        ? prev.filter((d) => d !== dayNumber)
        : [...prev, dayNumber]
    );
  };

  const handleEditBlock = (block: TimeBlock, dayNumber: number, blockIndex: number) => {
    setEditingBlock({ block, dayNumber, blockIndex });
    setEditDrawerOpen(true);
  };

  const handleSaveBlock = (dayNumber: number, blockIndex: number, updatedBlock: TimeBlock) => {
    if (!plan) return;

    const updatedDays = plan.days.map((day) => {
      if (day.dayNumber === dayNumber) {
        const updatedBlocks = [...day.blocks];
        updatedBlocks[blockIndex] = updatedBlock;
        return { ...day, blocks: updatedBlocks };
      }
      return day;
    });

    setPlan({ ...plan, days: updatedDays });
    toast({
      title: "Block updated",
      description: "Your changes have been saved.",
    });
  };

  const handleSaveFlights = (updatedFlights: Flights) => {
    if (!plan) return;
    setPlan({ ...plan, flights: updatedFlights });
    toast({ title: "Flights updated" });
  };

  const handleSaveHotel = (updatedHotel: HotelType) => {
    if (!plan) return;
    setPlan({ ...plan, hotel: updatedHotel });
    toast({ title: "Accommodation updated" });
  };

  // Simple save without hero image generation

  const handleSave = async () => {
    if (!plan || !tripData) return;

    setPublishing(true);
    try {
      const { data, error: insertError } = await supabase
        .from("published_trips" as never)
        .insert({
          destination: tripData.destination,
          start_date: tripData.startDate,
          end_date: tripData.endDate,
          plan: plan as unknown,
          name: plan.name,
          hero_image_url: "",
          theme_colors: {} as unknown,
        } as never)
        .select("id, owner_token")
        .single();

      if (insertError) throw insertError;

      const tripId = (data as { id: string; owner_token: string }).id;
      const ownerToken = (data as { id: string; owner_token: string }).owner_token;
      
      // Save owner token to localStorage for ownership verification
      const existingTokens = JSON.parse(localStorage.getItem("trip_owner_tokens") || "{}");
      existingTokens[tripId] = ownerToken;
      localStorage.setItem("trip_owner_tokens", JSON.stringify(existingTokens));
      
      const url = `${window.location.origin}/trip/${tripId}`;
      setPublishedUrl(url);
      
      toast({
        title: "Plan Saved! 🎉",
        description: "You can now share your plan with others.",
      });
    } catch (err) {
      console.error("Error saving trip:", err);
      toast({
        title: "Failed to save",
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
          {/* Fun Hiking Animation */}
          <div className="relative w-64 h-48 mx-auto">
            <div className="absolute bottom-8 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full" />
            
            <div className="absolute bottom-10 animate-[walk_2s_ease-in-out_infinite]">
              <div className="relative">
                <div className="absolute -right-1 top-3 w-4 h-6 bg-primary/80 rounded-sm" />
                <div className="absolute -right-0.5 top-2 w-2 h-2 bg-primary rounded-full" />
                <div className="w-6 h-6 bg-foreground rounded-full mx-auto" />
                <div className="w-4 h-8 bg-foreground rounded-sm mx-auto -mt-1" />
                <div className="flex justify-center gap-1 -mt-1">
                  <div className="w-1.5 h-6 bg-foreground rounded-b origin-top animate-[leftLeg_0.5s_ease-in-out_infinite]" />
                  <div className="w-1.5 h-6 bg-foreground rounded-b origin-top animate-[rightLeg_0.5s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
            
            <div className="absolute top-4 left-8 animate-[float_3s_ease-in-out_infinite]">
              <MapPin className="w-6 h-6 text-primary/60" />
            </div>
            <div className="absolute top-8 right-12 animate-[float_3s_ease-in-out_infinite_0.5s]">
              <Plane className="w-5 h-5 text-primary/50" />
            </div>
            <div className="absolute top-2 right-6 animate-[float_3s_ease-in-out_infinite_1s]">
              <Globe className="w-5 h-5 text-primary/40" />
            </div>
            
            <div className="absolute bottom-8 right-0 flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 h-2 rounded-full bg-primary/30 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Crafting your perfect trip...
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Creating your itinerary with weather, transport, and timing. ~30 seconds.
            </p>
          </div>
        </div>
        <style>{`
          @keyframes walk {
            0%, 100% { left: 10%; }
            50% { left: 45%; }
          }
          @keyframes leftLeg {
            0%, 100% { transform: rotate(-15deg); }
            50% { transform: rotate(15deg); }
          }
          @keyframes rightLeg {
            0%, 100% { transform: rotate(15deg); }
            50% { transform: rotate(-15deg); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
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
                    <DollarSign className="w-3 h-3" />
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

        {/* Flights Section - Compact & Clickable */}
        {plan.flights && (
          <button
            onClick={() => setEditFlightsOpen(true)}
            className="w-full text-left bg-card rounded-xl p-4 mb-4 border border-border/50 shadow-soft hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground text-sm">Flights</h3>
              </div>
              <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase">Outbound</span>
                  <span className="text-xs font-medium text-foreground">{plan.flights.outbound.estimatedCost}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-foreground">{plan.flights.outbound.departure}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{plan.flights.outbound.arrival}</span>
                  <span className="text-xs text-muted-foreground">• {plan.flights.outbound.duration}</span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase">Return</span>
                  <span className="text-xs font-medium text-foreground">{plan.flights.return.estimatedCost}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-foreground">{plan.flights.return.departure}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{plan.flights.return.arrival}</span>
                  <span className="text-xs text-muted-foreground">• {plan.flights.return.duration}</span>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Hotel Section - Compact & Clickable */}
        {plan.hotel && (
          <button
            onClick={() => setEditHotelOpen(true)}
            className="w-full text-left bg-card rounded-xl p-4 mb-4 border border-border/50 shadow-soft hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Hotel className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground text-sm">Accommodation</h3>
              </div>
              <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-foreground">{plan.hotel.name}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: plan.hotel.starRating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{plan.hotel.neighborhood}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-medium text-foreground text-sm">{plan.hotel.totalEstimatedCost}</span>
                  <span className="text-xs text-muted-foreground block">{plan.hotel.estimatedCostPerNight}/night</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {plan.hotel.amenities.slice(0, 4).map((amenity, i) => (
                  <span key={i} className="text-xs bg-background px-2 py-0.5 rounded-full border border-border/50">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </button>
        )}

        {/* Days - Accordion Style */}
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          Daily Itinerary
          <span className="text-xs text-muted-foreground font-normal">(tap any block to edit)</span>
        </h3>
        <div className="space-y-2">
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
                  <button className="w-full bg-card rounded-xl p-3 shadow-soft border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="font-medium text-primary text-sm">
                          Day {day.dayNumber}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {day.blocks.length} activities
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-right">
                          <div className="hidden sm:block">
                            <p className="text-xs font-medium text-foreground">
                              {formattedDate}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                              <Thermometer className="w-3 h-3" />
                              {day.weather.lowTemp}°-{day.weather.highTemp}°F
                            </div>
                          </div>
                          <WeatherIcon condition={day.weather.condition} />
                        </div>

                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                        />
                      </div>
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                  <div className="pt-2 pl-4 space-y-2">
                    {day.blocks.map((block, i) => {
                      // Check for time overlap with previous block
                      const hasOverlap = i > 0 && (() => {
                        const prevBlock = day.blocks[i - 1];
                        const parseTime = (time: string) => {
                          const [timePart, period] = time.split(' ');
                          let [hours, minutes] = timePart.split(':').map(Number);
                          if (period === 'PM' && hours !== 12) hours += 12;
                          if (period === 'AM' && hours === 12) hours = 0;
                          return hours * 60 + minutes;
                        };
                        try {
                          const prevEnd = parseTime(prevBlock.endTime);
                          const currentStart = parseTime(block.time);
                          return currentStart < prevEnd;
                        } catch {
                          return false;
                        }
                      })();

                      // Format cost to always show in dollars
                      const formatCostInDollars = (cost: string): string => {
                        const trimmed = cost.trim().toLowerCase();
                        if (trimmed === 'free' || trimmed === '0' || trimmed === '$0') {
                          return 'Free';
                        }
                        // Remove existing currency symbols and clean up
                        let cleanCost = cost.replace(/[€£¥₹₩฿]/g, '').trim();
                        // If already has $ sign, just return it
                        if (cleanCost.startsWith('$')) {
                          return cleanCost;
                        }
                        // Add $ if it's just a number or range
                        if (/^\d/.test(cleanCost)) {
                          return `$${cleanCost}`;
                        }
                        return cleanCost;
                      };

                      const formattedCost = formatCostInDollars(block.estimatedCost);
                      const isFree = formattedCost.toLowerCase() === 'free';

                      return (
                        <button
                          key={i}
                          onClick={() => handleEditBlock(block, day.dayNumber, i)}
                          className={cn(
                            "w-full text-left flex gap-3 p-4 pr-6 rounded-xl bg-card border hover:border-primary/40 hover:shadow-sm transition-all group",
                            hasOverlap ? "border-red-300" : "border-border/50"
                          )}
                        >
                          <div className="text-xs font-medium text-muted-foreground w-14 shrink-0">
                            <span className="block">{block.time}</span>
                            <span className="block opacity-70 mt-0.5">{block.endTime}</span>
                            {hasOverlap && (
                              <div className="mt-1 text-[10px] text-red-500 font-medium">
                                ⚠ Overlap
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-medium text-foreground text-sm leading-snug">{block.title}</h4>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded-full border ${
                                    categoryColors[block.category] || categoryColors["activity"]
                                  }`}
                                >
                                  {block.category}
                                </span>
                                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground leading-relaxed">{block.description}</p>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{block.location}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                {isFree && <DollarSign className="w-3 h-3" />}
                                {formattedCost}
                              </span>
                            </div>

                            {block.transportNote && (
                              <div className="flex items-center gap-1.5 text-xs text-purple-600 pt-1">
                                <Navigation className="w-3 h-3 shrink-0" />
                                <span>{block.transportNote}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        {/* CTA - Save Plan */}
        <div className="text-center mt-10 pb-8 space-y-4">
          {!publishedUrl ? (
            <Button
              size="lg"
              onClick={handleSave}
              disabled={publishing}
              className="px-6 py-5 text-base rounded-xl gap-2"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Plan
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                <Check className="w-4 h-4" />
                Plan Saved!
              </div>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publishedUrl}
                  className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm w-72 text-muted-foreground"
                />
                <Button variant="outline" size="icon" onClick={copyToClipboard} className="h-9 w-9">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(publishedUrl, "_blank")}
                  className="gap-2"
                >
                  <Globe className="w-4 h-4" />
                  View Plan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/saved")}
                  className="gap-2"
                >
                  All Saved Plans
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Drawers */}
      <EditTimeBlockDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        block={editingBlock?.block || null}
        dayNumber={editingBlock?.dayNumber || 1}
        blockIndex={editingBlock?.blockIndex || 0}
        destination={tripData?.destination || ""}
        tripDates={{
          start: tripData?.startDate || "",
          end: tripData?.endDate || "",
        }}
        onSave={handleSaveBlock}
      />

      <EditFlightsDrawer
        open={editFlightsOpen}
        onOpenChange={setEditFlightsOpen}
        flights={plan.flights || null}
        destination={tripData?.destination || ""}
        tripDates={{
          start: tripData?.startDate || "",
          end: tripData?.endDate || "",
        }}
        onSave={handleSaveFlights}
      />

      <EditHotelDrawer
        open={editHotelOpen}
        onOpenChange={setEditHotelOpen}
        hotel={plan.hotel || null}
        destination={tripData?.destination || ""}
        tripDates={{
          start: tripData?.startDate || "",
          end: tripData?.endDate || "",
        }}
        onSave={handleSaveHotel}
      />
    </div>
  );
};

export default TripResults;
