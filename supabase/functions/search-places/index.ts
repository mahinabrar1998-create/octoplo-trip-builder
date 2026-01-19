import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaceSearchRequest {
  destination: string;
  categories?: string[]; // e.g., ["restaurant", "attraction", "cafe"]
  limit?: number;
}

// Foursquare category IDs
const categoryMap: Record<string, string> = {
  restaurant: "13065", // Restaurants
  cafe: "13032", // Cafes
  bar: "13003", // Bars
  attraction: "16000", // Landmarks & Outdoors
  museum: "10027", // Museums
  park: "16032", // Parks
  shopping: "17000", // Shopping
  nightlife: "10032", // Nightlife
  breakfast: "13028", // Breakfast spots
  lunch: "13065", // Restaurants (for lunch)
  dinner: "13065", // Restaurants (for dinner)
  activity: "16000", // Landmarks & Outdoors
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, categories = ["restaurant", "attraction", "cafe"], limit = 20 } = await req.json() as PlaceSearchRequest;

    const FOURSQUARE_API_KEY = Deno.env.get("FOURSQUARE_API_KEY");
    if (!FOURSQUARE_API_KEY) {
      throw new Error("Foursquare API key not configured");
    }

    console.log("Searching Foursquare for:", destination, "categories:", categories);

    // Build category string
    const categoryIds = categories
      .map(cat => categoryMap[cat.toLowerCase()])
      .filter(Boolean)
      .join(",");

    // Search for places near the destination
    const searchParams = new URLSearchParams({
      near: destination,
      categories: categoryIds || "13065,16000", // Default: restaurants + attractions
      limit: Math.min(limit, 50).toString(),
      sort: "RELEVANCE",
      fields: "fsq_id,name,location,categories,rating,price,hours,photos,description,tel,website,stats",
    });

    const response = await fetch(
      `https://api.foursquare.com/v3/places/search?${searchParams}`,
      {
        headers: {
          Authorization: FOURSQUARE_API_KEY,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Foursquare API error:", response.status, errorText);
      throw new Error(`Foursquare API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.results?.length || 0} places from Foursquare`);

    // Transform to our format
    const places = data.results?.map((place: any) => {
      // Get primary category
      const primaryCategory = place.categories?.[0]?.name || "Venue";
      
      // Format address
      const address = place.location?.formatted_address || 
        [place.location?.address, place.location?.locality, place.location?.country]
          .filter(Boolean)
          .join(", ");

      // Get photo URL if available
      const photo = place.photos?.[0];
      const photoUrl = photo ? `${photo.prefix}300x300${photo.suffix}` : null;

      // Map Foursquare price to readable format
      const priceMap: Record<number, string> = {
        1: "$",
        2: "$$",
        3: "$$$",
        4: "$$$$",
      };
      const priceLevel = priceMap[place.price] || "$$";

      // Estimate cost based on price level and category
      let estimatedCost = "Free";
      if (primaryCategory.toLowerCase().includes("restaurant") || 
          primaryCategory.toLowerCase().includes("cafe") ||
          primaryCategory.toLowerCase().includes("bar")) {
        const costRanges: Record<string, string> = {
          "$": "$10-20",
          "$$": "$20-40",
          "$$$": "$40-80",
          "$$$$": "$80+",
        };
        estimatedCost = costRanges[priceLevel] || "$20-40";
      } else if (primaryCategory.toLowerCase().includes("museum")) {
        estimatedCost = "$15-30";
      } else if (primaryCategory.toLowerCase().includes("park")) {
        estimatedCost = "Free";
      }

      // Determine meal/activity type from category
      let activityType = "activity";
      const catLower = primaryCategory.toLowerCase();
      if (catLower.includes("restaurant") || catLower.includes("food")) {
        activityType = "food";
      } else if (catLower.includes("cafe") || catLower.includes("coffee")) {
        activityType = "food";
      } else if (catLower.includes("bar") || catLower.includes("nightlife")) {
        activityType = "food";
      }

      return {
        id: place.fsq_id,
        name: place.name,
        category: primaryCategory,
        activityType,
        address,
        neighborhood: place.location?.locality || place.location?.neighborhood || "",
        rating: place.rating ? (place.rating / 2).toFixed(1) : null, // Foursquare uses 0-10, convert to 0-5
        priceLevel,
        estimatedCost,
        description: place.description || `Popular ${primaryCategory.toLowerCase()} in ${destination}`,
        photoUrl,
        hours: place.hours?.display || null,
        website: place.website || null,
        phone: place.tel || null,
        totalRatings: place.stats?.total_ratings || null,
      };
    }) || [];

    // Group places by type for easier itinerary building
    const groupedPlaces = {
      restaurants: places.filter((p: any) => 
        p.category.toLowerCase().includes("restaurant") || 
        p.category.toLowerCase().includes("food")
      ),
      cafes: places.filter((p: any) => 
        p.category.toLowerCase().includes("cafe") || 
        p.category.toLowerCase().includes("coffee")
      ),
      attractions: places.filter((p: any) => 
        !p.category.toLowerCase().includes("restaurant") && 
        !p.category.toLowerCase().includes("cafe") &&
        !p.category.toLowerCase().includes("bar")
      ),
      nightlife: places.filter((p: any) => 
        p.category.toLowerCase().includes("bar") || 
        p.category.toLowerCase().includes("nightlife")
      ),
    };

    return new Response(
      JSON.stringify({ 
        places, 
        grouped: groupedPlaces,
        total: places.length,
        destination 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in search-places:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
