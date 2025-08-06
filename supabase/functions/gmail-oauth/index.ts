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
    // Get URL parameters from the request
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    
    console.log('OAuth callback received - code:', code ? 'Yes' : 'No');
    console.log('OAuth callback received - state:', state ? 'Yes' : 'No');
    console.log('OAuth callback received - error:', error || 'None');
    
    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }
    
    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }
    
    // Parse state to get user info
    const stateData = JSON.parse(state);
    const { userId } = stateData;
    
    console.log('Processing Gmail OAuth for user:', userId);
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    console.log('Google Client ID configured:', clientId ? 'Yes (length: ' + clientId.length + ')' : 'No');
    console.log('Google Client Secret configured:', clientSecret ? 'Yes (length: ' + clientSecret.length + ')' : 'No');
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange authorization code for tokens
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

    // Create a session for the user by generating a sign-in link
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: stateData.gmailAddress,
      options: {
        redirectTo: 'https://preview--fits-forward-hub.lovable.app/dashboard?oauth_success=true'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Failed to create auth session');
    }

    console.log('Generated auth link for user');

    // Redirect the user to the auth link which will sign them in
    return new Response(null, {
      status: 302,
      headers: {
        'Location': authData.properties?.action_link || 'https://preview--fits-forward-hub.lovable.app/dashboard?oauth_success=true',
        ...corsHeaders
      }
    });

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