import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5; // 5 trips per hour per IP

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count, resetIn: record.resetTime - now };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    
    console.log(`Rate limit check for IP ${clientIP}: allowed=${rateLimit.allowed}, remaining=${rateLimit.remaining}`);
    
    if (!rateLimit.allowed) {
      const resetInMinutes = Math.ceil(rateLimit.resetIn / 60000);
      return new Response(JSON.stringify({ 
        error: `Rate limit exceeded. You can generate ${MAX_REQUESTS_PER_WINDOW} trips per hour. Try again in ${resetInMinutes} minutes.` 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000))
        },
      });
    }

    const { destination, startDate, endDate, budget, groupSize, vibe, specialInstructions } = await req.json();
    
    console.log("Generating trip for:", { destination, startDate, endDate, budget, groupSize, vibe });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate trip duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // ============ OPEN-METEO WEATHER: Fetch real forecasts ============
    let realWeather: any[] = [];
    
    try {
      console.log("Geocoding destination for weather...");
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en`
      );
      const geoData = await geoRes.json();
      
      if (geoData.results && geoData.results.length > 0) {
        const { latitude, longitude } = geoData.results[0];
        console.log(`Geocoded ${destination} to ${latitude}, ${longitude}`);
        
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&start_date=${startDate}&end_date=${endDate}&temperature_unit=fahrenheit&timezone=auto`
        );
        const weatherData = await weatherRes.json();
        
        if (weatherData.daily) {
          const weatherCodeMap: Record<number, string> = {
            0: "sunny", 1: "sunny", 2: "partly-cloudy", 3: "cloudy",
            45: "cloudy", 48: "cloudy",
            51: "rainy", 53: "rainy", 55: "rainy",
            61: "rainy", 63: "rainy", 65: "rainy",
            71: "snowy", 73: "snowy", 75: "snowy", 77: "snowy",
            80: "rainy", 81: "rainy", 82: "stormy",
            85: "snowy", 86: "snowy",
            95: "stormy", 96: "stormy", 99: "stormy",
          };
          
          realWeather = weatherData.daily.time.map((date: string, i: number) => ({
            date,
            highTemp: Math.round(weatherData.daily.temperature_2m_max[i]),
            lowTemp: Math.round(weatherData.daily.temperature_2m_min[i]),
            condition: weatherCodeMap[weatherData.daily.weathercode[i]] || "partly-cloudy",
            code: weatherData.daily.weathercode[i],
          }));
          
          console.log(`Fetched real weather for ${realWeather.length} days`);
        }
      } else {
        console.warn("Could not geocode destination, AI will estimate weather");
      }
    } catch (weatherError) {
      console.warn("Error fetching weather, AI will estimate:", weatherError);
    }

    // ============ FOURSQUARE INTEGRATION: Fetch real places ============
    let realPlaces: any = null;
    const FOURSQUARE_API_KEY = Deno.env.get("FOURSQUARE_API_KEY");
    
    if (FOURSQUARE_API_KEY) {
      console.log("Fetching real places from Foursquare...");
      
      try {
        const restaurantParams = new URLSearchParams({
          near: destination,
          categories: "13065,13032,13028",
          limit: "25",
          sort: "RELEVANCE",
          fields: "fsq_id,name,location,categories,rating,price,description",
        });
        
        const attractionParams = new URLSearchParams({
          near: destination,
          categories: "16000,10027,16032",
          limit: "25",
          sort: "RELEVANCE",
          fields: "fsq_id,name,location,categories,rating,description",
        });

        const [restaurantResponse, attractionResponse] = await Promise.all([
          fetch(`https://api.foursquare.com/v3/places/search?${restaurantParams}`, {
            headers: { Authorization: FOURSQUARE_API_KEY, Accept: "application/json" },
          }),
          fetch(`https://api.foursquare.com/v3/places/search?${attractionParams}`, {
            headers: { Authorization: FOURSQUARE_API_KEY, Accept: "application/json" },
          }),
        ]);

        if (restaurantResponse.ok && attractionResponse.ok) {
          const restaurants = await restaurantResponse.json();
          const attractions = await attractionResponse.json();
          
          const formatPlace = (place: any) => {
            const address = place.location?.formatted_address || 
              [place.location?.address, place.location?.locality].filter(Boolean).join(", ");
            const category = place.categories?.[0]?.name || "Venue";
            const priceMap: Record<number, string> = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };
            const price = priceMap[place.price] || "$$";
            
            return {
              name: place.name, address, category,
              rating: place.rating ? (place.rating / 2).toFixed(1) : null,
              price,
              neighborhood: place.location?.locality || place.location?.neighborhood || "",
            };
          };

          realPlaces = {
            restaurants: restaurants.results?.map(formatPlace) || [],
            attractions: attractions.results?.map(formatPlace) || [],
          };
          
          console.log(`Fetched ${realPlaces.restaurants.length} restaurants and ${realPlaces.attractions.length} attractions`);
        }
      } catch (fsqError) {
        console.warn("Error fetching from Foursquare:", fsqError);
      }
    } else {
      console.log("Foursquare API key not configured, using AI-generated places");
    }

    const systemPrompt = `You are an expert travel planner creating HIGHLY DETAILED trip itineraries. You must consider real-world factors like weather patterns, traffic conditions, transportation availability, and optimal timing.

Your response must be valid JSON with this exact structure:
{
  "plan": {
    "name": "string (creative name for this plan)",
    "theme": "string (e.g., 'Cultural Immersion' or 'Adventure & Nature')",
    "summary": "string (ONE short sentence, max 15 words)",
    "flights": {
      "outbound": {
        "airline": "string (e.g., 'United Airlines')",
        "flightNumber": "string (e.g., 'UA 1234')",
        "departure": "string (airport code and time, e.g., 'SFO 8:00 AM')",
        "arrival": "string (airport code and time, e.g., 'JFK 4:30 PM')",
        "duration": "string (e.g., '5h 30m')",
        "estimatedCost": "string (e.g., '$350-500 per person')",
        "class": "string (e.g., 'Economy', 'Business')",
        "note": "string (booking tips or recommendations)"
      },
      "return": {
        "airline": "string",
        "flightNumber": "string",
        "departure": "string",
        "arrival": "string",
        "duration": "string",
        "estimatedCost": "string",
        "class": "string",
        "note": "string"
      }
    },
    "hotel": {
      "name": "string (specific hotel name)",
      "address": "string (full address)",
      "neighborhood": "string (area/district description)",
      "starRating": number (1-5),
      "estimatedCostPerNight": "string (e.g., '$150-200')",
      "totalEstimatedCost": "string (for entire stay)",
      "amenities": ["string", "string", "string"],
      "whyRecommended": "string (2-3 sentences explaining why this hotel fits the trip)",
      "checkIn": "string (time, e.g., '3:00 PM')",
      "checkOut": "string (time, e.g., '11:00 AM')",
      "bookingTip": "string (tips for getting best rates)"
    },
    "days": [
      {
        "dayNumber": 1,
        "date": "YYYY-MM-DD",
        "weather": {
          "condition": "sunny" | "partly-cloudy" | "cloudy" | "rainy" | "stormy" | "snowy" | "windy",
          "highTemp": number (in Fahrenheit),
          "lowTemp": number (in Fahrenheit),
          "note": "string (brief weather advisory or tip)"
        },
        "blocks": [
          {
            "time": "HH:MM",
            "endTime": "HH:MM",
            "title": "string",
            "description": "string (2-3 sentences with specific details)",
            "location": "string (specific address or landmark)",
            "estimatedCost": "string (e.g., '$20-30' or 'Free')",
            "category": "food" | "activity" | "transport" | "accommodation" | "free-time",
            "transportNote": "string (how to get there, traffic considerations)",
            "weatherConsideration": "string (optional - how weather affects this activity)"
          }
        ]
      }
    ],
    "estimatedTotalCost": "string (including flights and hotel)",
    "highlights": ["string", "string", "string"],
    "packingTips": ["string", "string", "string"]
  }
}

CRITICAL Guidelines for DETAILED planning:
- Create ONE comprehensive, highly detailed plan
- ALWAYS include realistic flight recommendations based on the departure location (assume major nearby airport if not specified)
- ALWAYS include a specific hotel recommendation that matches the budget and vibe
- **DAY 1 MUST START AFTER FLIGHT ARRIVAL**: If the outbound flight arrives at 3:30 PM local time, Day 1 activities should begin around 4:30-5:00 PM (after customs, baggage, and transit to hotel). NEVER schedule Day 1 activities before the flight lands!
- **LAST DAY MUST END BEFORE FLIGHT DEPARTURE**: If the return flight departs at 2:00 PM, the last day should only have morning activities ending by 11:00 AM to allow airport transit and check-in.
- Days in the MIDDLE of the trip (not arrival or departure day) should have 6-8 time blocks covering the full day from morning (7-8 AM) to night (9-10 PM)
- Time blocks should include: breakfast, morning activity, lunch, afternoon activity, dinner, evening activity/leisure (adjusted for arrival/departure days)
- Consider realistic travel times between locations - account for traffic during rush hours
- Include specific transport recommendations (walk 10 min, Uber ~$15, take Metro Line 2, etc.)
- Base weather forecasts on typical seasonal patterns for the destination and dates
- Adjust activities based on weather (indoor alternatives for rainy days, early starts for hot days)
- Account for local opening hours, busy periods, and reservation requirements
- Include specific restaurant names, attraction names, and neighborhoods
- Factor in rest time and buffer between activities
- Match the budget level and group size preferences
- Make it realistic and actionable with specific venues and addresses
- The estimatedTotalCost should include flights, hotel, and all activities
- All costs MUST be in US dollars ($)
- **SUMMARY MUST BE 15-20 WORDS MAX** - Keep it punchy and brief, like a tagline
- **PACKING TIPS**: Include exactly 3 short packing tips (3-5 words each)`;


    // Build the real places context for the AI
    let realPlacesContext = "";
    if (realPlaces && (realPlaces.restaurants.length > 0 || realPlaces.attractions.length > 0)) {
      realPlacesContext = `

## VERIFIED REAL PLACES (from Foursquare - USE THESE EXCLUSIVELY)

### Restaurants & Cafes (verified):
${realPlaces.restaurants.slice(0, 15).map((r: any, i: number) => 
  `${i + 1}. **${r.name}** - ${r.category} | ${r.address} | Price: ${r.price}${r.rating ? ` | Rating: ${r.rating}/5` : ""}`
).join("\n")}

### Attractions & Activities (verified):
${realPlaces.attractions.slice(0, 15).map((a: any, i: number) => 
  `${i + 1}. **${a.name}** - ${a.category} | ${a.address}${a.rating ? ` | Rating: ${a.rating}/5` : ""}`
).join("\n")}

**CRITICAL**: You MUST ONLY use restaurants and attractions from the lists above. Do NOT invent or hallucinate venue names. Every restaurant, cafe, and attraction in your itinerary MUST be from these verified lists.
`;
    }

    const userPrompt = `Create a HIGHLY DETAILED ${days}-day trip plan for ${destination}.

Trip Details:
- Dates: ${startDate} to ${endDate} (${days} days)
- Budget Style: ${budget}
- Group: ${groupSize}
- Preferred Vibes: ${vibe.join(', ')}
${specialInstructions ? `- Special Instructions: ${specialInstructions}` : ''}
${realPlacesContext}

IMPORTANT Requirements:
1. **FLIGHT TIMING IS CRITICAL**: 
   - Day 1 activities MUST start AFTER the outbound flight lands (add 1-2 hours for customs/transit)
   - Last day activities MUST end BEFORE the return flight departure (allow 3 hours for airport)
2. Middle days (not arrival/departure) should have 6-8 detailed time blocks from morning to night
3. Include realistic weather forecasts based on seasonal patterns for ${destination}
4. Consider traffic patterns (avoid scheduling across town during rush hour)
5. Include specific transport instructions between each activity
6. Account for opening hours and peak tourist times
${realPlaces ? "7. **USE ONLY THE VERIFIED PLACES PROVIDED ABOVE** - do not make up restaurant or attraction names" : "7. Name specific restaurants, attractions, and venues - not generic descriptions"}
8. Include buffer time and realistic durations for each activity
9. All costs must be in US dollars ($)

Generate a complete, detailed itinerary that someone could follow exactly.`;

    console.log("Calling Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Get raw text first to handle empty responses
    const rawText = await response.text();
    console.log("Raw response length:", rawText.length);
    
    if (!rawText || rawText.trim().length === 0) {
      console.error("Empty response from AI gateway");
      throw new Error("Empty response from AI. Please try again.");
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (jsonError) {
      console.error("Failed to parse AI gateway response:", rawText.substring(0, 500));
      throw new Error("Invalid response from AI gateway. Please try again.");
    }

    console.log("AI response received");
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in response. Full response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No content in AI response. Please try again.");
    }

    // Parse the JSON from the response (handle markdown code blocks)
    let plans;
    try {
      // Remove markdown code blocks if present
      let jsonStr = content;
      if (content.includes("```json")) {
        jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (content.includes("```")) {
        jsonStr = content.replace(/```\n?/g, "");
      }
      plans = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse trip plans from AI");
    }

    console.log("Trip plan generated successfully");

    return new Response(JSON.stringify({ plan: plans.plan }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      },
    });

  } catch (error) {
    console.error("Error in generate-trip function:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate trip";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
