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

interface GoogleOAuthRequest {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, accessToken, refreshToken, expiresIn }: GoogleOAuthRequest = await req.json();
    
    console.log('Processing Google OAuth tokens for user:', userId);

    if (!accessToken) {
      throw new Error('Access token is required');
    }

    // Store tokens in database
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    
    const { error: dbError } = await supabase
      .from('user_gmail_tokens')
      .upsert({
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken || '',
        expires_at: expiresAt,
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
      }, {
        onConflict: 'user_id'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store tokens');
    }

    console.log('Successfully stored Google OAuth tokens for user:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Google OAuth handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process Google OAuth tokens'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);