import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink, Edit, Trash2 } from "lucide-react";

interface PreviewLikeDetailDialogProps {
  like: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUp: () => void;
}

export function PreviewLikeDetailDialog({ 
  like, 
  open, 
  onOpenChange,
  onSignUp 
}: PreviewLikeDetailDialogProps) {
  if (!like) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Image */}
          <div className="relative">
            {like.uploaded_image_url || like.image_url ? (
              <img
                src={like.uploaded_image_url || like.image_url}
                alt={like.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                <Heart className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{like.title}</h2>
              {like.brand_name && (
                <p className="text-lg text-muted-foreground">{like.brand_name}</p>
              )}
            </div>

            {like.description && (
              <p className="text-muted-foreground">{like.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {like.price && (
                <Badge variant="secondary" className="text-lg font-semibold">
                  {like.price}
                </Badge>
              )}
              {like.category && (
                <Badge variant="outline" className="capitalize">
                  {like.category}
                </Badge>
              )}
              {like.item_type && (
                <Badge variant="outline" className="capitalize">
                  {like.item_type}
                </Badge>
              )}
            </div>

            {like.source_email && (
              <p className="text-sm text-muted-foreground">
                Source: {like.source_email}
              </p>
            )}

            {like.created_at && (
              <p className="text-sm text-muted-foreground">
                Added {new Date(like.created_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Preview-only Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              onClick={onSignUp}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Store (Sign up required)
            </Button>
            <Button
              variant="outline"
              onClick={onSignUp}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit (Sign up required)
            </Button>
            <Button
              variant="destructive"
              onClick={onSignUp}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete (Sign up required)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}