import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DestinationAutocomplete from "@/components/DestinationAutocomplete";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, differenceInDays } from "date-fns";
import { 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  CalendarIcon, 
  Coins, 
  Users, 
  Sparkles, 
  MessageSquare,
  Check,
  User,
  Heart,
  Users2,
  Flower2,
  Mountain,
  Landmark,
  UtensilsCrossed,
  Moon,
  Sun,
  Gem,
  PiggyBank,
  type LucideIcon
} from "lucide-react";
import SoothingGradient from "@/components/SoothingGradient";

type TripData = {
  destination: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  budget: string;
  groupSize: string;
  vibe: string[];
  specialInstructions: string;
};

const vibeOptions: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "relaxed", label: "Relaxed & Slow", Icon: Flower2 },
  { id: "adventure", label: "Adventure", Icon: Mountain },
  { id: "cultural", label: "Cultural", Icon: Landmark },
  { id: "foodie", label: "Foodie", Icon: UtensilsCrossed },
  { id: "nightlife", label: "Nightlife", Icon: Moon },
  { id: "nature", label: "Nature", Icon: Sun },
  { id: "luxury", label: "Luxury", Icon: Gem },
  { id: "budget", label: "Budget-friendly", Icon: PiggyBank },
];

const budgetOptions = [
  { id: "budget", label: "Budget", description: "Hostels, street food, public transport" },
  { id: "moderate", label: "Moderate", description: "Mid-range hotels, local restaurants" },
  { id: "comfort", label: "Comfort", description: "Nice hotels, guided tours" },
  { id: "luxury", label: "Luxury", description: "5-star hotels, premium experiences" },
];

const groupSizeOptions: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "solo", label: "Solo", Icon: User },
  { id: "couple", label: "Couple", Icon: Heart },
  { id: "small", label: "Small Group (3-5)", Icon: Users },
  { id: "large", label: "Large Group (6+)", Icon: Users2 },
];

const steps = [
  { id: 1, title: "Destination", icon: MapPin },
  { id: 2, title: "Dates", icon: CalendarIcon },
  { id: 3, title: "Budget", icon: Coins },
  { id: 4, title: "Group Size", icon: Users },
  { id: 5, title: "Vibe", icon: Sparkles },
  { id: 6, title: "Special Instructions", icon: MessageSquare },
];

const GenerateTrip = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [tripData, setTripData] = useState<TripData>({
    destination: "",
    startDate: undefined,
    endDate: undefined,
    budget: "",
    groupSize: "",
    vibe: [],
    specialInstructions: "",
  });

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - navigate to results with trip data
      navigate("/results", {
        state: {
          tripData: {
            ...tripData,
            startDate: tripData.startDate?.toISOString(),
            endDate: tripData.endDate?.toISOString(),
          },
        },
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/");
    }
  };

  const toggleVibe = (vibeId: string) => {
    setTripData((prev) => ({
      ...prev,
      vibe: prev.vibe.includes(vibeId)
        ? prev.vibe.filter((v) => v !== vibeId)
        : [...prev.vibe, vibeId],
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return tripData.destination.trim().length > 0;
      case 2:
        return tripData.startDate && tripData.endDate;
      case 3:
        return tripData.budget !== "";
      case 4:
        return tripData.groupSize !== "";
      case 5:
        return tripData.vibe.length > 0;
      case 6:
        return true; // Special instructions are optional
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Where do you want to go?
              </h2>
              <p className="text-muted-foreground">
                Enter a city, country, or region
              </p>
            </div>
            <DestinationAutocomplete
              value={tripData.destination}
              onChange={(value) =>
                setTripData({ ...tripData, destination: value })
              }
            />
          </div>
        );

      case 2: {
        const maxTripDays = 14;
        const tripDuration = tripData.startDate && tripData.endDate 
          ? differenceInDays(tripData.endDate, tripData.startDate) + 1 
          : 0;
        
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                When are you traveling?
              </h2>
              <p className="text-muted-foreground">
                Select your start and end dates (max 2 weeks)
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left font-normal rounded-xl py-6 border-2",
                      !tripData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tripData.startDate
                      ? format(tripData.startDate, "PPP")
                      : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={tripData.startDate}
                    onSelect={(date) =>
                      setTripData({ ...tripData, startDate: date, endDate: undefined })
                    }
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left font-normal rounded-xl py-6 border-2",
                      !tripData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tripData.endDate
                      ? format(tripData.endDate, "PPP")
                      : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={tripData.endDate}
                    onSelect={(date) =>
                      setTripData({ ...tripData, endDate: date })
                    }
                    disabled={(date) =>
                      date < new Date() ||
                      (tripData.startDate ? date < tripData.startDate : false) ||
                      (tripData.startDate ? date > addDays(tripData.startDate, maxTripDays - 1) : false)
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            {tripDuration > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {tripDuration} day{tripDuration > 1 ? "s" : ""} trip
              </p>
            )}
          </div>
        );
      }

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                What's your budget style?
              </h2>
              <p className="text-muted-foreground">
                This helps us tailor recommendations
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              {budgetOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() =>
                    setTripData({ ...tripData, budget: option.id })
                  }
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all hover:border-primary",
                    tripData.budget === option.id
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  )}
                >
                  <div className="font-semibold text-foreground">
                    {option.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Who's traveling?
              </h2>
              <p className="text-muted-foreground">
                Select your group size
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {groupSizeOptions.map((option) => {
                const IconComponent = option.Icon;
                return (
                  <button
                    key={option.id}
                    onClick={() =>
                      setTripData({ ...tripData, groupSize: option.id })
                    }
                    className={cn(
                      "p-6 rounded-xl border-2 text-center transition-all hover:border-primary group",
                      tripData.groupSize === option.id
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-colors",
                      tripData.groupSize === option.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-primary group-hover:bg-primary/20"
                    )}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="font-semibold text-foreground">
                      {option.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                What's your travel vibe?
              </h2>
              <p className="text-muted-foreground">
                Select all that apply
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {vibeOptions.map((option) => {
                const IconComponent = option.Icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleVibe(option.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all hover:border-primary relative",
                      tripData.vibe.includes(option.id)
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    )}
                  >
                    {tripData.vibe.includes(option.id) && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex justify-center mb-2">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {option.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Anything else we should know?
              </h2>
              <p className="text-muted-foreground">
                Special requests, must-see spots, dietary needs... (optional)
              </p>
            </div>
            <Textarea
              placeholder="e.g., We love street food, want to avoid touristy spots, and one of us uses a wheelchair..."
              value={tripData.specialInstructions}
              onChange={(e) =>
                setTripData({
                  ...tripData,
                  specialInstructions: e.target.value,
                })
              }
              className="min-h-[150px] text-base rounded-xl border-2 focus:border-primary resize-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <SoothingGradient />
      
      {/* Header */}
      <header className="relative z-10 p-4 md:p-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentStep === 1 ? "Back to home" : "Back"}
        </Button>
        {!authLoading && !user && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/auth", { state: { returnTo: "/generate" } })}
            className="gap-1.5"
          >
            Sign in
          </Button>
        )}
      </header>

      {/* Progress Indicator */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 md:w-16 h-1 mx-1",
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center mt-4">
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of 6
          </span>
        </div>
      </div>

      {/* Step Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 pb-32">
        {renderStepContent()}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border z-20">
        <div className="max-w-2xl mx-auto flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="gap-2 px-8 py-6 text-lg rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {currentStep === 6 ? "Generate my trip" : "Continue"}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateTrip;
