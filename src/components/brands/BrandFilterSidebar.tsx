import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Unlink, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Brand {
  name: string;
  promoCount: number;
  isUnsubscribed?: boolean;
}

export function BrandFilterSidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchBrandCounts();
    }
  }, [user]);

  const fetchBrandCounts = async () => {
    if (!user) return;

    try {
      // Fetch promotional emails and unsubscribed brands in parallel
      const [emailsResult, unsubscribedResult] = await Promise.all([
        supabase
          .from('promotional_emails')
          .select('brand_name')
          .eq('user_id', user.id),
        supabase
          .from('unsubscribed_brands')
          .select('brand_name')
          .eq('user_id', user.id)
      ]);

      if (emailsResult.error) {
        console.error('Error fetching brand counts:', emailsResult.error);
        return;
      }

      if (unsubscribedResult.error) {
        console.error('Error fetching unsubscribed brands:', unsubscribedResult.error);
        return;
      }

      // Create set of unsubscribed brands for quick lookup
      const unsubscribedBrands = new Set(
        unsubscribedResult.data?.map(ub => ub.brand_name) || []
      );

      // Count emails per brand
      const brandCounts: { [key: string]: number } = {};
      emailsResult.data?.forEach((email) => {
        const brandName = email.brand_name;
        brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
      });

      // Convert to array and sort by count (descending)
      const brandArray = Object.entries(brandCounts)
        .map(([name, promoCount]) => ({ 
          name, 
          promoCount,
          isUnsubscribed: unsubscribedBrands.has(name)
        }))
        .sort((a, b) => b.promoCount - a.promoCount);

      setBrands(brandArray);
    } catch (error) {
      console.error('Error fetching brand counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (brandName: string) => {
    if (!user) return;

    try {
      // Add to unsubscribed brands
      const { error: unsubError } = await supabase
        .from('unsubscribed_brands')
        .insert({
          user_id: user.id,
          brand_name: brandName
        });

      if (unsubError) {
        throw unsubError;
      }

      // Hide existing emails from this brand (soft delete by updating a flag or moving to archive)
      // For now, we'll just delete them entirely - you could also add an 'archived' flag
      const { error: deleteError } = await supabase
        .from('promotional_emails')
        .delete()
        .eq('user_id', user.id)
        .eq('brand_name', brandName);

      if (deleteError) {
        console.error('Error deleting emails:', deleteError);
        // Don't throw here - unsubscribe still worked
      }

      toast({
        title: "Unsubscribed Successfully",
        description: `You've unsubscribed from ${brandName}. Existing emails have been removed and future emails will be blocked.`,
      });

      // Refresh the brand list
      await fetchBrandCounts();
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unsubscribe from brand",
        variant: "destructive",
      });
    }
  };

  const handleResubscribe = async (brandName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('unsubscribed_brands')
        .delete()
        .eq('user_id', user.id)
        .eq('brand_name', brandName);

      if (error) {
        throw error;
      }

      toast({
        title: "Re-subscribed Successfully",
        description: `You've re-subscribed to ${brandName}. Future emails will be collected again.`,
      });

      // Refresh the brand list
      await fetchBrandCounts();
    } catch (error: any) {
      console.error('Error re-subscribing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to re-subscribe to brand",
        variant: "destructive",
      });
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
                  className={`flex-1 justify-start ${brand.isUnsubscribed ? 'opacity-60' : ''}`}
                  onClick={() => navigate(`/brand-promotions/${encodeURIComponent(brand.name)}`)}
                >
                  <div className={`w-5 h-5 rounded text-xs flex items-center justify-center mr-2 ${
                    brand.isUnsubscribed ? 'bg-muted' : 'bg-primary/10'
                  }`}>
                    {brand.isUnsubscribed ? (
                      <X className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      brand.name.charAt(0)
                    )}
                  </div>
                  <span className={brand.isUnsubscribed ? 'line-through text-muted-foreground' : ''}>
                    {brand.name}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {brand.promoCount}
                  </span>
                </Button>
                
                {brand.isUnsubscribed ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 ml-1"
                    onClick={() => handleResubscribe(brand.name)}
                    title={`Re-subscribe to ${brand.name}`}
                  >
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 ml-1"
                        title={`Unsubscribe from ${brand.name}`}
                      >
                        <Unlink className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unsubscribe from {brand.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all existing promotional emails from {brand.name} and prevent future emails from this brand from being collected. You can re-subscribe anytime.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleUnsubscribe(brand.name)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Unsubscribe
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}