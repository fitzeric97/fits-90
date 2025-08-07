import { useState } from "react";
import { Edit, Calendar, Package, Palette, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClosetItem {
  id: string;
  product_name: string | null;
  brand_name: string;
  product_description: string | null;
  price: string | null;
  size: string | null;
  color: string | null;
  category: string | null;
  purchase_date: string | null;
}

interface EditClosetItemDialogProps {
  item: ClosetItem;
  onItemUpdated: () => void;
}

export function EditClosetItemDialog({ item, onItemUpdated }: EditClosetItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [productName, setProductName] = useState(item.product_name || "");
  const [brandName, setBrandName] = useState(item.brand_name);
  const [description, setDescription] = useState(item.product_description || "");
  const [price, setPrice] = useState(item.price || "");
  const [size, setSize] = useState(item.size || "");
  const [color, setColor] = useState(item.color || "");
  const [category, setCategory] = useState(item.category || "");
  const [purchaseDate, setPurchaseDate] = useState(
    item.purchase_date ? new Date(item.purchase_date).toISOString().split('T')[0] : ""
  );
  
  const { toast } = useToast();

  const resetForm = () => {
    setProductName(item.product_name || "");
    setBrandName(item.brand_name);
    setDescription(item.product_description || "");
    setPrice(item.price || "");
    setSize(item.size || "");
    setColor(item.color || "");
    setCategory(item.category || "");
    setPurchaseDate(
      item.purchase_date ? new Date(item.purchase_date).toISOString().split('T')[0] : ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      if (!brandName.trim()) {
        toast({
          title: "Error",
          description: "Brand name is required",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('closet_items')
        .update({
          product_name: productName.trim() || null,
          brand_name: brandName.trim(),
          product_description: description.trim() || null,
          price: price.trim() || null,
          size: size.trim() || null,
          color: color.trim() || null,
          category: category || null,
          purchase_date: purchaseDate ? new Date(purchaseDate).toISOString() : null,
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item updated successfully!",
      });

      setOpen(false);
      onItemUpdated();
    } catch (error) {
      console.error('Error updating closet item:', error);
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Closet Item</DialogTitle>
          <DialogDescription>
            Update the details of your closet item
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
          {/* Common fields matching AddClosetItemDialog structure */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                placeholder="Product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand</Label>
              <Input
                id="brandName"
                placeholder="Brand name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                placeholder="$99.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  <SelectItem value="shirts">Shirts</SelectItem>
                  <SelectItem value="t-shirts">T-Shirts</SelectItem>
                  <SelectItem value="polo-shirts">Polo Shirts</SelectItem>
                  <SelectItem value="button-shirts">Button Shirts</SelectItem>
                  <SelectItem value="jeans">Jeans</SelectItem>
                  <SelectItem value="pants">Pants</SelectItem>
                  <SelectItem value="shorts">Shorts</SelectItem>
                  <SelectItem value="jackets">Jackets</SelectItem>
                  <SelectItem value="sweaters">Sweaters</SelectItem>
                  <SelectItem value="hoodies">Hoodies</SelectItem>
                  <SelectItem value="activewear">Activewear</SelectItem>
                  <SelectItem value="shoes">Shoes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                placeholder="M, L, 32, etc."
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="Blue, Red, etc."
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about this item..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
            >
              {loading ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}