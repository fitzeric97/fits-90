import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SignupNotificationRequest {
  email: string;
  firstName: string;
  lastName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName }: SignupNotificationRequest = await req.json();

    console.log(`Sending signup notification for: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "MyFits.co <noreply@myfits.co>",
      to: ["Fitzeric97@gmail.com"],
      subject: "New MyFits.co Signup!",
      html: `
        <h1>New User Signup</h1>
        <p>A new user has signed up for MyFits.co:</p>
        <ul>
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Signup Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>Welcome to another MyFits user!</p>
      `,
    });

    console.log("Signup notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-signup-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);