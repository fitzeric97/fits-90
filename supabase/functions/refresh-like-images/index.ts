import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Starting refresh-like-images function ===');
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.split(' ')[1]);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { likeIds, refreshAll } = await req.json();
    
    // Get likes to refresh
    let query = supabase
      .from('user_likes')
      .select('id, url, image_url, title, brand_name');
    
    if (refreshAll) {
      query = query.eq('user_id', user.id);
    } else if (likeIds && Array.isArray(likeIds)) {
      query = query.in('id', likeIds).eq('user_id', user.id);
    } else {
      // Default: refresh likes with missing/broken images
      query = query
        .eq('user_id', user.id)
        .or('image_url.is.null,image_url.eq.');
    }

    const { data: likes, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('Error fetching likes:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch likes' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Found ${likes?.length || 0} likes to refresh`);
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const like of likes || []) {
      try {
        console.log(`Refreshing images for like ${like.id}: ${like.url}`);
        
        // Enhanced image scraping logic
        const imageUrl = await scrapeImageFromUrl(like.url);
        
        if (imageUrl) {
          // Validate that the image actually loads
          const isValid = await validateImageUrl(imageUrl);
          
          if (isValid) {
            // Update the like with the new image URL
            const { error: updateError } = await supabase
              .from('user_likes')
              .update({ image_url: imageUrl })
              .eq('id', like.id);
            
            if (updateError) {
              console.error(`Error updating like ${like.id}:`, updateError);
              results.push({ id: like.id, status: 'error', error: updateError.message });
              errorCount++;
            } else {
              console.log(`Successfully updated image for like ${like.id}`);
              results.push({ id: like.id, status: 'success', image_url: imageUrl });
              successCount++;
            }
          } else {
            console.log(`Image URL validation failed for like ${like.id}: ${imageUrl}`);
            results.push({ id: like.id, status: 'error', error: 'Image validation failed' });
            errorCount++;
          }
        } else {
          console.log(`No image found for like ${like.id}`);
          results.push({ id: like.id, status: 'error', error: 'No image found' });
          errorCount++;
        }
        
        // Add delay to avoid overwhelming target sites
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing like ${like.id}:`, error);
        results.push({ id: like.id, status: 'error', error: error.message });
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: likes?.length || 0,
        successCount,
        errorCount,
        results
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

async function scrapeImageFromUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      console.log(`HTTP error ${response.status} for URL: ${url}`);
      return null;
    }
    
    const html = await response.text();
    
    // Enhanced image extraction patterns
    const imagePatterns = [
      // Open Graph image (most reliable)
      /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
      
      // Twitter card image
      /<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i,
      
      // Product-specific images
      /<img[^>]*class="[^"]*product[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*src="([^"]+)"[^>]*class="[^"]*product[^"]*"/i,
      /<img[^>]*data-src="([^"]+)"[^>]*class="[^"]*product[^"]*"/i,
      
      // Common e-commerce patterns
      /data-zoom-image="([^"]+)"/i,
      /data-large-image="([^"]+)"/i,
      /"product_image":"([^"]+)"/i,
      /"image":"([^"]+)"/i,
      
      // Generic image patterns (last resort)
      /<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
      /data-src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
    ];
    
    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let imageUrl = match[1];
        
        // Convert relative URLs to absolute
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          const baseUrl = new URL(url);
          imageUrl = baseUrl.origin + imageUrl;
        }
        
        // Skip placeholder or invalid images
        if (imageUrl.includes('placeholder') || 
            imageUrl.includes('loading') || 
            imageUrl.includes('spinner') ||
            imageUrl.length < 10) {
          continue;
        }
        
        console.log(`Found image URL: ${imageUrl}`);
        return imageUrl;
      }
    }
    
    console.log(`No image found in HTML for URL: ${url}`);
    return null;
    
  } catch (error) {
    console.error(`Error scraping image from ${url}:`, error);
    return null;
  }
}

async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 second timeout for validation
    });
    
    const contentType = response.headers.get('content-type');
    const isImage = contentType && contentType.startsWith('image/');
    
    return response.ok && isImage;
  } catch (error) {
    console.log(`Image validation failed for ${imageUrl}:`, error);
    return false;
  }
}