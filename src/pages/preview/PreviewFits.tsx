import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PreviewSignUpModal } from "@/components/preview/PreviewSignUpModal";
import { PreviewMobileLayout } from "@/components/preview/PreviewMobileLayout";
import { PreviewFitDetailDialog } from "@/components/preview/PreviewFitDetailDialog";
import { FloatingSignUpButton } from "@/components/preview/FloatingSignUpButton";
import { usePreviewInteraction } from "@/hooks/usePreviewInteraction";
import { MobileItemGrid } from "@/components/mobile/MobileItemGrid";
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
              closet_items (
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
            .limit(4);

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
      console.log('Fetched fits with tags:', fitsWithTags.map(f => ({ id: f.id, taggedCount: f.taggedItems?.length || 0 })));
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

  const renderFitItem = (fit: any, viewMode: 'grid' | 'list') => {
    const taggedItems = fit.taggedItems || [];
    
    // Debug logging
    console.log('Rendering fit:', fit.id, 'with', taggedItems.length, 'tagged items', 'viewMode:', viewMode);
    
    if (viewMode === 'grid') {
      return (
        <Card key={fit.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFitClick(fit)}>
          <div className="flex">
            {/* Main Image - matching logged-in mobile experience */}
            <div className="aspect-[3/4] flex-1 relative">
              <img
                src={fit.image_url}
                alt={fit.caption || "Outfit"}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Tagged Items Sidebar - exactly like logged-in mobile */}
            {taggedItems.length > 0 && (
              <div className="w-16 p-2 bg-muted/20 border-l border-border">
                <div className="space-y-1">
                  {taggedItems.slice(0, 4).map((item: any) => {
                    const imageUrl = item.uploaded_image_url || item.product_image_url;
                    console.log('Rendering tagged item:', item.tagId, imageUrl);
                    return (
                      <div key={item.tagId} className="w-12 h-12 rounded-sm overflow-hidden bg-muted">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.product_name || item.brand_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-muted-foreground font-medium">
                              {(item.product_name || item.brand_name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {taggedItems.length > 4 && (
                    <div className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">+{taggedItems.length - 4}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {fit.caption && (
            <div className="p-3">
              <p className="text-sm truncate">{fit.caption}</p>
            </div>
          )}
        </Card>
      );
    }

    // List view - matching logged-in mobile experience
    return (
      <Card key={fit.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFitClick(fit)}>
        <div className="flex gap-3">
          <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={fit.image_url}
              alt={fit.caption || "Outfit"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">Outfit</p>
            {fit.caption && (
              <p className="text-sm text-muted-foreground mt-1">{fit.caption}</p>
            )}
            {taggedItems.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {taggedItems.length} tagged item{taggedItems.length !== 1 ? 's' : ''}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(fit.created_at).toLocaleDateString()}
            </p>
          </div>
          
          {/* Tagged Items Preview */}
          {taggedItems.length > 0 && (
            <div className="flex flex-col gap-1">
              {taggedItems.slice(0, 2).map((item: any) => {
                const imageUrl = item.uploaded_image_url || item.product_image_url;
                return (
                  <div key={item.tagId} className="w-8 h-8 rounded-sm overflow-hidden bg-muted">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.product_name || item.brand_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground font-medium">
                          {(item.product_name || item.brand_name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    );
  };

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
      {fits.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No fits found</p>
        </div>
      ) : (
        <MobileItemGrid
          items={fits}
          renderItem={renderFitItem}
          onAddNew={handleInteraction}
          addButtonText="Add Outfit"
          emptyMessage="No outfits yet. Share your first fit!"
          onSearch={() => {}}
          searchPlaceholder="Search your fits..."
        />
      )}
      
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