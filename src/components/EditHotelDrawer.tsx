import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Check, X, Hotel, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

type HotelSuggestion = {
  name: string;
  neighborhood: string;
  estimatedCost: string;
  amenities: string[];
  reason: string;
};

interface EditHotelDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: HotelType | null;
  destination: string;
  tripDates: { start: string; end: string };
  onSave: (updatedHotel: HotelType) => void;
}

export function EditHotelDrawer({
  open,
  onOpenChange,
  hotel,
  destination,
  tripDates,
  onSave,
}: EditHotelDrawerProps) {
  const { toast } = useToast();
  const [editedHotel, setEditedHotel] = useState<HotelType | null>(null);
  const [suggestions, setSuggestions] = useState<HotelSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (hotel && open) {
      setEditedHotel({ ...hotel });
    }
  }, [hotel, open]);

  const handleGetSuggestions = async () => {
    if (!editedHotel) return;

    setLoadingSuggestions(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke("suggest-alternatives", {
        body: {
          block: {
            time: editedHotel.checkIn,
            endTime: editedHotel.checkOut,
            title: editedHotel.name,
            description: `${editedHotel.starRating}-star hotel in ${editedHotel.neighborhood}. ${editedHotel.whyRecommended}`,
            location: editedHotel.address,
            estimatedCost: editedHotel.totalEstimatedCost,
            category: "accommodation",
          },
          destination,
          tripDates,
          context: `Current hotel: ${editedHotel.name}, ${editedHotel.starRating} stars, ${editedHotel.estimatedCostPerNight}/night. Amenities: ${editedHotel.amenities.join(", ")}`,
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        const hotelSuggestions = data.suggestions.map((s: any) => ({
          name: s.title,
          neighborhood: s.location,
          estimatedCost: s.estimatedCost,
          amenities: editedHotel.amenities, // Keep amenities as parsing them is complex
          reason: s.reason,
        }));
        setSuggestions(hotelSuggestions);
      }
    } catch (err) {
      console.error("Error getting hotel suggestions:", err);
      toast({
        title: "Couldn't get suggestions",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: HotelSuggestion) => {
    if (!editedHotel) return;
    setEditedHotel({
      ...editedHotel,
      name: suggestion.name,
      neighborhood: suggestion.neighborhood,
      totalEstimatedCost: suggestion.estimatedCost,
      whyRecommended: suggestion.reason,
    });
    setSuggestions([]);
    toast({ title: "Suggestion applied" });
  };

  const handleSave = () => {
    if (!editedHotel) return;
    onSave(editedHotel);
    onOpenChange(false);
    setSuggestions([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSuggestions([]);
  };

  if (!hotel || !editedHotel) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Hotel className="w-5 h-5 text-primary" />
              Edit Accommodation
            </DrawerTitle>
            <DrawerDescription>
              {destination} • {tripDates.start} to {tripDates.end}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            {/* AI Suggestions */}
            <Button
              variant="outline"
              onClick={handleGetSuggestions}
              disabled={loadingSuggestions}
              className="w-full gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
            >
              {loadingSuggestions ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding alternatives...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-primary" />
                  Get AI Hotel Suggestions
                </>
              )}
            </Button>

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">AI Alternatives:</p>
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">{suggestion.name}</span>
                      <span className="text-xs text-muted-foreground">{suggestion.estimatedCost}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{suggestion.neighborhood}</p>
                    <p className="text-xs text-primary">{suggestion.reason}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Edit Form */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label className="text-xs">Hotel Name</Label>
                <Input
                  value={editedHotel.name}
                  onChange={(e) => setEditedHotel({ ...editedHotel, name: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Star Rating</Label>
                  <div className="flex items-center gap-1 h-9">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditedHotel({ ...editedHotel, starRating: star })}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= editedHotel.starRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Neighborhood</Label>
                  <Input
                    value={editedHotel.neighborhood}
                    onChange={(e) => setEditedHotel({ ...editedHotel, neighborhood: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input
                  value={editedHotel.address}
                  onChange={(e) => setEditedHotel({ ...editedHotel, address: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cost per Night</Label>
                  <Input
                    value={editedHotel.estimatedCostPerNight}
                    onChange={(e) => setEditedHotel({ ...editedHotel, estimatedCostPerNight: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Total Cost</Label>
                  <Input
                    value={editedHotel.totalEstimatedCost}
                    onChange={(e) => setEditedHotel({ ...editedHotel, totalEstimatedCost: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Check-in</Label>
                  <Input
                    value={editedHotel.checkIn}
                    onChange={(e) => setEditedHotel({ ...editedHotel, checkIn: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Check-out</Label>
                  <Input
                    value={editedHotel.checkOut}
                    onChange={(e) => setEditedHotel({ ...editedHotel, checkOut: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Amenities (comma separated)</Label>
                <Input
                  value={editedHotel.amenities.join(", ")}
                  onChange={(e) => setEditedHotel({ 
                    ...editedHotel, 
                    amenities: e.target.value.split(",").map(a => a.trim()).filter(Boolean)
                  })}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Why Recommended</Label>
                <Textarea
                  value={editedHotel.whyRecommended}
                  onChange={(e) => setEditedHotel({ ...editedHotel, whyRecommended: e.target.value })}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2">
            <DrawerClose asChild>
              <Button variant="outline" onClick={handleClose} className="flex-1 gap-1">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </DrawerClose>
            <Button onClick={handleSave} className="flex-1 gap-1">
              <Check className="w-4 h-4" />
              Save Changes
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
