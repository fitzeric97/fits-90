import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FallbackImage } from "@/components/ui/fallback-image";
import { EditClosetItemDialog } from "@/components/closet/EditClosetItemDialog";
import { Package, Calendar, Tag, Ruler, Palette, Trash2, Edit, Camera } from "lucide-react";
import { useState } from "react";

interface ClosetItem {
  id: string;
  brand_name: string;
  product_name: string | null;
  product_description: string | null;
  product_image_url: string | null;
  uploaded_image_url: string | null;
  stored_image_path: string | null;
  company_website_url: string | null;
  purchase_date: string | null;
  order_number: string | null;
  price: string | null;
  size: string | null;
  color: string | null;
  category: string | null;
  created_at: string;
}

interface ClosetItemDetailDialogProps {
  item: ClosetItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (itemId: string) => void;
  onItemUpdated?: () => void;
}

export function ClosetItemDetailDialog({ 
  item, 
  open, 
  onOpenChange, 
  onDelete,
  onItemUpdated
}: ClosetItemDetailDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  if (!item) return null;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id);
      onOpenChange(false);
    }
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleItemUpdated = () => {
    if (onItemUpdated) {
      onItemUpdated();
    }
    setShowEditDialog(false);
  };

  const imageUrl = item.uploaded_image_url || item.product_image_url || item.stored_image_path;

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
                src={item.product_image_url}
                fallbackSrc={item.uploaded_image_url || (item.stored_image_path ? `https://ijawvesjgyddyiymiahk.supabase.co/storage/v1/object/public/closet-items/${item.stored_image_path}` : null)}
                alt={item.product_name || item.brand_name}
                className="w-full h-full object-cover"
                fallbackIcon={
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <Package className="h-16 w-16 text-muted-foreground mb-4" />
                    <Button 
                      onClick={handleEdit}
                      size="sm"
                      className="bg-fits-blue hover:bg-fits-blue/90"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Add Photo
                    </Button>
                  </div>
                }
              />
            </div>
            
            {/* Actions - Moved to top */}
            <div className="flex gap-2">
              <Button 
                onClick={handleEdit}
                className="flex-1"
                variant="default"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            
            {/* Content */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Brand
                </p>
                <p className="text-lg font-semibold">{item.brand_name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Product Name
                </p>
                <h2 className="text-xl font-bold">{item.product_name || "Untitled Item"}</h2>
              </div>
              
              {item.product_description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground">{item.product_description}</p>
                </div>
              )}
              
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {item.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span><span className="font-medium">Category:</span> {item.category}</span>
                  </div>
                )}
                
                {item.size && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span><span className="font-medium">Size:</span> {item.size}</span>
                  </div>
                )}
                
                {item.color && (
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span><span className="font-medium">Color:</span> {item.color}</span>
                  </div>
                )}
                
                {item.purchase_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span><span className="font-medium">Purchased:</span> {new Date(item.purchase_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Price Badge */}
              {item.price && (
                <div>
                  <Badge variant="default" className="font-semibold text-lg px-3 py-1">
                    {item.price}
                  </Badge>
                </div>
              )}

              {/* Order Number */}
              {item.order_number && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Order Number
                  </p>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {item.order_number}
                  </p>
                </div>
              )}
              
              {/* Metadata */}
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Added on {new Date(item.created_at).toLocaleDateString()}</span>
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

      {/* Edit Dialog */}
      {showEditDialog && (
        <EditClosetItemDialog
          item={item}
          onItemUpdated={handleItemUpdated}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
    </>
  );
}