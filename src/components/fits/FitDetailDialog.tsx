import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FallbackImage } from "@/components/ui/fallback-image";
import { TagClosetDialog } from "@/components/fits/TagClosetDialog";
import { StoryImageGenerator } from "@/components/fits/StoryImageGenerator";
import { Camera, Calendar, Tag, Trash2, Edit, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

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

interface Fit {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  is_instagram_url: boolean;
}

interface FitDetailDialogProps {
  fit: Fit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (fitId: string) => void;
  onFitUpdated?: () => void;
}

export function FitDetailDialog({ 
  fit, 
  open, 
  onOpenChange, 
  onDelete,
  onFitUpdated
}: FitDetailDialogProps) {
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [taggedItems, setTaggedItems] = useState<TaggedItem[]>([]);
  const [userProfile, setUserProfile] = useState<{ display_name: string | null }>({ display_name: null });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (fit && open) {
      fetchTaggedItems();
      fetchUserProfile();
    }
  }, [fit, open]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchTaggedItems = async () => {
    if (!fit) return;
    
    try {
      const { data, error } = await supabase
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
            uploaded_image_url,
            stored_image_path
          )
        `)
        .eq('fit_id', fit.id)
        .order('item_order', { ascending: true });

      if (error) throw error;
      
      const items: TaggedItem[] = data?.map((tag: any) => ({
        ...tag.closet_items,
        tagId: tag.id,
        item_order: tag.item_order || 0,
      })) || [];
      
      setTaggedItems(items);
    } catch (error) {
      console.error('Error fetching tagged items:', error);
      setTaggedItems([]);
    }
  };

  const handleDelete = async () => {
    if (!fit || !onDelete) return;
    
    if (!confirm(`Are you sure you want to delete this fit? This action cannot be undone.`)) {
      return;
    }

    try {
      // First delete all fit tags
      await supabase
        .from('fit_tags')
        .delete()
        .eq('fit_id', fit.id);

      // Then delete the fit
      const { error } = await supabase
        .from('fits')
        .delete()
        .eq('id', fit.id);

      if (error) throw error;

      toast({
        title: "Fit deleted",
        description: "The fit has been removed.",
      });
      
      onDelete(fit.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting fit:', error);
      toast({
        title: "Error",
        description: "Failed to delete fit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTagDialogClose = (open: boolean) => {
    setShowTagDialog(open);
    if (!open) {
      fetchTaggedItems(); // Refresh tagged items when dialog closes
    }
  };

  if (!fit) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Fit Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Image with Tagged Items */}
            <div className="flex gap-4">
              {/* Main Image */}
              <div className="flex-1 aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                <FallbackImage
                  src={fit.image_url}
                  alt={fit.caption || "Outfit"}
                  className="w-full h-full object-cover"
                  fallbackIcon={<Camera className="h-16 w-16 text-muted-foreground" />}
                />
              </div>
              
              {/* Tagged Items Sidebar */}
              {taggedItems.length > 0 && (
                <div className="w-24 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Tagged ({taggedItems.length})
                  </p>
                  <div className="space-y-2">
                    {taggedItems.map((item) => {
                      const imageUrl = item.uploaded_image_url || item.product_image_url || item.stored_image_path;
                      return (
                        <div key={item.tagId} className="w-20 h-20 rounded-md overflow-hidden bg-muted">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.product_name || item.brand_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions - At the top */}
            <div className="flex gap-2">
              <div className="flex-1">
                <StoryImageGenerator
                  fit={{
                    id: fit.id,
                    image_url: fit.image_url,
                    caption: fit.caption || undefined,
                    created_at: fit.created_at,
                  }}
                  taggedItems={taggedItems.map(item => ({
                    id: item.id,
                    product_name: item.product_name || item.brand_name,
                    brand_name: item.brand_name,
                    product_image_url: item.uploaded_image_url || item.product_image_url || undefined,
                    price: undefined, // Add price field if available in your schema
                  }))}
                  username={userProfile.display_name || user?.email?.split('@')[0] || undefined}
                />
              </div>
              <Button 
                onClick={() => setShowTagDialog(true)}
                className="flex-1"
                variant="default"
              >
                <Tag className="h-4 w-4 mr-2" />
                Tag Items
              </Button>
              {onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            
            {/* Content */}
            <div className="space-y-4">
              {fit.caption && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Caption
                  </p>
                  <p className="text-sm">{fit.caption}</p>
                </div>
              )}
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {fit.is_instagram_url && (
                  <Badge variant="secondary">
                    Instagram
                  </Badge>
                )}
                {taggedItems.length > 0 && (
                  <Badge variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {taggedItems.length} item{taggedItems.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              {/* Metadata */}
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Added on {new Date(fit.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Close Button */}
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      {showTagDialog && fit && (
        <TagClosetDialog
          fitId={fit.id}
          open={showTagDialog}
          onOpenChange={handleTagDialogClose}
        />
      )}
    </>
  );
}