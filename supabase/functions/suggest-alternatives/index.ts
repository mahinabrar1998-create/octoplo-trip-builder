import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TimeBlock {
  time: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  estimatedCost: string;
  category: "food" | "activity" | "transport" | "accommodation" | "free-time";
}

interface SuggestionRequest {
  block?: TimeBlock;
  destination: string;
  tripDates: { start: string; end: string };
  context?: string;
  type?: "packing" | "activity";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { block, destination, tripDates, context, type } = await req.json() as SuggestionRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Handle packing tips request
    if (type === "packing") {
      console.log("Generating packing tips for:", destination);

      const packingSystemPrompt = `You are a travel packing expert. Generate exactly 3 essential packing tips for a trip.

Each tip should be 3-5 words only (e.g., "Comfortable walking shoes", "Light layers for evenings", "Portable phone charger").

Return a JSON object with this exact structure:
{
  "suggestions": [
    { "title": "3-5 word packing tip" },
    { "title": "3-5 word packing tip" },
    { "title": "3-5 word packing tip" }
  ]
}`;

      const packingUserPrompt = `Generate 3 essential packing tips for a trip to ${destination} from ${tripDates.start} to ${tripDates.end}. Consider the weather, activities, and culture of the destination. Each tip should be exactly 3-5 words.`;

      const packingResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: packingSystemPrompt },
            { role: "user", content: packingUserPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!packingResponse.ok) {
        if (packingResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (packingResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error("Failed to get AI suggestions");
      }

      const packingData = await packingResponse.json();
      const packingContent = packingData.choices?.[0]?.message?.content;

      if (!packingContent) {
        throw new Error("No content in AI response");
      }

      const packingJsonMatch = packingContent.match(/\{[\s\S]*\}/);
      if (!packingJsonMatch) {
        throw new Error("Could not parse suggestions from AI response");
      }

      const packingSuggestions = JSON.parse(packingJsonMatch[0]);
      console.log("Generated packing tips:", packingSuggestions);

      return new Response(JSON.stringify(packingSuggestions), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle activity alternatives request
    if (!block) {
      throw new Error("Block is required for activity suggestions");
    }

    console.log("Generating alternatives for:", block.title, "in", destination);

    const systemPrompt = `You are a travel expert. Generate exactly 3 alternative suggestions for a travel activity. Each suggestion should be different but suitable for the same time slot, location area, and traveler preferences.

Be concise - each explanation should be ONE short sentence (max 15 words).

Return a JSON object with this exact structure:
{
  "suggestions": [
    {
      "title": "Alternative name",
      "description": "Brief 1-sentence description",
      "location": "Specific location",
      "estimatedCost": "$XX",
      "reason": "One sentence why this works"
    }
  ]
}`;

    const userPrompt = `Current activity to replace:
- Title: ${block.title}
- Category: ${block.category}
- Location: ${block.location}
- Time: ${block.time} - ${block.endTime}
- Current cost: ${block.estimatedCost}
- Description: ${block.description}

Trip details:
- Destination: ${destination}
- Dates: ${tripDates.start} to ${tripDates.end}
${context ? `- Context: ${context}` : ""}

Generate 3 alternative ${block.category} options in ${destination} for this time slot. Keep similar budget range unless you have a compelling better-value option.`;

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
      throw new Error("Failed to get AI suggestions");
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
    console.log("Generated suggestions:", suggestions);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in suggest-alternatives:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
