import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddClosetItemRequest {
  url?: string;
  title?: string;
  description?: string;
  image_url?: string;
  price?: string;
  brand_name?: string;
  size?: string;
  color?: string;
  category?: string;
  purchase_date?: string;
  uploaded_image?: string; // base64 string for uploaded photos
}

// Enhanced product categorization for closet items
function categorizeProduct(title: string, description: string, url: string): { category: string } {
  const text = `${title} ${description} ${url}`.toLowerCase();
  
  if (text.match(/swim|bathing|bikini|boardshort|beach|pool/)) return { category: 'swimwear' };
  if (text.match(/shirt|blouse|top|tee|tank|hoodie|sweater|jacket|coat/)) return { category: 'tops' };
  if (text.match(/jean|pant|trouser|short|skirt|dress/)) return { category: 'bottoms' };
  if (text.match(/shoe|sneaker|boot|sandal|heel|flat/)) return { category: 'footwear' };
  if (text.match(/accessory|bag|belt|hat|jewelry|watch|necklace|bracelet/)) return { category: 'accessories' };
  if (text.match(/underwear|bra|lingerie|sock/)) return { category: 'undergarments' };
  
  return { category: 'clothing' };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Starting add-item-to-closet function ===');
    
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

    const requestData: AddClosetItemRequest = await req.json();
    console.log('Processing closet item request:', { hasUrl: !!requestData.url, hasUploadedImage: !!requestData.uploaded_image });

    let productData = { ...requestData };
    let storedImagePath = null;

    // Handle uploaded image if present
    if (requestData.uploaded_image) {
      console.log('Processing uploaded image...');
      try {
        // Convert base64 to blob
        const base64Data = requestData.uploaded_image.split(',')[1];
        const blob = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Generate unique filename
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('closet-items')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('Failed to upload image:', uploadError);
        } else {
          console.log('Image uploaded successfully:', fileName);
          storedImagePath = fileName;
          
          // Get public URL for the uploaded image
          const { data: publicUrlData } = supabase.storage
            .from('closet-items')
            .getPublicUrl(fileName);
          
          productData.image_url = publicUrlData.publicUrl;
        }
      } catch (error) {
        console.error('Error processing uploaded image:', error);
      }
    }

    // If URL is provided, extract product data
    if (requestData.url && (!productData.title || !productData.brand_name || !productData.image_url)) {
      console.log('Extracting product data from URL...');
      
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
          
          // Apply extracted data only if not already provided
          if (titleMatch && !productData.title) {
            productData.title = titleMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
          }
          if (priceMatch && !productData.price) {
            productData.price = priceMatch[1];
          }
          if (imageMatch && !productData.image_url && !storedImagePath) {
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
          
          console.log('Product data extracted from URL:', {
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

    // Automatic categorization if not provided
    let category = productData.category;
    if (!category) {
      const categorization = categorizeProduct(
        productData.title || '',
        productData.description || '',
        productData.url || ''
      );
      category = categorization.category;
      console.log('Auto-categorized as:', category);
    }

    // Insert the item into the closet_items table
    const { data: closetItem, error: insertError } = await supabase
      .from('closet_items')
      .insert({
        user_id: user.id,
        product_name: productData.title || 'Unknown Item',
        brand_name: productData.brand_name || 'Unknown Brand',
        product_description: productData.description,
        product_image_url: productData.image_url,
        stored_image_path: storedImagePath,
        company_website_url: productData.url,
        price: productData.price,
        size: productData.size,
        color: productData.color,
        category: category,
        purchase_date: productData.purchase_date ? new Date(productData.purchase_date).toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save closet item',
          details: insertError.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Successfully added closet item:', closetItem.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Item added to closet successfully',
        item: closetItem
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