import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface OAuthRequest {
  code: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, userId }: OAuthRequest = await req.json();
    
    console.log('Processing Gmail OAuth for user:', userId);
    console.log('Authorization code received:', code ? 'Yes' : 'No');
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    console.log('Google Client ID configured:', clientId ? 'Yes (length: ' + clientId.length + ')' : 'No');
    console.log('Google Client Secret configured:', clientSecret ? 'Yes (length: ' + clientSecret.length + ')' : 'No');
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }
    
    if (!code || !userId) {
      throw new Error('Missing required parameters: code or userId');
    }
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://ijawvesjgyddyiymiahk.supabase.co/functions/v1/gmail-oauth',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${await tokenResponse.text()}`);
    }

    const tokens = await tokenResponse.json();
    console.log('Received tokens for user:', userId);

    // Store tokens in database
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    
    const { error: dbError } = await supabase
      .from('user_gmail_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope || 'https://www.googleapis.com/auth/gmail.readonly',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store tokens');
    }

    console.log('Successfully stored tokens for user:', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Gmail connected successfully' 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Gmail OAuth error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process Gmail OAuth'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);