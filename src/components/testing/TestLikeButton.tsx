import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export function TestLikeButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const testFahertyProduct = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to test the likes functionality",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('add-url-to-likes', {
        body: {
          url: 'https://fahertybrand.com/products/biarritz-boardshort-blue-horizon-stripe',
          title: 'Biarritz Boardshort - Blue Horizon Stripe',
          brand_name: 'Faherty Brand',
          price: '$118',
          image_url: 'https://fahertybrand.com/cdn/shop/files/SU25-FAHERTY-MENS-MSS2521-BLH-BiarritzBoardshort-BlueHorizonStripe_OM_FRONT_CROP_1.jpg?v=1752808398&width=3354',
          description: 'Men\'s boardshort in Blue Horizon Stripe pattern'
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${data.like.brand_name} boardshort added to your likes`,
      });
      
      console.log('Added like:', data.like);
    } catch (error: any) {
      console.error('Error testing like:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add test like",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={testFahertyProduct} 
      disabled={loading}
      variant="outline"
      className="mb-4"
    >
      {loading ? "Adding..." : "🧪 Test Faherty Boardshort"}
    </Button>
  );
}