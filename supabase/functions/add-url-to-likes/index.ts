import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddLikeRequest {
  url: string;
  title?: string;
  description?: string;
  image_url?: string;
  price?: string;
  brand_name?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            authorization: req.headers.get('authorization') ?? '',
            apikey: req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
          }
        }
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const requestData: AddLikeRequest = await req.json();
    console.log('Adding like for URL:', requestData.url);

    // If product details aren't provided, try to extract them from the URL
    let productData = { ...requestData };
    
    if (!productData.title || !productData.brand_name) {
      console.log('Extracting product data from URL...');
      
      try {
        // Fetch the webpage content
        const response = await fetch(requestData.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Extract product information using basic HTML parsing
          const titleMatch = html.match(/<title[^>]*>([^<]+)</i) || 
                           html.match(/<h1[^>]*>([^<]+)</i) ||
                           html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
          
          const priceMatch = html.match(/\$(\d+(?:\.\d{2})?)/);
          
          const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                           html.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
          
          const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                                 html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);

          // Extract brand from domain or page content
          const domain = new URL(requestData.url).hostname;
          const brandFromDomain = domain.replace(/^www\./, '').split('.')[0];
          
          if (titleMatch && !productData.title) {
            productData.title = titleMatch[1].trim();
          }
          if (priceMatch && !productData.price) {
            productData.price = `$${priceMatch[1]}`;
          }
          if (imageMatch && !productData.image_url) {
            productData.image_url = imageMatch[1];
          }
          if (descriptionMatch && !productData.description) {
            productData.description = descriptionMatch[1].trim();
          }
          if (!productData.brand_name) {
            productData.brand_name = brandFromDomain.charAt(0).toUpperCase() + brandFromDomain.slice(1);
          }
          
          console.log('Extracted product data:', productData);
        }
      } catch (error) {
        console.error('Error extracting product data:', error);
        // Continue with whatever data we have
      }
    }

    // Insert the like into the database
    const { data: like, error: insertError } = await supabase
      .from('user_likes')
      .insert({
        user_id: user.id,
        url: productData.url,
        title: productData.title || 'Product',
        description: productData.description,
        image_url: productData.image_url,
        price: productData.price,
        brand_name: productData.brand_name,
        source_email: 'manual_add'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting like:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to add like', details: insertError }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Like added successfully:', like);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Like added successfully',
        like: like
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in add-url-to-likes function:', error);
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