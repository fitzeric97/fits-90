import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, access_token } = await req.json();
    
    const INSTAGRAM_CLIENT_ID = Deno.env.get('INSTAGRAM_CLIENT_ID');
    const INSTAGRAM_CLIENT_SECRET = Deno.env.get('INSTAGRAM_CLIENT_SECRET');
    const REDIRECT_URI = `${req.headers.get('origin')}/instagram-callback`;

    if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
      throw new Error('Instagram API credentials not configured');
    }

    if (action === 'exchange_token') {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: INSTAGRAM_CLIENT_ID,
          client_secret: INSTAGRAM_CLIENT_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
          code: code,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Token exchange failed:', error);
        throw new Error('Failed to exchange authorization code');
      }

      const tokenData = await tokenResponse.json();
      
      // Exchange short-lived token for long-lived token
      const longLivedResponse = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_CLIENT_SECRET}&access_token=${tokenData.access_token}`);
      
      if (!longLivedResponse.ok) {
        console.error('Long-lived token exchange failed');
        // Continue with short-lived token if long-lived fails
        return new Response(JSON.stringify(tokenData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const longLivedData = await longLivedResponse.json();
      
      return new Response(JSON.stringify({
        access_token: longLivedData.access_token,
        expires_in: longLivedData.expires_in,
        user_id: tokenData.user_id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_media') {
      // Fetch user's Instagram media
      const mediaResponse = await fetch(`https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink,caption,timestamp&access_token=${access_token}`);
      
      if (!mediaResponse.ok) {
        throw new Error('Failed to fetch Instagram media');
      }

      const mediaData = await mediaResponse.json();
      
      // Filter only images and videos (exclude albums for now)
      const filteredMedia = mediaData.data.filter((item: any) => 
        item.media_type === 'IMAGE' || item.media_type === 'VIDEO'
      );

      return new Response(JSON.stringify({
        data: filteredMedia,
        paging: mediaData.paging,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Instagram API error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process Instagram API request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);