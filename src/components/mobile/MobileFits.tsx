import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MobileItemGrid } from "@/components/mobile/MobileItemGrid";
import { FitDetailDialog } from "@/components/fits/FitDetailDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Camera, Plus, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface TaggedItem {
  id: string;
  tagId: string;
  product_name: string | null;
  brand_name: string;
  product_image_url: string | null;
  uploaded_image_url: string | null;
  stored_image_path: string | null;
  item_order: number;
}

export default function MobileFits() {
  const [fits, setFits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [selectedFit, setSelectedFit] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [fitsWithTags, setFitsWithTags] = useState<{[key: string]: TaggedItem[]}>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFits();
    }
  }, [user]);

  const fetchFits = async () => {
    const { data } = await supabase
      .from('fits')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setFits(data || []);
    
    // Fetch tagged items for each fit
    if (data && data.length > 0) {
      await fetchTaggedItemsForFits(data.map(fit => fit.id));
    }
    
    setLoading(false);
  };

  const fetchTaggedItemsForFits = async (fitIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('fit_tags')
        .select(`
          id,
          fit_id,
          closet_item_id,
          item_order,
          closet_items!inner (
            id,
            product_name,
            brand_name,
            product_image_url,
            uploaded_image_url,
            stored_image_path
          )
        `)
        .in('fit_id', fitIds)
        .order('item_order', { ascending: true });

      if (error) throw error;
      
      // Group tagged items by fit_id
      const groupedTags: {[key: string]: TaggedItem[]} = {};
      data?.forEach((tag: any) => {
        if (!groupedTags[tag.fit_id]) {
          groupedTags[tag.fit_id] = [];
        }
        groupedTags[tag.fit_id].push({
          ...tag.closet_items,
          tagId: tag.id,
          item_order: tag.item_order || 0,
        });
      });
      
      setFitsWithTags(groupedTags);
    } catch (error) {
      console.error('Error fetching tagged items:', error);
    }
  };

  const handleAddFit = async () => {
    if (!imageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please provide an image URL",
        variant: "destructive",
      });
      return;
    }

    setAddLoading(true);
    try {
      const { error } = await supabase
        .from('fits')
        .insert({
          user_id: user?.id,
          image_url: imageUrl,
          caption: caption.trim() || null,
          is_instagram_url: imageUrl.includes('instagram.com'),
        });

      if (error) throw error;

      toast({
        title: "Fit added!",
        description: "Your fit has been shared successfully",
      });

      setImageUrl("");
      setCaption("");
      setShowAddDialog(false);
      fetchFits();
    } catch (error) {
      console.error('Error adding fit:', error);
      toast({
        title: "Error",
        description: "Failed to add fit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleFitClick = (fit: any) => {
    setSelectedFit(fit);
    setShowDetailDialog(true);
  };

  const handleDeleteFit = async (fitId: string) => {
    try {
      // Remove from local state
      setFits(fits.filter(fit => fit.id !== fitId));
      setFitsWithTags(prev => {
        const updated = {...prev};
        delete updated[fitId];
        return updated;
      });
    } catch (error) {
      console.error('Error deleting fit:', error);
      // Refresh on error
      fetchFits();
    }
  };

  const renderFitItem = (fit: any, viewMode: 'grid' | 'list') => {
    const taggedItems = fitsWithTags[fit.id] || [];
    
    if (viewMode === 'grid') {
      return (
        <Card key={fit.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFitClick(fit)}>
          <div className="flex">
            {/* Main Image */}
            <div className="aspect-[3/4] flex-1 relative">
              {fit.image_url ? (
                <img
                  src={fit.image_url}
                  alt={fit.caption || "Outfit"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Tagged Items Sidebar */}
            {taggedItems.length > 0 && (
              <div className="w-16 p-2 bg-muted/20 border-l border-border">
                <div className="space-y-1">
                  {taggedItems.slice(0, 4).map((item) => {
                    const imageUrl = item.uploaded_image_url || item.product_image_url || item.stored_image_path;
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
                            <Package className="h-3 w-3 text-muted-foreground" />
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

    // List view
    return (
      <Card key={fit.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFitClick(fit)}>
        <div className="flex gap-3">
          <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0">
            {fit.image_url ? (
              <img
                src={fit.image_url}
                alt={fit.caption || "Outfit"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
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
              {taggedItems.slice(0, 2).map((item) => {
                const imageUrl = item.uploaded_image_url || item.product_image_url || item.stored_image_path;
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
                        <Package className="h-2 w-2 text-muted-foreground" />
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
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <MobileItemGrid
        items={fits}
        renderItem={renderFitItem}
        onAddNew={() => setShowAddDialog(true)}
        addButtonText="Add Outfit"
        emptyMessage="No outfits yet. Share your first fit!"
      />
      
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Fit</DialogTitle>
            <DialogDescription>
              Add a photo of your outfit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Textarea
                id="caption"
                placeholder="Describe your fit..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddFit}
                disabled={addLoading || !imageUrl.trim()}
                className="flex-1"
              >
                {addLoading ? "Sharing..." : "Share Fit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Fit Detail Dialog */}
      <FitDetailDialog
        fit={selectedFit}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onDelete={handleDeleteFit}
        onFitUpdated={fetchFits}
      />
    </MobileLayout>
  );
}