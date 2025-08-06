import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IncomingEmail {
  subject: string;
  from: string;
  to: string;
  text: string;
  html?: string;
  headers?: Record<string, string>;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received email webhook request');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse the incoming email data
    const emailData: IncomingEmail = await req.json();
    console.log('Email data:', { 
      to: emailData.to, 
      from: emailData.from, 
      subject: emailData.subject?.substring(0, 100) 
    });

    // Extract the user's myfits email from the 'to' field
    const myfitsEmail = emailData.to;
    if (!myfitsEmail.includes('@myfits.co')) {
      console.error('Email not sent to @myfits.co address:', myfitsEmail);
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Find the user by their myfits email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('myfits_email', myfitsEmail)
      .single();

    if (profileError || !profile) {
      console.error('User not found for myfits email:', myfitsEmail, profileError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Found user:', profile.id);

    // Call the process-myfits-email function to handle the email
    const { data: processResult, error: processError } = await supabase.functions.invoke(
      'process-myfits-email', 
      {
        body: {
          subject: emailData.subject,
          from: emailData.from,
          to: emailData.to,
          text: emailData.text,
          html: emailData.html,
          headers: emailData.headers
        }
      }
    );

    if (processError) {
      console.error('Error processing email:', processError);
      return new Response(
        JSON.stringify({ error: 'Failed to process email', details: processError }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Email processed successfully:', processResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email processed successfully',
        userId: profile.id,
        result: processResult
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in receive-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});