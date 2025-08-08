import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ScrapedPromotion {
  id: string;
  brand_name: string;
  brand_website_url: string;
  promotion_title: string;
  promotion_description?: string;
  promotion_url?: string;
  discount_percentage?: string;
  discount_code?: string;
  expires_at?: string;
  scraped_at: string;
  is_active: boolean;
}

export function useScrapedPromotions(brandName?: string) {
  const [scrapedPromotions, setScrapedPromotions] = useState<ScrapedPromotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScrapedPromotions();
  }, [brandName]);

  const fetchScrapedPromotions = async () => {
    try {
      let query = supabase
        .from('scraped_promotions')
        .select('*')
        .eq('is_active', true)
        .order('scraped_at', { ascending: false });

      if (brandName) {
        query = query.eq('brand_name', brandName);
      }

      const { data, error } = await query;

      if (error) throw error;

      setScrapedPromotions(data || []);
    } catch (error) {
      console.error('Error fetching scraped promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasScrapedPromotions = (brand?: string): boolean => {
    if (!brand) return scrapedPromotions.length > 0;
    return scrapedPromotions.some(p => p.brand_name === brand);
  };

  const getScrapedPromotionsForBrand = (brand: string): ScrapedPromotion[] => {
    return scrapedPromotions.filter(p => p.brand_name === brand);
  };

  const triggerManualScrape = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('scrape-brand-promotions');
      
      if (error) throw error;
      
      // Refresh promotions after scraping
      await fetchScrapedPromotions();
      
      return data;
    } catch (error) {
      console.error('Error triggering manual scrape:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    scrapedPromotions,
    loading,
    hasScrapedPromotions,
    getScrapedPromotionsForBrand,
    triggerManualScrape,
    refetch: fetchScrapedPromotions
  };
}