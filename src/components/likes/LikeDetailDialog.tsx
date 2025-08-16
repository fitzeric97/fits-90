import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FallbackImage } from "@/components/ui/fallback-image";
import { EditLikeDialog } from "@/components/likes/EditLikeDialog";
import { ExternalLink, Heart, Calendar, Tag, Trash2, Edit } from "lucide-react";
import { useState } from "react";

interface Like {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  uploaded_image_url: string | null;
  price: string | null;
  brand_name: string | null;
  source_email: string | null;
  category: string | null;
  item_type: string | null;
  created_at: string;
}

interface LikeDetailDialogProps {
  like: Like | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (likeId: string) => void;
  onLikeUpdated?: () => void;
}

export function LikeDetailDialog({ 
  like, 
  open, 
  onOpenChange, 
  onDelete,
  onLikeUpdated
}: LikeDetailDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  if (!like) return null;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(like.id);
      onOpenChange(false);
    }
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleLikeUpdated = () => {
    if (onLikeUpdated) {
      onLikeUpdated();
    }
    setShowEditDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Item Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Image */}
            <div className="aspect-square w-full max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
              <FallbackImage
                src={like.image_url}
                fallbackSrc={like.uploaded_image_url}
                alt={like.title}
                className="w-full h-full object-cover"
                fallbackIcon={<Heart className="h-16 w-16 text-muted-foreground" />}
              />
            </div>
            
            {/* Actions - Moved to top */}
            <div className="flex gap-2">
              <Button 
                onClick={() => window.open(like.url, '_blank')} 
                className="flex-1"
                variant="default"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Store
              </Button>
              <Button 
                onClick={handleEdit}
                className="flex-1"
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
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
              {like.brand_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Brand
                  </p>
                  <p className="text-lg font-semibold">{like.brand_name}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Title
                </p>
                <h2 className="text-xl font-bold">{like.title}</h2>
              </div>
              
              {like.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground">{like.description}</p>
                </div>
              )}
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {like.category && (
                  <Badge variant="secondary" className="capitalize">
                    <Tag className="h-3 w-3 mr-1" />
                    {like.category}
                  </Badge>
                )}
                {like.price && (
                  <Badge variant="default" className="font-semibold">
                    {like.price}
                  </Badge>
                )}
                {like.item_type && (
                  <Badge variant="outline" className="capitalize">
                    {like.item_type}
                  </Badge>
                )}
              </div>
              
              {/* Metadata */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Added on {new Date(like.created_at).toLocaleDateString()}</span>
                </div>
                {like.source_email && (
                  <div>
                    <span className="font-medium">Source: </span>
                    <span>{like.source_email}</span>
                  </div>
                )}
              </div>
              
              {/* Close Button */}
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {showEditDialog && (
        <EditLikeDialog
          like={like}
          onItemUpdated={handleLikeUpdated}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
    </>
  );
}