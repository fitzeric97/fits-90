import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ItemForm } from "@/components/shared/ItemForm";

interface ItemFormData {
  title?: string;
  brandName?: string;
  price?: string;
  size?: string;
  color?: string;
  category?: string;
  description?: string;
  purchaseDate?: string;
}

interface AddLikeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLikeAdded?: () => void;
}

export function AddLikeDialog({ open, onOpenChange, onLikeAdded }: AddLikeDialogProps) {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [formData, setFormData] = useState<ItemFormData>({});
  const [loading, setLoading] = useState(false);

  const addManualLike = async () => {
    if (!url) {
      toast({
        title: "Missing Information",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use the edge function to extract product data and add to likes
      const { data, error } = await supabase.functions.invoke('add-url-to-likes', {
        body: {
          url: url,
          title: formData.title || undefined
        }
      });

      if (error) throw error;

      toast({
        title: "Like Added!",
        description: `${data.like.brand_name || 'Product'} saved to your likes`,
      });

      setUrl('');
      setFormData({});
      onOpenChange(false);
      onLikeAdded?.();
    } catch (error) {
      console.error('Error adding like:', error);
      toast({
        title: "Error",
        description: "Failed to add like",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setFormData({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Liked Item</DialogTitle>
          <DialogDescription>
            Save a product URL and additional details to your likes
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Product URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/product"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          
          <ItemForm
            initialData={formData}
            onDataChange={setFormData}
            showSizeColor={false}
            showPurchaseDate={false}
            brandRequired={false}
            showImageUpload={false}
          />
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={addManualLike} disabled={loading}>
              {loading ? "Adding..." : "Add Like"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}