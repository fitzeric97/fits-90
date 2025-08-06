import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface Brand {
  name: string;
  promoCount: number;
}

export function BrandFilterSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBrandCounts();
    }
  }, [user]);

  const fetchBrandCounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('promotional_emails')
        .select('brand_name')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching brand counts:', error);
        return;
      }

      // Count emails per brand
      const brandCounts: { [key: string]: number } = {};
      data?.forEach((email) => {
        const brandName = email.brand_name;
        brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
      });

      // Convert to array and sort by count (descending)
      const brandArray = Object.entries(brandCounts)
        .map(([name, promoCount]) => ({ name, promoCount }))
        .sort((a, b) => b.promoCount - a.promoCount);

      setBrands(brandArray);
    } catch (error) {
      console.error('Error fetching brand counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPromotions = brands.reduce((sum, brand) => sum + brand.promoCount, 0);

  if (loading) {
    return (
      <Card className="w-64">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Brands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (brands.length === 0) {
    return (
      <Card className="w-64">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Brands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No brands found</p>
            <p className="text-xs">Scan your emails to see brands here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-64">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Brands</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant={selectedBrand === null ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setSelectedBrand(null)}
        >
          All Brands
          <span className="ml-auto text-xs text-muted-foreground">
            {totalPromotions}
          </span>
        </Button>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Brand List
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 ml-4">
            {brands.map((brand) => (
              <div key={brand.name} className="flex items-center justify-between group">
                <Button
                  variant={selectedBrand === brand.name ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-1 justify-start"
                  onClick={() => setSelectedBrand(brand.name)}
                >
                  <div className="w-5 h-5 bg-primary/10 rounded text-xs flex items-center justify-center mr-2">
                    {brand.name.charAt(0)}
                  </div>
                  {brand.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {brand.promoCount}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 ml-1"
                  title={`Unsubscribe from ${brand.name}`}
                >
                  <Unlink className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}