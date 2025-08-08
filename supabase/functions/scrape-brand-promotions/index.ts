import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedPromotion {
  brand_name: string;
  brand_website_url: string;
  promotion_title: string;
  promotion_description?: string;
  promotion_url?: string;
  discount_percentage?: string;
  discount_code?: string;
  expires_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting brand promotion scraping...');

    // Get all active brand websites for scraping
    const { data: brandWebsites, error: brandsError } = await supabase
      .from('brand_websites')
      .select('*')
      .eq('is_active', true)
      .eq('scraping_enabled', true);

    if (brandsError) {
      console.error('Error fetching brand websites:', brandsError);
      throw brandsError;
    }

    console.log(`Found ${brandWebsites?.length || 0} brands to scrape`);

    // Get all users who have promotional emails (to know which users care about which brands)
    const { data: userBrands, error: userBrandsError } = await supabase
      .from('promotional_emails')
      .select('user_id, brand_name')
      .not('brand_name', 'is', null);

    if (userBrandsError) {
      console.error('Error fetching user brands:', userBrandsError);
      throw userBrandsError;
    }

    // Group users by brand
    const brandUserMap = new Map<string, Set<string>>();
    userBrands?.forEach(({ user_id, brand_name }) => {
      if (!brandUserMap.has(brand_name)) {
        brandUserMap.set(brand_name, new Set());
      }
      brandUserMap.get(brand_name)?.add(user_id);
    });

    const allPromotions: Array<ScrapedPromotion & { user_id: string }> = [];

    // Scrape each brand's website
    for (const brand of brandWebsites || []) {
      try {
        console.log(`Scraping promotions for ${brand.brand_name} at ${brand.website_url}`);
        
        const promotions = await scrapeBrandWebsite(brand.brand_name, brand.website_url);
        
        // Add promotions for each user who has engaged with this brand
        const interestedUsers = brandUserMap.get(brand.brand_name) || new Set();
        
        for (const promotion of promotions) {
          for (const userId of interestedUsers) {
            allPromotions.push({
              ...promotion,
              user_id: userId
            });
          }
        }

        // Update last scraped timestamp
        await supabase
          .from('brand_websites')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', brand.id);

        console.log(`Found ${promotions.length} promotions for ${brand.brand_name}`);
      } catch (error) {
        console.error(`Error scraping ${brand.brand_name}:`, error);
        // Continue with other brands
      }
    }

    // Insert all found promotions
    if (allPromotions.length > 0) {
      // First, mark old promotions as inactive
      await supabase
        .from('scraped_promotions')
        .update({ is_active: false })
        .lt('scraped_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Insert new promotions
      const { error: insertError } = await supabase
        .from('scraped_promotions')
        .insert(allPromotions);

      if (insertError) {
        console.error('Error inserting promotions:', insertError);
        throw insertError;
      }

      console.log(`Successfully inserted ${allPromotions.length} promotions`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraped ${brandWebsites?.length || 0} brands and found ${allPromotions.length} promotions`,
        brandsScraped: brandWebsites?.length || 0,
        promotionsFound: allPromotions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-brand-promotions function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function scrapeBrandWebsite(brandName: string, websiteUrl: string): Promise<ScrapedPromotion[]> {
  const promotions: ScrapedPromotion[] = [];

  try {
    // Fetch the homepage
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract promotions using common patterns
    const promotionPatterns = [
      // Sale percentages
      /(\d+)%\s*(?:off|sale|discount)/gi,
      // Dollar amounts off
      /\$(\d+)\s*off/gi,
      // Free shipping
      /free\s*shipping/gi,
      // BOGO offers
      /buy\s*one\s*get\s*one/gi,
      // Flash sale / limited time
      /(?:flash\s*sale|limited\s*time|today\s*only)/gi,
      // Specific discount codes
      /(?:code|promo)[:\s]*([A-Z0-9]{3,15})/gi
    ];

    // Look for promotion indicators in the HTML
    let foundPromotions = false;

    // Check for percentage discounts
    const percentMatches = html.match(/(\d+)%\s*(?:off|sale|discount)/gi);
    if (percentMatches) {
      for (const match of percentMatches.slice(0, 3)) { // Limit to 3 promotions
        const percentage = match.match(/(\d+)/)?.[1];
        if (percentage && parseInt(percentage) >= 10) { // Only significant discounts
          promotions.push({
            brand_name: brandName,
            brand_website_url: websiteUrl,
            promotion_title: `${percentage}% Off Sale`,
            promotion_description: `Save ${percentage}% on select items`,
            promotion_url: websiteUrl,
            discount_percentage: `${percentage}%`
          });
          foundPromotions = true;
        }
      }
    }

    // Check for free shipping
    if (/free\s*shipping/gi.test(html)) {
      promotions.push({
        brand_name: brandName,
        brand_website_url: websiteUrl,
        promotion_title: 'Free Shipping',
        promotion_description: 'Free shipping on orders',
        promotion_url: websiteUrl
      });
      foundPromotions = true;
    }

    // Check for flash sales or limited time offers
    if (/(?:flash\s*sale|limited\s*time|today\s*only)/gi.test(html)) {
      promotions.push({
        brand_name: brandName,
        brand_website_url: websiteUrl,
        promotion_title: 'Limited Time Offer',
        promotion_description: 'Special limited time promotion available',
        promotion_url: websiteUrl,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expires in 24 hours
      });
      foundPromotions = true;
    }

    // Look for promo codes
    const codeMatches = html.match(/(?:code|promo)[:\s]*([A-Z0-9]{3,15})/gi);
    if (codeMatches) {
      const code = codeMatches[0].match(/([A-Z0-9]{3,15})/gi)?.[0];
      if (code) {
        promotions.push({
          brand_name: brandName,
          brand_website_url: websiteUrl,
          promotion_title: `Use Code: ${code}`,
          promotion_description: `Special discount with promo code ${code}`,
          promotion_url: websiteUrl,
          discount_code: code
        });
        foundPromotions = true;
      }
    }

    console.log(`Scraping ${brandName}: Found ${promotions.length} promotions`);
    
  } catch (error) {
    console.error(`Error scraping ${brandName} at ${websiteUrl}:`, error);
    // Return empty array instead of throwing to continue with other brands
  }

  return promotions;
}