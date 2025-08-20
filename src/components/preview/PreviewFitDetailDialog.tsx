import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Edit, Trash2, Tag } from "lucide-react";

interface PreviewFitDetailDialogProps {
  fit: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUp: () => void;
}

export function PreviewFitDetailDialog({ 
  fit, 
  open, 
  onOpenChange,
  onSignUp 
}: PreviewFitDetailDialogProps) {
  if (!fit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Image */}
          <div className="relative">
            <img
              src={fit.image_url}
              alt={fit.caption || "Fit"}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>

          {/* Content */}
          <div className="space-y-4">
            {fit.caption && (
              <div>
                <h2 className="text-2xl font-bold">{fit.caption}</h2>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {fit.is_instagram_url ? 'Instagram' : 'Upload'}
              </Badge>
            </div>

            {fit.created_at && (
              <p className="text-sm text-muted-foreground">
                Created {new Date(fit.created_at).toLocaleDateString()}
              </p>
            )}

            {/* Tagged Items Preview */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Tagged Items ({fit.taggedItems?.length || 0})</h3>
              {fit.taggedItems && fit.taggedItems.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {fit.taggedItems.map((item: any) => (
                    <div
                      key={item.tagId}
                      className="space-y-2 cursor-pointer"
                      onClick={onSignUp}
                    >
                      <div className="aspect-square rounded-lg border border-border bg-background overflow-hidden hover:ring-2 hover:ring-primary transition-all">
                        {(item.uploaded_image_url || item.product_image_url) ? (
                          <img
                            src={item.uploaded_image_url || item.product_image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-lg text-muted-foreground font-medium">
                              {item.product_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.brand_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No items tagged yet. Sign up to see and manage tagged closet items for this fit.
                </p>
              )}
            </div>
          </div>

          {/* Preview-only Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onSignUp}
              className="flex items-center gap-2"
            >
              <Tag className="h-4 w-4" />
              Tag Items (Sign up required)
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