import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Calendar, Package, Palette, Ruler, Upload, X } from "lucide-react";
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
  product_image_url: string | null;
  uploaded_image_url: string | null;
}

interface EditClosetItemDialogProps {
  item: ClosetItem;
  onItemUpdated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditClosetItemDialog({ item, onItemUpdated, open: externalOpen, onOpenChange: externalOnOpenChange }: EditClosetItemDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Use external open state if provided, otherwise use internal
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }
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

      let uploadedImageUrl = item.uploaded_image_url;

      // Upload new image if selected
      if (selectedImage) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          uploadedImageUrl = await uploadImage(selectedImage, session.user.id);
        }
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
          uploaded_image_url: uploadedImageUrl,
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item updated successfully!",
      });

      setOpen(false);
      onItemUpdated();
      navigate('/closet');
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
                  <SelectItem value="hats">Hats</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
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

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Upload Photo (fallback when web image doesn't load)</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-32 mx-auto rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : item.uploaded_image_url ? (
                  <div className="space-y-4">
                    <img
                      src={item.uploaded_image_url}
                      alt="Current uploaded"
                      className="max-h-32 mx-auto rounded-lg object-cover"
                    />
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">Current uploaded image</p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload a photo as backup
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
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