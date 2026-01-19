import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, differenceInDays } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plane,
  Hotel,
  Calendar as CalendarIcon,
  Luggage,
  Plus,
  Sparkles,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Pencil,
  Trash2,
  Globe,
  Loader2,
  Copy,
} from "lucide-react";
import SoothingGradient from "@/components/SoothingGradient";
import DestinationAutocomplete from "@/components/DestinationAutocomplete";
import { EditFlightsDrawer } from "@/components/EditFlightsDrawer";
import { EditHotelDrawer } from "@/components/EditHotelDrawer";
import { EditTimeBlockDrawer } from "@/components/EditTimeBlockDrawer";
import { EditDayDrawer } from "@/components/EditDayDrawer";
import { EditPackingDrawer } from "@/components/EditPackingDrawer";
import {
  Flights,
  HotelType,
  Day,
  TimeBlock,
  TripPlan,
  emptyFlights,
  emptyHotel,
  emptyDay,
  emptyTimeBlock,
} from "@/types/trip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  { id: 1, name: "Flights", icon: Plane },
  { id: 2, name: "Hotel", icon: Hotel },
  { id: 3, name: "Days", icon: CalendarIcon },
  { id: 4, name: "Packing", icon: Luggage },
];

const BuildTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0); // 0 = trip details, 1-4 = steps
  
  // Trip details
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [tripName, setTripName] = useState("");
  
  // Trip data
  const [flights, setFlights] = useState<Flights | null>(null);
  const [hotel, setHotel] = useState<HotelType | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [packingTips, setPackingTips] = useState<string[]>([]);
  
  // Drawer states
  const [flightsDrawerOpen, setFlightsDrawerOpen] = useState(false);
  const [hotelDrawerOpen, setHotelDrawerOpen] = useState(false);
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Day | null>(null);
  const [timeBlockDrawerOpen, setTimeBlockDrawerOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<{
    block: TimeBlock;
    dayNumber: number;
    blockIndex: number;
  } | null>(null);
  const [packingDrawerOpen, setPackingDrawerOpen] = useState(false);

  // Publishing state
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tripDates = { 
    start: startDate ? format(startDate, "yyyy-MM-dd") : "", 
    end: endDate ? format(endDate, "yyyy-MM-dd") : "" 
  };

  // Initialize days when moving to step 3
  const initializeDays = () => {
    if (days.length === 0 && startDate && endDate) {
      const numDays = differenceInDays(endDate, startDate) + 1;
      
      const newDays: Day[] = [];
      for (let i = 0; i < numDays; i++) {
        const date = addDays(startDate, i);
        newDays.push(emptyDay(i + 1, format(date, "yyyy-MM-dd")));
      }
      setDays(newDays);
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!destination || !startDate || !endDate) {
        toast({
          title: "Missing information",
          description: "Please fill in destination and dates.",
          variant: "destructive",
        });
        return;
      }
      if (!tripName) {
        setTripName(`Trip to ${destination}`);
      }
    }
    if (currentStep === 2) {
      initializeDays();
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    if (currentStep === 0) {
      navigate("/");
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Flights handlers
  const handleSaveFlights = (updatedFlights: Flights) => {
    setFlights(updatedFlights);
    toast({ title: "Flights saved" });
  };

  // Hotel handlers
  const handleSaveHotel = (updatedHotel: HotelType) => {
    setHotel(updatedHotel);
    toast({ title: "Accommodation saved" });
  };

  // Day handlers
  const handleAddDay = () => {
    const lastDay = days[days.length - 1];
    const lastDate = lastDay ? new Date(lastDay.date) : (startDate || new Date());
    const newDate = addDays(lastDate, lastDay ? 1 : 0);
    
    const newDay = emptyDay(days.length + 1, format(newDate, "yyyy-MM-dd"));
    setDays([...days, newDay]);
    toast({ title: "Day added" });
  };

  const handleEditDay = (day: Day) => {
    setEditingDay(day);
    setDayDrawerOpen(true);
  };

  const handleSaveDay = (updatedDay: Day) => {
    setDays(days.map(d => d.dayNumber === updatedDay.dayNumber ? updatedDay : d));
  };

  const handleDeleteDay = (dayNumber: number) => {
    const updatedDays = days
      .filter(d => d.dayNumber !== dayNumber)
      .map((d, i) => ({ ...d, dayNumber: i + 1 }));
    setDays(updatedDays);
    toast({ title: "Day removed" });
  };

  // Time block handlers
  const handleAddBlock = (dayNumber: number) => {
    const day = days.find(d => d.dayNumber === dayNumber);
    if (!day) return;
    
    setEditingBlock({
      block: { ...emptyTimeBlock },
      dayNumber,
      blockIndex: day.blocks.length,
    });
    setTimeBlockDrawerOpen(true);
  };

  const handleEditBlock = (block: TimeBlock, dayNumber: number, blockIndex: number) => {
    setEditingBlock({ block, dayNumber, blockIndex });
    setTimeBlockDrawerOpen(true);
  };

  const handleSaveBlock = (dayNumber: number, blockIndex: number, updatedBlock: TimeBlock) => {
    setDays(days.map(day => {
      if (day.dayNumber === dayNumber) {
        const newBlocks = [...day.blocks];
        if (blockIndex >= day.blocks.length) {
          newBlocks.push(updatedBlock);
        } else {
          newBlocks[blockIndex] = updatedBlock;
        }
        return { ...day, blocks: newBlocks };
      }
      return day;
    }));
  };

  const handleDeleteBlock = (dayNumber: number, blockIndex: number) => {
    setDays(days.map(day => {
      if (day.dayNumber === dayNumber) {
        const newBlocks = day.blocks.filter((_, i) => i !== blockIndex);
        return { ...day, blocks: newBlocks };
      }
      return day;
    }));
    toast({ title: "Activity removed" });
  };

  // Packing handlers
  const handleSavePacking = (tips: string[]) => {
    setPackingTips(tips);
  };

  // Generate hero image for the destination
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
      return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop";
    }
  };

  // Generate destination theme colors
  const getDestinationTheme = (destination: string): { primary: string; secondary: string; accent: string; gradient: string } => {
    const dest = destination.toLowerCase();
    
    if (dest.includes("bali") || dest.includes("hawaii") || dest.includes("maldives") || dest.includes("caribbean") || dest.includes("fiji")) {
      return { primary: "158 64% 52%", secondary: "180 60% 90%", accent: "43 96% 56%", gradient: "from-teal-500/20 via-cyan-400/10 to-yellow-400/20" };
    }
    if (dest.includes("paris") || dest.includes("rome") || dest.includes("venice") || dest.includes("florence")) {
      return { primary: "15 80% 50%", secondary: "30 50% 95%", accent: "45 93% 47%", gradient: "from-amber-500/20 via-orange-400/10 to-rose-400/20" };
    }
    if (dest.includes("iceland") || dest.includes("norway") || dest.includes("sweden") || dest.includes("finland") || dest.includes("alaska")) {
      return { primary: "200 80% 50%", secondary: "200 30% 95%", accent: "170 80% 40%", gradient: "from-blue-400/20 via-cyan-300/10 to-teal-400/20" };
    }
    if (dest.includes("tokyo") || dest.includes("japan") || dest.includes("kyoto")) {
      return { primary: "350 80% 60%", secondary: "350 20% 95%", accent: "150 50% 45%", gradient: "from-pink-400/20 via-rose-300/10 to-green-400/20" };
    }
    if (dest.includes("thailand") || dest.includes("bangkok") || dest.includes("vietnam")) {
      return { primary: "35 90% 55%", secondary: "35 40% 95%", accent: "160 60% 45%", gradient: "from-orange-400/20 via-amber-300/10 to-emerald-400/20" };
    }
    if (dest.includes("dubai") || dest.includes("morocco") || dest.includes("egypt") || dest.includes("jordan")) {
      return { primary: "30 70% 50%", secondary: "30 30% 95%", accent: "20 80% 45%", gradient: "from-amber-500/20 via-orange-400/10 to-red-400/20" };
    }
    if (dest.includes("switzerland") || dest.includes("alps") || dest.includes("colorado") || dest.includes("aspen") || dest.includes("breckenridge")) {
      return { primary: "210 60% 50%", secondary: "210 20% 95%", accent: "150 60% 40%", gradient: "from-blue-400/20 via-slate-300/10 to-emerald-400/20" };
    }
    if (dest.includes("miami") || dest.includes("cancun") || dest.includes("bahamas")) {
      return { primary: "185 70% 50%", secondary: "185 30% 95%", accent: "330 70% 55%", gradient: "from-cyan-400/20 via-teal-300/10 to-pink-400/20" };
    }
    if (dest.includes("new york") || dest.includes("london") || dest.includes("singapore") || dest.includes("hong kong")) {
      return { primary: "220 60% 45%", secondary: "220 20% 95%", accent: "40 80% 50%", gradient: "from-slate-400/20 via-gray-300/10 to-amber-400/20" };
    }
    return { primary: "20 80% 55%", secondary: "20 30% 95%", accent: "180 60% 45%", gradient: "from-orange-400/20 via-amber-300/10 to-teal-400/20" };
  };

  // Publish handler
  const handlePublish = async () => {
    if (!destination || !startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);
    try {
      toast({
        title: "Generating your website...",
        description: "Creating a custom hero image for your trip.",
      });

      const heroImageUrl = await generateHeroImage(destination, tripName || `Trip to ${destination}`);
      const themeColors = getDestinationTheme(destination);
      
      // Calculate estimated total cost
      let totalCost = 0;
      if (flights) {
        const outboundCost = parseFloat(flights.outbound.estimatedCost.replace(/[^0-9.]/g, '')) || 0;
        const returnCost = parseFloat(flights.return.estimatedCost.replace(/[^0-9.]/g, '')) || 0;
        totalCost += outboundCost + returnCost;
      }
      if (hotel) {
        const hotelCost = parseFloat(hotel.totalEstimatedCost.replace(/[^0-9.]/g, '')) || 0;
        totalCost += hotelCost;
      }
      days.forEach(day => {
        day.blocks.forEach(block => {
          const blockCost = parseFloat(block.estimatedCost.replace(/[^0-9.]/g, '')) || 0;
          totalCost += blockCost;
        });
      });

      const plan: TripPlan = {
        name: tripName || `Trip to ${destination}`,
        theme: "Custom Trip",
        summary: `Your custom-built trip to ${destination}`,
        flights: flights || undefined,
        hotel: hotel || undefined,
        days,
        estimatedTotalCost: `$${totalCost.toLocaleString()}`,
        highlights: days.slice(0, 3).map(d => d.blocks[0]?.title || `Day ${d.dayNumber}`),
        packingTips,
      };
      
      const { data, error: insertError } = await supabase
        .from("published_trips" as never)
        .insert({
          destination,
          start_date: startDate,
          end_date: endDate,
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

  // Calculate progress
  const filledSteps = [
    flights !== null,
    hotel !== null,
    days.some(d => d.blocks.length > 0),
    packingTips.length > 0,
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <SoothingGradient />

      {/* Header */}
      <header className="relative z-10 p-4 md:p-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 0 ? "Home" : "Back"}
          </Button>
          
          {currentStep > 0 && (
            <div className="flex items-center gap-1">
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors",
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : filledSteps[i]
                      ? "bg-green-100 text-green-700"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <step.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{step.name}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            {currentStep === 0 ? "Trip Details" : `Step ${currentStep}/4`}
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Step 0: Trip Details */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Build Your Trip
              </h1>
              <p className="text-muted-foreground text-sm">
                Start by telling us where you're going
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border/50 shadow-soft space-y-4">
              <div className="space-y-2">
                <Label>Trip Name (optional)</Label>
                <Input
                  placeholder="My Amazing Adventure"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Destination *</Label>
                <DestinationAutocomplete
                  value={destination}
                  onChange={setDestination}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setEndDate(undefined);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          (startDate ? date < startDate : false) ||
                          (startDate ? date > addDays(startDate, 13) : false)
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {startDate && endDate && (
                <p className="text-center text-sm text-muted-foreground">
                  {differenceInDays(endDate, startDate) + 1} day{differenceInDays(endDate, startDate) + 1 > 1 ? "s" : ""} trip
                </p>
              )}
            </div>

            <Button onClick={handleNext} className="w-full gap-2">
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 1: Flights */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                <Plane className="w-3 h-3" />
                Step 1: Flights
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Add your flight details
              </h2>
            </div>

            {flights ? (
              <button
                onClick={() => setFlightsDrawerOpen(true)}
                className="w-full text-left bg-card rounded-xl p-4 border border-border/50 shadow-soft hover:border-primary/40 hover:shadow-md transition-all group"
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
                    <span className="text-xs font-medium text-primary uppercase">Outbound</span>
                    <div className="text-sm text-foreground">{flights.outbound.airline || "No airline"}</div>
                    <div className="text-xs text-muted-foreground">{flights.outbound.departure} → {flights.outbound.arrival}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <span className="text-xs font-medium text-primary uppercase">Return</span>
                    <div className="text-sm text-foreground">{flights.return.airline || "No airline"}</div>
                    <div className="text-xs text-muted-foreground">{flights.return.departure} → {flights.return.arrival}</div>
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setFlightsDrawerOpen(true)}
                className="w-full bg-card rounded-xl p-8 border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Add Flights</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add your outbound and return flight details
                    </p>
                  </div>
                </div>
              </button>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1 gap-2">
                {flights ? "Next" : "Skip"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Hotel */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                <Hotel className="w-3 h-3" />
                Step 2: Accommodation
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Where will you stay?
              </h2>
            </div>

            {hotel ? (
              <button
                onClick={() => setHotelDrawerOpen(true)}
                className="w-full text-left bg-card rounded-xl p-4 border border-border/50 shadow-soft hover:border-primary/40 hover:shadow-md transition-all group"
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
                      <h4 className="font-medium text-foreground">{hotel.name}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        {Array.from({ length: hotel.starRating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{hotel.neighborhood}</span>
                      </div>
                    </div>
                    <span className="font-medium text-foreground text-sm">{hotel.totalEstimatedCost}</span>
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setHotelDrawerOpen(true)}
                className="w-full bg-card rounded-xl p-8 border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Add Accommodation</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add your hotel, Airbnb, or other lodging
                    </p>
                  </div>
                </div>
              </button>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1 gap-2">
                {hotel ? "Next" : "Skip"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Days */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                <CalendarIcon className="w-3 h-3" />
                Step 3: Daily Itinerary
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Plan your days
              </h2>
            </div>

            <div className="space-y-3">
              {days.map((day) => (
                <div
                  key={day.dayNumber}
                  className="bg-card rounded-xl p-4 border border-border/50 shadow-soft"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-primary">Day {day.dayNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditDay(day)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      {days.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDay(day.dayNumber)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {day.blocks.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {day.blocks.map((block, i) => (
                        <button
                          key={i}
                          onClick={() => handleEditBlock(block, day.dayNumber, i)}
                          className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                        >
                          <div className="text-xs text-muted-foreground w-20 shrink-0">
                            {block.time || "—"}{block.endTime ? ` - ${block.endTime}` : ""}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">
                              {block.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {block.location}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {block.estimatedCost}
                            </span>
                            <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-3">No activities yet</p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleAddBlock(day.dayNumber)}
                  >
                    <Plus className="w-3 h-3" />
                    Add Activity
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleAddDay}
              >
                <Plus className="w-4 h-4" />
                Add Another Day
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1 gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Packing */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                <Luggage className="w-3 h-3" />
                Step 4: Packing Tips
              </div>
              <h2 className="text-xl font-bold text-foreground">
                What to pack?
              </h2>
            </div>

            {packingTips.length > 0 ? (
              <button
                onClick={() => setPackingDrawerOpen(true)}
                className="w-full text-left bg-card rounded-xl p-4 border border-border/50 shadow-soft hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Luggage className="w-4 h-4 text-primary" />
                    <h3 className="font-medium text-foreground text-sm">Packing Tips</h3>
                  </div>
                  <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {packingTips.map((tip, i) => (
                    <span key={i} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                      {tip}
                    </span>
                  ))}
                </div>
              </button>
            ) : (
              <button
                onClick={() => setPackingDrawerOpen(true)}
                className="w-full bg-card rounded-xl p-8 border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Add Packing Tips</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add reminders for what to pack
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Summary & Publish */}
            <div className="bg-card rounded-xl p-4 border border-border/50 shadow-soft">
              <h3 className="font-medium text-foreground mb-3">Trip Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {destination}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  {startDate ? format(startDate, "PPP") : ""} to {endDate ? format(endDate, "PPP") : ""} ({days.length} days)
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {days.reduce((acc, d) => acc + d.blocks.length, 0)} activities planned
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
            </div>

            {/* Publish CTA */}
            <div className="text-center space-y-4 pt-4">
              {!publishedUrl ? (
                <Button
                  size="lg"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-6 py-5 text-base rounded-xl gap-2"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      Publish Website
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm">
                    <Check className="w-4 h-4" />
                    Website Published!
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
                  <Button
                    variant="outline"
                    size="sm"
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
        )}
      </div>

      {/* Drawers */}
      <EditFlightsDrawer
        open={flightsDrawerOpen}
        onOpenChange={setFlightsDrawerOpen}
        flights={flights || emptyFlights}
        destination={destination}
        tripDates={tripDates}
        onSave={handleSaveFlights}
      />

      <EditHotelDrawer
        open={hotelDrawerOpen}
        onOpenChange={setHotelDrawerOpen}
        hotel={hotel || emptyHotel}
        destination={destination}
        tripDates={tripDates}
        onSave={handleSaveHotel}
      />

      <EditDayDrawer
        open={dayDrawerOpen}
        onOpenChange={setDayDrawerOpen}
        day={editingDay}
        onSave={handleSaveDay}
      />

      <EditTimeBlockDrawer
        open={timeBlockDrawerOpen}
        onOpenChange={setTimeBlockDrawerOpen}
        block={editingBlock?.block || null}
        dayNumber={editingBlock?.dayNumber || 1}
        blockIndex={editingBlock?.blockIndex || 0}
        destination={destination}
        tripDates={tripDates}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
      />

      <EditPackingDrawer
        open={packingDrawerOpen}
        onOpenChange={setPackingDrawerOpen}
        packingTips={packingTips}
        destination={destination}
        tripDates={tripDates}
        onSave={handleSavePacking}
      />
    </div>
  );
};

export default BuildTrip;
