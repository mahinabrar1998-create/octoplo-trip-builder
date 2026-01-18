import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FlightSuggestionRequest {
  type: "outbound" | "return";
  origin: string;
  destination: string;
  departureDate: string;
  currentFlight?: {
    airline: string;
    flightNumber: string;
    departure: string;
    arrival: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, origin, destination, departureDate, currentFlight } = await req.json() as FlightSuggestionRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating flight suggestions:", { type, origin, destination, departureDate });

    const systemPrompt = `You are a flight search assistant. Generate exactly 3 realistic flight suggestions with specific departure and arrival times.

Use real airline names that operate routes in the region. Generate realistic flight numbers (e.g., AA1234, UA567, DL890).
Times should be in 24-hour format (e.g., "08:30", "14:45").
Durations should be realistic for the distance (e.g., "2h 15m", "5h 30m").

Return a JSON object with this exact structure:
{
  "suggestions": [
    {
      "airline": "Airline Name",
      "flightNumber": "XX1234",
      "departureTime": "08:30",
      "arrivalTime": "11:45",
      "duration": "3h 15m",
      "estimatedCost": "$250-350",
      "class": "Economy",
      "reason": "One short sentence why this is a good option"
    }
  ]
}`;

    const flightDirection = type === "outbound" 
      ? `from ${origin} to ${destination}` 
      : `from ${destination} to ${origin}`;

    const userPrompt = `Generate 3 realistic flight options ${flightDirection} for ${departureDate}.

${currentFlight ? `Current flight to improve upon:
- Airline: ${currentFlight.airline}
- Flight: ${currentFlight.flightNumber}
- Departure: ${currentFlight.departure}
- Arrival: ${currentFlight.arrival}

Suggest alternatives with different airlines or better times/prices.` : "Suggest a variety of airlines and time options (early morning, midday, evening)."}

Consider:
- Major airlines that operate this route
- Realistic flight durations based on distance
- A mix of price points (budget, standard, premium)
- Different departure times throughout the day`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get flight suggestions");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse suggestions from AI response");
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    console.log("Generated flight suggestions:", suggestions);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in suggest-flights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
