import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const systemPrompt = `You are an expert travel planner creating HIGHLY DETAILED trip itineraries. You must consider real-world factors like weather patterns, traffic conditions, transportation availability, and optimal timing.

Your response must be valid JSON with this exact structure:
{
  "plan": {
    "name": "string (creative name for this plan)",
    "theme": "string (e.g., 'Cultural Immersion' or 'Adventure & Nature')",
    "summary": "string (2-3 sentence overview)",
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
    "estimatedTotalCost": "string",
    "highlights": ["string", "string", "string"],
    "packingTips": ["string", "string", "string"]
  }
}

CRITICAL Guidelines for DETAILED planning:
- Create ONE comprehensive, highly detailed plan
- EVERY day MUST have 6-8 time blocks covering the ENTIRE day from morning (7-8 AM) to night (9-10 PM)
- Time blocks should include: breakfast, morning activity, lunch, afternoon activity, dinner, evening activity/leisure
- Consider realistic travel times between locations - account for traffic during rush hours
- Include specific transport recommendations (walk 10 min, Uber ~$15, take Metro Line 2, etc.)
- Base weather forecasts on typical seasonal patterns for the destination and dates
- Adjust activities based on weather (indoor alternatives for rainy days, early starts for hot days)
- Account for local opening hours, busy periods, and reservation requirements
- Include specific restaurant names, attraction names, and neighborhoods
- Factor in rest time and buffer between activities
- Match the budget level and group size preferences
- Make it realistic and actionable with specific venues and addresses`;

    const userPrompt = `Create a HIGHLY DETAILED ${days}-day trip plan for ${destination}.

Trip Details:
- Dates: ${startDate} to ${endDate} (${days} days)
- Budget Style: ${budget}
- Group: ${groupSize}
- Preferred Vibes: ${vibe.join(', ')}
${specialInstructions ? `- Special Instructions: ${specialInstructions}` : ''}

IMPORTANT Requirements:
1. Each day MUST have 6-8 detailed time blocks from morning to night - NO GAPS in the schedule
2. Include realistic weather forecasts based on seasonal patterns for ${destination}
3. Consider traffic patterns (avoid scheduling across town during rush hour)
4. Include specific transport instructions between each activity
5. Account for opening hours and peak tourist times
6. Name specific restaurants, attractions, and venues - not generic descriptions
7. Include buffer time and realistic durations for each activity

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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
