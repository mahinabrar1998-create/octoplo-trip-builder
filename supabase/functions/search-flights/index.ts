import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FlightSearchRequest {
  origin: string; // Airport code (e.g., "JFK")
  destination: string; // Airport code (e.g., "LAX")
  departureDate: string; // YYYY-MM-DD
  adults?: number;
  maxResults?: number;
}

// Cache for access token
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAmadeusToken(): Promise<string> {
  // Check if we have a valid cached token
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
  
  // Cache token (expires_in is in seconds, subtract 60s buffer)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { origin, destination, departureDate, adults = 1, maxResults = 5 } = await req.json() as FlightSearchRequest;

    if (!origin || !destination || !departureDate) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: origin, destination, departureDate" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert ISO timestamp to YYYY-MM-DD format for Amadeus API
    const formattedDate = departureDate.split("T")[0];

    console.log("Searching flights:", { origin, destination, departureDate: formattedDate, adults });

    const token = await getAmadeusToken();

    // Search for flight offers
    const searchParams = new URLSearchParams({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: formattedDate,
      adults: adults.toString(),
      max: maxResults.toString(),
      currencyCode: "USD",
    });

    const flightResponse = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!flightResponse.ok) {
      const errorText = await flightResponse.text();
      console.error("Amadeus flight search error:", flightResponse.status, errorText);
      
      if (flightResponse.status === 400) {
        return new Response(
          JSON.stringify({ error: "Invalid search parameters. Check airport codes and dates." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Failed to search flights");
    }

    const flightData = await flightResponse.json();
    
    // Transform Amadeus response to our format
    const flights = flightData.data?.map((offer: any) => {
      const firstSegment = offer.itineraries[0]?.segments[0];
      const lastSegment = offer.itineraries[0]?.segments[offer.itineraries[0].segments.length - 1];
      
      // Get carrier name from dictionaries
      const carrierCode = firstSegment?.carrierCode;
      const carrierName = flightData.dictionaries?.carriers?.[carrierCode] || carrierCode;
      
      // Calculate total duration
      const duration = offer.itineraries[0]?.duration?.replace("PT", "").toLowerCase() || "";
      
      // Format times
      const departureTime = firstSegment?.departure?.at?.split("T")[1]?.substring(0, 5) || "";
      const arrivalTime = lastSegment?.arrival?.at?.split("T")[1]?.substring(0, 5) || "";
      
      // Number of stops
      const stops = offer.itineraries[0]?.segments?.length - 1 || 0;

      return {
        airline: carrierName,
        flightNumber: `${carrierCode}${firstSegment?.number || ""}`,
        departureTime,
        arrivalTime,
        duration: formatDuration(duration),
        stops,
        price: offer.price?.total || "N/A",
        currency: offer.price?.currency || "USD",
        cabinClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || "ECONOMY",
        departureAirport: firstSegment?.departure?.iataCode || origin,
        arrivalAirport: lastSegment?.arrival?.iataCode || destination,
      };
    }) || [];

    console.log(`Found ${flights.length} flights`);

    return new Response(
      JSON.stringify({ flights, source: "amadeus" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in search-flights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function formatDuration(duration: string): string {
  // Convert "5h30m" to "5h 30m"
  return duration.replace(/(\d+)h/, "$1h ").replace(/(\d+)m/, "$1m").trim();
}
