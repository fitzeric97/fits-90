import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandPromotionCount {
  [brandName: string]: number;
}

export function useBrandPromotions() {
  const [brandPromotions, setBrandPromotions] = useState<BrandPromotionCount>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrandPromotions();
  }, []);

  const fetchBrandPromotions = async () => {
    console.log('[BrandPromotions] Starting fetch...');
    console.log('[BrandPromotions] Supabase client connected');
    
    try {
      console.log('[BrandPromotions] Executing promotional_emails query...');
      const { data, error } = await supabase
        .from('promotional_emails')
        .select('brand_name')
        .not('brand_name', 'is', null);

      if (error) {
        console.error('[BrandPromotions] Database error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('[BrandPromotions] Query successful. Records found:', data?.length || 0);

      // Count promotions per brand
      const counts: BrandPromotionCount = {};
      data?.forEach((item) => {
        if (item.brand_name) {
          counts[item.brand_name] = (counts[item.brand_name] || 0) + 1;
        }
      });

      console.log('[BrandPromotions] Brand counts:', counts);
      console.log('[BrandPromotions] Unique brands found:', Object.keys(counts).length);

      setBrandPromotions(counts);
    } catch (error) {
      console.error('[BrandPromotions] Fetch error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setLoading(false);
      console.log('[BrandPromotions] Fetch completed');
    }
  };

  const hasBrandPromotions = (brandName: string | null): boolean => {
    if (!brandName) return false;
    return (brandPromotions[brandName] || 0) > 0;
  };

  const getBrandPromotionCount = (brandName: string | null): number => {
    if (!brandName) return 0;
    return brandPromotions[brandName] || 0;
  };

  return {
    hasBrandPromotions,
    getBrandPromotionCount,
    loading
  };
}