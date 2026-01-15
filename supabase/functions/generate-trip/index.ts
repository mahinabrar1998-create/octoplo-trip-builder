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

    const systemPrompt = `You are an expert travel planner. Create detailed, realistic trip itineraries with specific time blocks.

Your response must be valid JSON with this exact structure:
{
  "plan1": {
    "name": "string (creative name for this plan)",
    "theme": "string (e.g., 'Cultural Immersion' or 'Adventure & Nature')",
    "summary": "string (2-3 sentence overview)",
    "days": [
      {
        "dayNumber": 1,
        "date": "YYYY-MM-DD",
        "blocks": [
          {
            "time": "HH:MM",
            "endTime": "HH:MM",
            "title": "string",
            "description": "string (1-2 sentences)",
            "location": "string",
            "estimatedCost": "string (e.g., '$20-30' or 'Free')",
            "category": "food" | "activity" | "transport" | "accommodation" | "free-time"
          }
        ]
      }
    ],
    "estimatedTotalCost": "string",
    "highlights": ["string", "string", "string"]
  },
  "plan2": { ... same structure ... }
}

Guidelines:
- Create TWO distinct plans with different themes/approaches
- Plan 1 should be more structured and popular spots
- Plan 2 should be more off-the-beaten-path or relaxed
- Include 4-6 time blocks per day (morning, lunch, afternoon, evening, dinner, night)
- Be specific with locations and times
- Match the budget level and group size preferences
- Incorporate the requested vibes/themes
- Make it realistic and actionable`;

    const userPrompt = `Create two ${days}-day trip plans for ${destination}.

Trip Details:
- Dates: ${startDate} to ${endDate} (${days} days)
- Budget Style: ${budget}
- Group: ${groupSize}
- Preferred Vibes: ${vibe.join(', ')}
${specialInstructions ? `- Special Instructions: ${specialInstructions}` : ''}

Generate two complete, detailed itineraries with time blocks for each day.`;

    console.log("Calling Lovable AI Gateway...");

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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
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

    const data = await response.json();
    console.log("AI response received");
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
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

    console.log("Trip plans generated successfully");

    return new Response(JSON.stringify({ plans }), {
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
