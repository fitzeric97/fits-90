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

// Enhanced product categorization
function categorizeProduct(title: string, description: string, url: string): { category: string; item_type: string } {
  const text = `${title} ${description} ${url}`.toLowerCase();
  
  if (text.match(/polo|polo shirt/)) return { category: 'polo-shirts', item_type: 'polo-shirt' };
  if (text.match(/button|button-up|button down|dress shirt|formal shirt/)) return { category: 'button-shirts', item_type: 'button-shirt' };
  if (text.match(/t-shirt|tee|graphic tee|basic tee/)) return { category: 't-shirts', item_type: 't-shirt' };
  if (text.match(/shirt|blouse|top/)) return { category: 'shirts', item_type: 'shirt' };
  if (text.match(/jean|denim/)) return { category: 'jeans', item_type: 'jeans' };
  if (text.match(/short(?!s)|board short|swim short/)) return { category: 'shorts', item_type: 'shorts' };
  if (text.match(/pant|trouser|chino/)) return { category: 'pants', item_type: 'pants' };
  if (text.match(/jacket|blazer|coat/)) return { category: 'jackets', item_type: 'jacket' };
  if (text.match(/sweater|pullover|cardigan/)) return { category: 'sweaters', item_type: 'sweater' };
  if (text.match(/hoodie|hooded|sweatshirt/)) return { category: 'hoodies', item_type: 'hoodie' };
  if (text.match(/active|athletic|workout|gym|sport|running|yoga|fitness/)) return { category: 'activewear', item_type: 'activewear' };
  if (text.match(/shoe|sneaker|boot|sandal|heel|flat|footwear/)) return { category: 'shoes', item_type: 'shoe' };
  
  return { category: 'shirts', item_type: 'shirt' };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Starting add-url-to-likes function ===');
    
    const authHeader = req.headers.get('authorization');
    console.log('Auth header received:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization header missing or invalid format' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Create Supabase client with the Authorization header
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
            Authorization: authHeader
          }
        }
      }
    );

    // Get the current user using the passed JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User auth result:', { user: !!user, userId: user?.id, error: userError?.message });
    
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          details: userError?.message || 'Invalid or expired token'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const requestData: AddLikeRequest = await req.json();
    console.log('Processing URL:', requestData.url);

    // Enhanced product data extraction
    let productData = { ...requestData };
    
    if (!productData.title || !productData.brand_name || !productData.image_url) {
      console.log('Extracting missing product data from URL...');
      
      try {
        const response = await fetch(requestData.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ProductParser/1.0)',
            'Accept': 'text/html,application/xhtml+xml',
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          console.log('Successfully fetched webpage content');
          
          // Enhanced extraction patterns
          const titleMatch = html.match(/<title[^>]*>([^<]+)</i) || 
                           html.match(/<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)</i) ||
                           html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
          
          const priceMatch = html.match(/["\s](\$\d+(?:\.\d{2})?)["\s]/) ||
                           html.match(/price[^>]*>.*?(\$\d+(?:\.\d{2})?)/i);
          
          const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                           html.match(/<img[^>]*class="[^"]*product[^"]*"[^>]*src="([^"]+)"/i) ||
                           html.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*product[^"]*"/i);
          
          const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                                 html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);

          // Enhanced brand extraction
          const domain = new URL(requestData.url).hostname;
          let brandFromDomain = domain.replace(/^www\./, '').split('.')[0];
          
          // Brand name cleanup
          const brandCleanup: { [key: string]: string } = {
            'fahertybrand': 'Faherty Brand',
            'patagonia': 'Patagonia',
            'outerknown': 'Outerknown',
            'rip-curl': 'Rip Curl',
            'ripcurl': 'Rip Curl',
            'billabong': 'Billabong',
            'volcom': 'Volcom',
            'quicksilver': 'Quicksilver',
            'vans': 'Vans',
            'nike': 'Nike',
            'adidas': 'Adidas'
          };
          
          if (brandCleanup[brandFromDomain.toLowerCase()]) {
            brandFromDomain = brandCleanup[brandFromDomain.toLowerCase()];
          } else {
            brandFromDomain = brandFromDomain.charAt(0).toUpperCase() + brandFromDomain.slice(1);
          }
          
          // Apply extracted data
          if (titleMatch && !productData.title) {
            productData.title = titleMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
          }
          if (priceMatch && !productData.price) {
            productData.price = priceMatch[1];
          }
          if (imageMatch && !productData.image_url) {
            let imgUrl = imageMatch[1];
            if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
            if (imgUrl.startsWith('/')) imgUrl = new URL(requestData.url).origin + imgUrl;
            productData.image_url = imgUrl;
          }
          if (descriptionMatch && !productData.description) {
            productData.description = descriptionMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
          }
          if (!productData.brand_name) {
            productData.brand_name = brandFromDomain;
          }
          
          console.log('Enhanced product data extracted:', {
            title: !!productData.title,
            price: !!productData.price,
            image: !!productData.image_url,
            brand: !!productData.brand_name
          });
        } else {
          console.warn('Failed to fetch webpage:', response.status);
        }
      } catch (error) {
        console.error('Error extracting product data:', error);
        // Continue with whatever data we have
      }
    }

    // Automatic categorization
    const { category, item_type } = categorizeProduct(
      productData.title || '',
      productData.description || '',
      productData.url
    );
    
    console.log('Auto-categorized as:', { category, item_type });

    // Insert the like into the database with enhanced data
    const { data: like, error: insertError } = await supabase
      .from('user_likes')
      .insert({
        user_id: user.id,
        url: productData.url,
        title: productData.title || 'Product',
        description: productData.description,
        image_url: productData.image_url,
        price: productData.price,
        brand_name: productData.brand_name || 'Unknown Brand',
        category: category,
        item_type: item_type,
        source_email: 'manual_add'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save product',
          details: insertError.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Successfully added like with auto-categorization:', like.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Product added to likes successfully',
        like: like
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('=== Function error ===:', error);
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