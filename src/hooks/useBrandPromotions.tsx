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
    try {
      const { data, error } = await supabase
        .from('promotional_emails')
        .select('brand_name')
        .not('brand_name', 'is', null);

      if (error) throw error;

      // Count promotions per brand
      const counts: BrandPromotionCount = {};
      data?.forEach((item) => {
        if (item.brand_name) {
          counts[item.brand_name] = (counts[item.brand_name] || 0) + 1;
        }
      });

      setBrandPromotions(counts);
    } catch (error) {
      console.error('Error fetching brand promotions:', error);
    } finally {
      setLoading(false);
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