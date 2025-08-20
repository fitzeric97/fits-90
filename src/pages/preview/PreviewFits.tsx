import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PreviewSignUpModal } from "@/components/preview/PreviewSignUpModal";
import { PreviewMobileLayout } from "@/components/preview/PreviewMobileLayout";
import { PreviewFitDetailDialog } from "@/components/preview/PreviewFitDetailDialog";
import { FloatingSignUpButton } from "@/components/preview/FloatingSignUpButton";
import { usePreviewInteraction } from "@/hooks/usePreviewInteraction";
import { Card } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

export default function PreviewFits() {
  const [fits, setFits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [selectedFit, setSelectedFit] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const navigate = useNavigate();

  const { handleInteraction } = usePreviewInteraction(() => setShowSignUpModal(true));

  const DEMO_USER_EMAIL = "fitzeric97@gmail.com";

  useEffect(() => {
    fetchFits();
  }, []);

  const fetchFits = async () => {
    try {
      // Get the demo user's profile first
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('gmail_address', DEMO_USER_EMAIL)
        .limit(1);

      if (!profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }

      const demoUserId = profiles[0].id;

      const { data: fits } = await supabase
        .from('fits')
        .select('*')
        .eq('user_id', demoUserId)
        .order('created_at', { ascending: false });

      if (!fits) {
        setFits([]);
        setLoading(false);
        return;
      }

      // Fetch tagged items for each fit
      const fitsWithTags = await Promise.all(
        fits.map(async (fit) => {
          const { data: taggedData } = await supabase
            .from('fit_tags')
            .select(`
              id,
              closet_item_id,
              item_order,
              closet_items!inner (
                id,
                product_name,
                brand_name,
                product_image_url,
                uploaded_image_url
              )
            `)
            .eq('fit_id', fit.id)
            .order('item_order', { ascending: true })
            .order('created_at', { ascending: true })
            .limit(3);

          const taggedItems = taggedData?.map((tag: any) => ({
            ...tag.closet_items,
            tagId: tag.id,
            item_order: tag.item_order || 0
          })).filter(Boolean) || [];

          return {
            ...fit,
            taggedItems
          };
        })
      );

      setFits(fitsWithTags);
    } catch (error) {
      console.error('Error fetching fits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFitClick = (fit: any) => {
    setSelectedFit(fit);
    setShowDetailDialog(true);
  };

  const renderFitItem = (fit: any) => (
    <Card key={fit.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFitClick(fit)}>
      <div className="flex">
        {/* Main image */}
        <div className="aspect-square relative flex-1">
          <img
            src={fit.image_url}
            alt={fit.caption || "Fit"}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Tagged items thumbnails */}
        {fit.taggedItems && fit.taggedItems.length > 0 && (
          <div className="w-16 p-2 border-l border-border bg-muted/20 flex flex-col gap-1">
            {fit.taggedItems.slice(0, 3).map((item: any, index: number) => (
              <div
                key={item.tagId}
                className="w-12 h-12 rounded border border-border bg-background overflow-hidden"
                title={`${item.product_name} - ${item.brand_name}`}
              >
                {(item.uploaded_image_url || item.product_image_url) ? (
                  <img
                    src={item.uploaded_image_url || item.product_image_url}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.product_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {fit.taggedItems.length > 3 && (
              <div className="w-12 h-6 rounded border border-border bg-background flex items-center justify-center">
                <span className="text-xs text-muted-foreground">+{fit.taggedItems.length - 3}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {fit.caption && (
        <div className="p-3 pt-2">
          <p className="text-sm truncate">{fit.caption}</p>
        </div>
      )}
    </Card>
  );

  if (loading) {
    return (
      <PreviewMobileLayout onInteraction={handleInteraction} currentSection="fits">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PreviewMobileLayout>
    );
  }

  return (
    <PreviewMobileLayout onInteraction={handleInteraction} currentSection="fits">
      <div className="p-4">
        {fits.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No fits found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {fits.map(renderFitItem)}
          </div>
        )}
      </div>
      
      <FloatingSignUpButton onClick={() => setShowSignUpModal(true)} />
      
      <PreviewFitDetailDialog
        fit={selectedFit}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onSignUp={() => setShowSignUpModal(true)}
      />
      
      <PreviewSignUpModal 
        open={showSignUpModal} 
        onOpenChange={setShowSignUpModal} 
      />
    </PreviewMobileLayout>
  );
}