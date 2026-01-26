import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  guestName: string;
  guestEmail: string;
  tripName: string;
  inviteUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { guestName, guestEmail, tripName, inviteUrl }: InviteEmailRequest = await req.json();

    if (!guestName || !guestEmail || !tripName || !inviteUrl) {
      throw new Error("Missing required fields");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Octoplo <onboarding@resend.dev>",
        to: [guestEmail],
        subject: `You're invited to "${tripName}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; margin-bottom: 20px;">Hey ${guestName}! 🎉</h1>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              You've been invited to share your availability for <strong>"${tripName}"</strong>.
            </p>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Click the button below to let them know which activities work for you:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background-color: #6366f1; color: white; padding: 14px 28px; 
                        text-decoration: none; border-radius: 8px; font-weight: 600;
                        display: inline-block;">
                View Trip & Respond
              </a>
            </div>
            <p style="font-size: 14px; color: #888; margin-top: 30px;">
              Or copy this link: <a href="${inviteUrl}" style="color: #6366f1;">${inviteUrl}</a>
            </p>
          </div>
        `,
      }),
    });

    const result = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Invite email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-invite-email function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
