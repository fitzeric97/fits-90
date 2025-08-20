import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Edit, Trash2, ExternalLink } from "lucide-react";

interface PreviewClosetDetailDialogProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUp: () => void;
}

export function PreviewClosetDetailDialog({ 
  item, 
  open, 
  onOpenChange,
  onSignUp 
}: PreviewClosetDetailDialogProps) {
  if (!item) return null;

  const imageUrl = item.uploaded_image_url || item.product_image_url || item.stored_image_path;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Image */}
          <div className="relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.product_name || "Closet item"}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{item.product_name || "Unknown Item"}</h2>
              {item.brand_name && (
                <p className="text-lg text-muted-foreground">{item.brand_name}</p>
              )}
            </div>

            {item.product_description && (
              <p className="text-muted-foreground">{item.product_description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {item.price && (
                <Badge variant="secondary" className="text-lg font-semibold">
                  {item.price}
                </Badge>
              )}
              {item.category && (
                <Badge variant="outline" className="capitalize">
                  {item.category}
                </Badge>
              )}
              {item.color && (
                <Badge variant="outline" className="capitalize">
                  {item.color}
                </Badge>
              )}
              {item.size && (
                <Badge variant="outline">
                  Size: {item.size}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {item.purchase_date && (
                <div>
                  <span className="font-medium">Purchase Date:</span>
                  <p className="text-muted-foreground">
                    {new Date(item.purchase_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {item.order_number && (
                <div>
                  <span className="font-medium">Order Number:</span>
                  <p className="text-muted-foreground">{item.order_number}</p>
                </div>
              )}
            </div>

            {item.created_at && (
              <p className="text-sm text-muted-foreground">
                Added {new Date(item.created_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Preview-only Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {item.product_url && (
              <Button
                onClick={onSignUp}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Product (Sign up required)
              </Button>
            )}
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