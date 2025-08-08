import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1';

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
  
  if (text.match(/polo|polo shirt/)) return { category: 'polo-shirts' };
  if (text.match(/button|button-up|button down|dress shirt|formal shirt/)) return { category: 'button-shirts' };
  if (text.match(/t-shirt|tee|graphic tee|basic tee/)) return { category: 't-shirts' };
  if (text.match(/shirt|blouse|top/)) return { category: 'shirts' };
  if (text.match(/jean|denim/)) return { category: 'jeans' };
  if (text.match(/short(?!s)|board short|swim short/)) return { category: 'shorts' };
  if (text.match(/pant|trouser|chino/)) return { category: 'pants' };
  if (text.match(/jacket|blazer|coat/)) return { category: 'jackets' };
  if (text.match(/sweater|pullover|cardigan/)) return { category: 'sweaters' };
  if (text.match(/hoodie|hooded|sweatshirt/)) return { category: 'hoodies' };
  if (text.match(/active|athletic|workout|gym|sport|running|yoga|fitness/)) return { category: 'activewear' };
  if (text.match(/shoe|sneaker|boot|sandal|heel|flat|footwear/)) return { category: 'shoes' };
  
  return { category: 'shirts' };
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
      console.log('Extracting product data from URL:', requestData.url);
      const urlDomain = new URL(requestData.url).hostname;
      console.log('Domain being scraped:', urlDomain);
      
      let extractionSuccess = false;
      
      // First, try Firecrawl for robust extraction
      const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (firecrawlApiKey) {
        console.log('Attempting Firecrawl extraction...');
        try {
          const app = new FirecrawlApp({ apiKey: firecrawlApiKey });
          
          const scrapeResult = await app.scrapeUrl(requestData.url, {
            formats: ['markdown', 'html'],
            onlyMainContent: true,
            includeTags: ['title', 'meta', 'h1', 'h2', 'img', 'p', 'span', 'div'],
          });
          
          if (scrapeResult.success && scrapeResult.data) {
            console.log('Firecrawl extraction successful');
            const data = scrapeResult.data;
            
            // Extract product information from Firecrawl data
            if (data.metadata) {
              if (data.metadata.title && !productData.title) {
                productData.title = data.metadata.title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
              }
              if (data.metadata.description && !productData.description) {
                productData.description = data.metadata.description.replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
              }
              if (data.metadata.ogImage && !productData.image_url && !storedImagePath) {
                productData.image_url = data.metadata.ogImage;
              }
            }
            
            // Look for price in the markdown content
            if (data.markdown && !productData.price) {
              const priceRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?/g;
              const priceMatches = data.markdown.match(priceRegex);
              if (priceMatches && priceMatches.length > 0) {
                // Take the first price found
                productData.price = priceMatches[0];
              }
            }
            
            // Enhanced brand extraction from domain
            const domain = new URL(requestData.url).hostname;
            let brandFromDomain = domain.replace(/^www\./, '').split('.')[0];
            
            const brandCleanup: { [key: string]: string } = {
              'tecovas': 'Tecovas',
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
              'adidas': 'Adidas',
              'amazon': 'Amazon',
              'target': 'Target',
              'walmart': 'Walmart'
            };
            
            if (brandCleanup[brandFromDomain.toLowerCase()]) {
              brandFromDomain = brandCleanup[brandFromDomain.toLowerCase()];
            } else {
              brandFromDomain = brandFromDomain.charAt(0).toUpperCase() + brandFromDomain.slice(1);
            }
            
            if (!productData.brand_name) {
              productData.brand_name = brandFromDomain;
            }
            
            extractionSuccess = true;
            console.log('Firecrawl extraction results:', {
              title: !!productData.title,
              price: !!productData.price,
              image: !!productData.image_url,
              brand: !!productData.brand_name
            });
          }
        } catch (error) {
          console.error('Firecrawl extraction failed:', error);
        }
      } else {
        console.log('Firecrawl API key not found, skipping Firecrawl extraction');
      }
      
      // Fallback to regular scraping if Firecrawl failed or is unavailable
      if (!extractionSuccess) {
        console.log('Attempting fallback extraction with regular fetch...');
        try {
          const response = await fetch(requestData.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate', 
              'Sec-Fetch-Site': 'none',
            }
          });
          
          console.log('Fallback fetch response:', { 
            status: response.status, 
            statusText: response.statusText
          });
          
          if (response.ok) {
            const html = await response.text();
            console.log('Successfully fetched webpage content for fallback extraction');
            
            // Enhanced extraction patterns for various e-commerce sites
            const titleMatch = html.match(/<title[^>]*>([^<]+)</i) || 
                             html.match(/<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)</i) ||
                             html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
                             html.match(/<h1[^>]*>([^<]+)</i);
            
            const priceMatch = html.match(/["\s](\$\d+(?:,\d{3})*(?:\.\d{2})?)["\s]/) ||
                             html.match(/price[^>]*>.*?(\$\d+(?:,\d{3})*(?:\.\d{2})?)/i) ||
                             html.match(/data-price="([^"]+)"/i);
            
            const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                             html.match(/<img[^>]*class="[^"]*product[^"]*"[^>]*src="([^"]+)"/i) ||
                             html.match(/data-src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
            
            const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                                   html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);

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
            
            // Brand extraction fallback
            if (!productData.brand_name) {
              const domain = new URL(requestData.url).hostname;
              let brandFromDomain = domain.replace(/^www\./, '').split('.')[0];
              productData.brand_name = brandFromDomain.charAt(0).toUpperCase() + brandFromDomain.slice(1);
            }
            
            console.log('Fallback extraction results:', {
              title: !!productData.title,
              price: !!productData.price,
              image: !!productData.image_url,
              brand: !!productData.brand_name
            });
          } else {
            console.warn('Fallback fetch failed:', response.status, response.statusText);
            // Try to extract basic info from URL structure as last resort
            const urlParts = requestData.url.split('/');
            const potentialProductName = urlParts[urlParts.length - 1]
              ?.replace(/-/g, ' ')
              ?.replace(/\b\w/g, l => l.toUpperCase());
            
            if (potentialProductName && !productData.title) {
              productData.title = potentialProductName;
              console.log('Extracted title from URL structure:', potentialProductName);
            }
          }
        } catch (error) {
          console.error('Fallback extraction failed:', error);
          // Continue with whatever data we have
        }
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