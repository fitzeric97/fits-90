import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { TagIcon, MoreHorizontal, Edit } from "lucide-react";
import { TagClosetDialog } from "./TagClosetDialog";
import { ImageEditor } from "./ImageEditor";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Fit {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  is_instagram_url: boolean;
  created_at: string;
}

interface TaggedItem {
  id: string;
  product_name: string;
  brand_name: string;
  product_image_url?: string;
}

interface FitCardProps {
  fit: Fit;
  onUpdate: () => void;
}

export function FitCard({ fit, onUpdate }: FitCardProps) {
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [taggedItems, setTaggedItems] = useState<TaggedItem[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTaggedItems();
  }, [fit.id]);

  const fetchTaggedItems = async () => {
    try {
      console.log('Fetching tagged items for fit:', fit.id);
      
      const { data, error } = await supabase
        .from('fit_tags')
        .select(`
          closet_items!inner (
            id,
            product_name,
            brand_name,
            product_image_url
          )
        `)
        .eq('fit_id', fit.id)
        .limit(3);

      console.log('Tagged items query result:', { data, error });

      if (error) throw error;
      
      const items = data?.map((tag: any) => tag.closet_items).filter(Boolean) || [];
      console.log('Processed tagged items:', items);
      setTaggedItems(items as TaggedItem[]);
    } catch (error) {
      console.error('Error fetching tagged items:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('fits')
        .delete()
        .eq('id', fit.id);

      if (error) throw error;

      toast({
        title: "Fit deleted",
        description: "Your fit has been removed.",
      });
      onUpdate();
      fetchTaggedItems(); // Refresh tagged items after deletion
    } catch (error) {
      console.error('Error deleting fit:', error);
      toast({
        title: "Error",
        description: "Failed to delete fit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleItemClick = (itemId: string) => {
    navigate(`/closet/${itemId}`);
  };

  const handleTagDialogClose = (open: boolean) => {
    setShowTagDialog(open);
    if (!open) {
      fetchTaggedItems(); // Refresh tagged items when dialog closes
    }
  };

  const handleEditImage = async (editedImageBlob: Blob) => {
    try {
      // Upload the edited image
      const fileName = `fit_${fit.id}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fit-images')
        .upload(fileName, editedImageBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('fit-images')
        .getPublicUrl(uploadData.path);

      // Update the fit with the new image URL
      const { error: updateError } = await supabase
        .from('fits')
        .update({ image_url: urlData.publicUrl })
        .eq('id', fit.id);

      if (updateError) throw updateError;

      toast({
        title: "Image updated",
        description: "Your fit image has been successfully edited.",
      });

      setShowEditDialog(false);
      onUpdate(); // Refresh the fits grid
    } catch (error) {
      console.error('Error updating fit image:', error);
      toast({
        title: "Error",
        description: "Failed to update image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="group overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">{/* fit image container */}
            <AspectRatio ratio={1}>
              <img
                src={fit.image_url}
                alt={fit.caption || "Fit"}
                className="object-cover w-full h-full"
              />
            </AspectRatio>
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowTagDialog(true)}
              >
                <TagIcon className="h-4 w-4 mr-1" />
                Tag Closet
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    Delete Fit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {fit.is_instagram_url && (
              <Badge variant="secondary" className="absolute top-2 right-2">
                Instagram
              </Badge>
            )}
          </div>
          
          {fit.caption && (
            <div className="p-3 pb-2">
              <p className="text-sm text-muted-foreground">{fit.caption}</p>
            </div>
          )}

          {/* Tagged Items Thumbnails */}
          {taggedItems.length > 0 && (
            <div className="px-3 pb-3">
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Tagged items ({taggedItems.length}):
                </span>
                <div className="flex gap-2 flex-wrap">
                  {taggedItems.map((item) => {
                    console.log('Rendering thumbnail for item:', item);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className="w-16 h-16 rounded-lg border-2 border-border bg-muted overflow-hidden hover:ring-2 hover:ring-primary hover:border-primary transition-all transform hover:scale-105"
                        title={`${item.product_name} - ${item.brand_name}`}
                      >
                        {item.product_image_url ? (
                          <img
                            src={item.product_image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('Image failed to load:', item.product_image_url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
                            <span className="text-sm text-muted-foreground font-medium">
                              {item.product_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TagClosetDialog
        open={showTagDialog}
        onOpenChange={handleTagDialogClose}
        fitId={fit.id}
      />

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <ImageEditor
            imageUrl={fit.image_url}
            onSave={handleEditImage}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}