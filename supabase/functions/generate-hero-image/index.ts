import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 10; // 10 images per hour per IP

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
        error: `Rate limit exceeded. Try again in ${resetInMinutes} minutes.` 
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

    const { destination, theme } = await req.json();
    
    console.log("Generating hero image for:", destination);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Simple, clear prompt for image generation
    const imagePrompt = `Generate a beautiful travel photograph of ${destination}. Show iconic landmarks or scenic views. Golden hour lighting, professional travel photography, vibrant colors, 16:9 landscape orientation. No text, no watermarks.`;

    console.log("Calling Lovable AI for image generation with prompt:", imagePrompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          { role: "user", content: imagePrompt }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response structure:", JSON.stringify({
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasMessage: !!data.choices?.[0]?.message,
      hasImages: !!data.choices?.[0]?.message?.images,
      imagesLength: data.choices?.[0]?.message?.images?.length
    }));
    
    // Extract the image from the response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response. Full response:", JSON.stringify(data));
      // Return a fallback image URL instead of throwing an error
      const fallbackUrl = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop";
      console.log("Using fallback image:", fallbackUrl);
      return new Response(JSON.stringify({ imageUrl: fallbackUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Image generated successfully, base64 length:", imageUrl.length);

    // Upload the base64 image to Supabase storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("Storage not configured, returning base64 directly");
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to blob
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Validate file size (max 5MB)
    if (imageBytes.length > 5 * 1024 * 1024) {
      console.error("Generated image too large:", imageBytes.length);
      const fallbackUrl = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop";
      return new Response(JSON.stringify({ imageUrl: fallbackUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const fileName = `hero-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("trip-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Return base64 if upload fails
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from("trip-images")
      .getPublicUrl(fileName);

    console.log("Image uploaded successfully:", publicUrlData.publicUrl);

    return new Response(JSON.stringify({ imageUrl: publicUrlData.publicUrl }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      },
    });

  } catch (error) {
    console.error("Error generating hero image:", error);
    // Return fallback on any error
    const fallbackUrl = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop";
    return new Response(JSON.stringify({ imageUrl: fallbackUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
