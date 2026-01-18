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
import { Loader2, Check, X, Hotel, Star, Search, AlertCircle, Sparkles } from "lucide-react";
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

type RealHotelResult = {
  name: string;
  hotelId: string;
  address: string;
  cityName: string;
  rating: number | null;
  pricePerNight: string;
  totalPrice: string;
  currency: string;
  roomType?: string;
  bedType?: string;
  amenities: string[];
  cancellationPolicy?: string;
  source: string;
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
  const [hotelResults, setHotelResults] = useState<RealHotelResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (hotel && open) {
      setEditedHotel({ ...hotel });
    }
  }, [hotel, open]);

  const searchRealHotels = async () => {
    if (!destination || !tripDates.start || !tripDates.end) {
      toast({
        title: "Missing trip details",
        description: "Please ensure destination and dates are set.",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setSearchError(null);
    setHotelResults([]);

    try {
      console.log("Searching hotels for:", destination, tripDates);

      const { data, error } = await supabase.functions.invoke("search-hotels", {
        body: {
          destination,
          checkInDate: tripDates.start,
          checkOutDate: tripDates.end,
          adults: 1,
          maxResults: 3,
        },
      });

      if (error) throw error;

      if (data?.error) {
        setSearchError(data.error);
        toast({
          title: "Search failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data?.hotels && data.hotels.length > 0) {
        setHotelResults(data.hotels);
        toast({
          title: `Found ${data.hotels.length} hotels`,
          description: "Real-time results from Amadeus",
        });
      } else {
        setSearchError("No hotels found for this destination and dates.");
        toast({
          title: "No hotels found",
          description: "Try a different destination or dates.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error searching hotels:", err);
      setSearchError("Failed to search hotels. Please try again.");
      toast({
        title: "Search error",
        description: "Could not connect to hotel search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const selectHotel = (hotelResult: RealHotelResult) => {
    if (!editedHotel) return;

    // Calculate number of nights for the booking tip
    const checkIn = new Date(tripDates.start);
    const checkOut = new Date(tripDates.end);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    setEditedHotel({
      ...editedHotel,
      name: hotelResult.name,
      address: hotelResult.address || hotelResult.cityName,
      neighborhood: hotelResult.cityName,
      starRating: hotelResult.rating || 3,
      estimatedCostPerNight: hotelResult.pricePerNight,
      totalEstimatedCost: hotelResult.totalPrice,
      amenities: hotelResult.amenities.length > 0 ? hotelResult.amenities : editedHotel.amenities,
      whyRecommended: hotelResult.roomType 
        ? `${hotelResult.roomType}${hotelResult.bedType ? ` with ${hotelResult.bedType}` : ""}`
        : "Real-time pricing from Amadeus",
      checkIn: tripDates.start,
      checkOut: tripDates.end,
      bookingTip: hotelResult.cancellationPolicy || `${nights} night stay`,
    });

    setHotelResults([]);
    toast({ title: "Hotel selected" });
  };

  const handleSave = () => {
    if (!editedHotel) return;
    onSave(editedHotel);
    onOpenChange(false);
    setHotelResults([]);
    setSearchError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setHotelResults([]);
    setSearchError(null);
  };

  if (!hotel || !editedHotel) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Hotel className="w-5 h-5 text-primary" />
              Search Hotels
            </DrawerTitle>
            <DrawerDescription>
              Real-time hotel search powered by Amadeus
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            {/* Search Info */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{destination}</span>
                {" • "}
                {tripDates.start} to {tripDates.end}
              </p>
            </div>

            {/* Search Button */}
            <Button
              onClick={searchRealHotels}
              disabled={searching}
              className="w-full gap-2"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching hotels...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Real Hotels
                </>
              )}
            </Button>

            {/* Search Error */}
            {searchError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {searchError}
              </div>
            )}

            {/* Hotel Results */}
            {hotelResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Live Hotel Results:
                </p>
                {hotelResults.map((hotelResult, i) => (
                  <button
                    key={i}
                    onClick={() => selectHotel(hotelResult)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <span className="font-medium text-sm text-foreground block">
                          {hotelResult.name}
                        </span>
                        {hotelResult.rating && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {Array.from({ length: hotelResult.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-primary block">
                          {hotelResult.totalPrice}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {hotelResult.pricePerNight}/night
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {hotelResult.address || hotelResult.cityName}
                    </div>
                    {hotelResult.roomType && (
                      <div className="text-xs text-primary/80 mt-1">
                        {hotelResult.roomType}
                      </div>
                    )}
                    {hotelResult.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {hotelResult.amenities.slice(0, 3).map((amenity, j) => (
                          <span key={j} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Manual Edit Form */}
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">Or enter details manually:</p>
              
              <div className="space-y-1.5">
                <Label className="text-xs">Hotel Name</Label>
                <Input
                  value={editedHotel.name}
                  onChange={(e) => setEditedHotel({ ...editedHotel, name: e.target.value })}
                  className="h-9"
                  placeholder="e.g., Marriott Downtown"
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
                    placeholder="e.g., Downtown"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input
                  value={editedHotel.address}
                  onChange={(e) => setEditedHotel({ ...editedHotel, address: e.target.value })}
                  className="h-9"
                  placeholder="e.g., 123 Main St"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cost per Night</Label>
                  <Input
                    value={editedHotel.estimatedCostPerNight}
                    onChange={(e) => setEditedHotel({ ...editedHotel, estimatedCostPerNight: e.target.value })}
                    className="h-9"
                    placeholder="e.g., $150"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Total Cost</Label>
                  <Input
                    value={editedHotel.totalEstimatedCost}
                    onChange={(e) => setEditedHotel({ ...editedHotel, totalEstimatedCost: e.target.value })}
                    className="h-9"
                    placeholder="e.g., $450"
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
                    placeholder="e.g., 3:00 PM"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Check-out</Label>
                  <Input
                    value={editedHotel.checkOut}
                    onChange={(e) => setEditedHotel({ ...editedHotel, checkOut: e.target.value })}
                    className="h-9"
                    placeholder="e.g., 11:00 AM"
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
                  placeholder="e.g., WiFi, Pool, Gym"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Why Recommended</Label>
                <Textarea
                  value={editedHotel.whyRecommended}
                  onChange={(e) => setEditedHotel({ ...editedHotel, whyRecommended: e.target.value })}
                  rows={2}
                  className="resize-none text-sm"
                  placeholder="e.g., Great location near attractions"
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
