import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HotelSearchRequest {
  cityCode: string; // IATA city code (e.g., "NYC", "PAR")
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adults?: number;
  maxResults?: number;
}

// Cache for access token
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAmadeusToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const apiKey = Deno.env.get("AMADEUS_API_KEY");
  const apiSecret = Deno.env.get("AMADEUS_API_SECRET");

  if (!apiKey || !apiSecret) {
    throw new Error("Amadeus API credentials not configured");
  }

  console.log("Fetching new Amadeus access token...");

  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Amadeus auth error:", error);
    throw new Error("Failed to authenticate with Amadeus");
  }

  const data = await response.json();
  
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

// Map destination names to IATA city codes
const cityToCityCode: Record<string, string> = {
  "new york": "NYC",
  "los angeles": "LAX",
  "chicago": "CHI",
  "houston": "HOU",
  "phoenix": "PHX",
  "san francisco": "SFO",
  "seattle": "SEA",
  "denver": "DEN",
  "boston": "BOS",
  "miami": "MIA",
  "atlanta": "ATL",
  "dallas": "DFW",
  "washington": "WAS",
  "las vegas": "LAS",
  "san diego": "SAN",
  "london": "LON",
  "paris": "PAR",
  "tokyo": "TYO",
  "rome": "ROM",
  "barcelona": "BCN",
  "amsterdam": "AMS",
  "berlin": "BER",
  "madrid": "MAD",
  "lisbon": "LIS",
  "dublin": "DUB",
  "sydney": "SYD",
  "melbourne": "MEL",
  "toronto": "YTO",
  "vancouver": "YVR",
  "montreal": "YMQ",
  "dubai": "DXB",
  "singapore": "SIN",
  "hong kong": "HKG",
  "bangkok": "BKK",
  "bali": "DPS",
  "osaka": "OSA",
  "seoul": "SEL",
  "beijing": "BJS",
  "shanghai": "SHA",
  "mumbai": "BOM",
  "delhi": "DEL",
  "cairo": "CAI",
  "cape town": "CPT",
  "johannesburg": "JNB",
  "mexico city": "MEX",
  "cancun": "CUN",
  "sao paulo": "SAO",
  "rio de janeiro": "RIO",
  "buenos aires": "BUE",
  "lima": "LIM",
  "hawaii": "HNL",
  "honolulu": "HNL",
};

