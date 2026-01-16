import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, DollarSign, Sparkles, Loader2 } from "lucide-react";
import SoothingGradient from "@/components/SoothingGradient";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TimeBlock = {
  time: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  estimatedCost: string;
  category: "food" | "activity" | "transport" | "accommodation" | "free-time";
};

type Day = {
  dayNumber: number;
  date: string;
  blocks: TimeBlock[];
};

type TripPlan = {
  name: string;
  theme: string;
  summary: string;
  days: Day[];
  estimatedTotalCost: string;
  highlights: string[];
};

type Plans = {
  plan1: TripPlan;
  plan2: TripPlan;
};

const categoryColors: Record<string, string> = {
  food: "bg-orange-100 text-orange-700 border-orange-200",
  activity: "bg-blue-100 text-blue-700 border-blue-200",
  transport: "bg-purple-100 text-purple-700 border-purple-200",
  accommodation: "bg-green-100 text-green-700 border-green-200",
  "free-time": "bg-gray-100 text-gray-700 border-gray-200",
};

const TripResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plans | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"plan1" | "plan2">("plan1");

  const tripData = location.state?.tripData;

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

        if (!data?.plans?.plan1 || !data?.plans?.plan2) {
          throw new Error("Invalid response from AI");
        }

        setPlans(data.plans);
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
              Our AI is creating two unique itineraries tailored to your preferences. This usually takes 15-30 seconds.
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

  if (error || !plans) {
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
              {error || "We couldn't generate your trip plans. Please try again."}
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

  const currentPlan = plans[selectedPlan];

  return (
    <div className="min-h-screen bg-background relative">
      <SoothingGradient />

      {/* Header */}
      <header className="relative z-10 p-4 md:p-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/generate")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Start Over
          </Button>
          <div className="flex gap-2">
            <Button
              variant={selectedPlan === "plan1" ? "default" : "outline"}
              onClick={() => setSelectedPlan("plan1")}
              className="rounded-full"
            >
              Plan A
            </Button>
            <Button
              variant={selectedPlan === "plan2" ? "default" : "outline"}
              onClick={() => setSelectedPlan("plan2")}
              className="rounded-full"
            >
              Plan B
            </Button>
          </div>
        </div>
      </header>

      {/* Plan Header */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            {currentPlan.theme}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {currentPlan.name}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {currentPlan.summary}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-primary" />
              {currentPlan.estimatedTotalCost}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-primary" />
              {currentPlan.days.length} days
            </span>
          </div>
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {currentPlan.highlights.map((highlight, i) => (
            <span
              key={i}
              className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
            >
              {highlight}
            </span>
          ))}
        </div>

        {/* Days */}
        <div className="space-y-8">
          {currentPlan.days.map((day) => (
            <div key={day.dayNumber} className="bg-card rounded-2xl p-6 shadow-soft border border-border/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  {day.dayNumber}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Day {day.dayNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {day.blocks.map((block, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-4 rounded-xl bg-background border border-border/50 hover:shadow-sm transition-shadow"
                  >
                    <div className="text-sm font-medium text-muted-foreground w-20 shrink-0">
                      {block.time}
                      <br />
                      <span className="text-xs">to {block.endTime}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-foreground">{block.title}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${
                            categoryColors[block.category] || categoryColors["activity"]
                          }`}
                        >
                          {block.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{block.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {block.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {block.estimatedCost}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 pb-8">
          <Button size="lg" className="px-8 py-6 text-lg rounded-xl">
            Choose This Plan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TripResults;