function getCityCode(destination: string): string {
  const normalized = destination.toLowerCase().trim();
  for (const [key, code] of Object.entries(cityToCityCode)) {
    if (normalized.includes(key)) {
      return code;
    }
  }
  // If it looks like a city code already (3 letters), return as-is
  if (/^[A-Z]{3}$/i.test(destination.trim())) {
    return destination.trim().toUpperCase();
  }
  // Fallback: return first 3 letters
  return destination.substring(0, 3).toUpperCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      cityCode: inputCityCode, 
      destination,
      checkInDate, 
      checkOutDate, 
      adults = 1, 
      maxResults = 3 
    } = body as HotelSearchRequest & { destination?: string };

    // Allow either cityCode or destination
    const cityCode = inputCityCode || (destination ? getCityCode(destination) : null);

    if (!cityCode || !checkInDate || !checkOutDate) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: cityCode/destination, checkInDate, checkOutDate" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Searching hotels:", { cityCode, checkInDate, checkOutDate, adults });

    const token = await getAmadeusToken();

    // Step 1: Get hotels by city
    const hotelListParams = new URLSearchParams({
      cityCode: cityCode.toUpperCase(),
    });

    const hotelListResponse = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?${hotelListParams}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!hotelListResponse.ok) {
      const errorText = await hotelListResponse.text();
      console.error("Hotel list error:", hotelListResponse.status, errorText);
      
      if (hotelListResponse.status === 400) {
        return new Response(
          JSON.stringify({ error: `Invalid city code: ${cityCode}. Try a major city name.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Failed to get hotel list");
    }

    const hotelListData = await hotelListResponse.json();
    const hotelIds = hotelListData.data?.slice(0, 10).map((h: any) => h.hotelId) || [];

    if (hotelIds.length === 0) {
      return new Response(
        JSON.stringify({ hotels: [], message: "No hotels found in this city" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${hotelIds.length} hotels, fetching offers...`);

    // Step 2: Get hotel offers (pricing)
    const offerParams = new URLSearchParams({
      hotelIds: hotelIds.join(","),
      checkInDate,
      checkOutDate,
      adults: adults.toString(),
      roomQuantity: "1",
      currency: "USD",
      bestRateOnly: "true",
    });

    const offersResponse = await fetch(
      `https://test.api.amadeus.com/v3/shopping/hotel-offers?${offerParams}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!offersResponse.ok) {
      const errorText = await offersResponse.text();
      console.error("Hotel offers error:", offersResponse.status, errorText);
      
      // If offers fail, return basic hotel info without pricing
      const basicHotels = hotelListData.data?.slice(0, maxResults).map((h: any) => ({
        name: h.name,
        hotelId: h.hotelId,
        address: h.address?.lines?.join(", ") || "",
        cityName: h.address?.cityName || cityCode,
        distance: h.distance?.value ? `${h.distance.value} ${h.distance.unit}` : null,
        rating: null,
        pricePerNight: "Check availability",
        totalPrice: "Check availability",
        currency: "USD",
        amenities: [],
        source: "amadeus-basic",
      })) || [];

      return new Response(
        JSON.stringify({ hotels: basicHotels, source: "amadeus-basic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const offersData = await offersResponse.json();

    // Transform hotel offers to our format
    const hotels = offersData.data?.slice(0, maxResults).map((offer: any) => {
      const hotel = offer.hotel;
      const bestOffer = offer.offers?.[0];
      const price = bestOffer?.price;
      
      // Calculate number of nights
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      const totalPrice = parseFloat(price?.total || "0");
      const pricePerNight = nights > 0 ? (totalPrice / nights).toFixed(2) : price?.total;

      // Format room type - remove codes like "A01", "ROH", etc.
      const rawRoomType = bestOffer?.room?.typeEstimated?.category || bestOffer?.room?.type || "";
      const bedType = bestOffer?.room?.typeEstimated?.bedType || "";
      
      // Clean up room type - map common codes to readable names
      const roomTypeMap: Record<string, string> = {
        "STANDARD_ROOM": "Standard Room",
        "SUPERIOR_ROOM": "Superior Room",
        "DELUXE_ROOM": "Deluxe Room",
        "SUITE": "Suite",
        "JUNIOR_SUITE": "Junior Suite",
        "EXECUTIVE_ROOM": "Executive Room",
        "FAMILY_ROOM": "Family Room",
      };
      
      let roomType = roomTypeMap[rawRoomType] || "";
      // If still a code (like "A01"), just use bed type or generic description
      if (!roomType || /^[A-Z0-9]{2,4}$/.test(rawRoomType)) {
        roomType = "";
      }
      
      // Format bed type
      const bedTypeMap: Record<string, string> = {
        "SINGLE": "Single Bed",
        "DOUBLE": "Double Bed",
        "TWIN": "Twin Beds",
        "QUEEN": "Queen Bed",
        "KING": "King Bed",
      };
      const formattedBedType = bedTypeMap[bedType] || (bedType ? bedType.charAt(0) + bedType.slice(1).toLowerCase() + " Bed" : "");
      
      // Combine room description
      const roomDescription = [roomType, formattedBedType].filter(Boolean).join(" • ") || null;

      // Clean hotel name - remove airport codes like "LAX", "NYC", etc.
      let cleanName = hotel.name || "";
      // Remove common patterns like "- LAX" or "(LAX)" or "LAX -" from hotel names
      cleanName = cleanName.replace(/\s*[-–]\s*[A-Z]{3}\s*/g, " ")
                           .replace(/\s*\([A-Z]{3}\)\s*/g, " ")
                           .replace(/\s*[A-Z]{3}\s*[-–]\s*/g, " ")
                           .replace(/\s+/g, " ")
                           .trim();

      return {
        name: cleanName,
        hotelId: hotel.hotelId,
        address: hotel.address?.lines?.join(", ") || "",
        cityName: hotel.cityCode || cityCode,
        rating: hotel.rating ? parseInt(hotel.rating) : null,
        pricePerNight: `$${pricePerNight}`,
        totalPrice: `$${price?.total || "N/A"}`,
        currency: price?.currency || "USD",
        roomType: roomDescription,
        amenities: hotel.amenities?.length > 0 ? hotel.amenities : [],
        checkInTime: bestOffer?.checkInDate || checkInDate,
        checkOutTime: bestOffer?.checkOutDate || checkOutDate,
        cancellationPolicy: bestOffer?.policies?.cancellation?.description?.text || "Check hotel policy",
        source: "amadeus",
      };
    }) || [];

    console.log(`Returning ${hotels.length} hotels with pricing`);

    return new Response(
      JSON.stringify({ hotels, source: "amadeus" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in search-hotels:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
