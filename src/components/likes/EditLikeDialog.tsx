import { useState } from "react";
import { Edit, Upload, X, Shirt, User, Square, Scissors, Crown, Watch, Footprints, Sparkles, Archive, Gem, ShirtIcon, Package, Dumbbell, ShoppingBag, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Like {
  id: string;
  title: string;
  brand_name: string | null;
  price: string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  uploaded_image_url: string | null;
}

// Category configuration with icons and display names (same as Closet)
const categoryConfig = {
  'hats': { icon: Archive, label: 'Hats', color: 'text-blue-600' },
  'necklaces': { icon: Gem, label: 'Necklaces', color: 'text-pink-600' },
  'fragrances': { icon: Sparkles, label: 'Fragrances', color: 'text-purple-600' },
  'shirts': { icon: Shirt, label: 'Shirts', color: 'text-blue-600' },
  't-shirts': { icon: Shirt, label: 'T-Shirts', color: 'text-green-600' },
  'polo-shirts': { icon: ShirtIcon, label: 'Polo Shirts', color: 'text-purple-600' },
  'button-shirts': { icon: Shirt, label: 'Button Shirts', color: 'text-indigo-600' },
  'sweaters': { icon: Package, label: 'Sweaters', color: 'text-red-600' },
  'hoodies': { icon: ShirtIcon, label: 'Hoodies', color: 'text-orange-600' },
  'jackets': { icon: Archive, label: 'Jackets', color: 'text-gray-800' },
  'activewear': { icon: Dumbbell, label: 'Activewear', color: 'text-green-700' },
  'pants': { icon: Scissors, label: 'Pants', color: 'text-gray-600' },
  'jeans': { icon: Scissors, label: 'Jeans', color: 'text-blue-800' },
  'shorts': { icon: Square, label: 'Shorts', color: 'text-yellow-600' },
  'shoes': { icon: Footprints, label: 'Shoes', color: 'text-brown-600' },
  'boots': { icon: Footprints, label: 'Boots', color: 'text-amber-700' }
};

// Head to Toe ordering - from top of body to bottom
const headToToeOrder = [
  'hats',
  'necklaces', 
  'fragrances',
  'shirts',
  't-shirts',
  'polo-shirts', 
  'button-shirts',
  'sweaters',
  'hoodies',
  'jackets',
  'activewear',
  'pants',
  'jeans', 
  'shorts',
  'shoes',
  'boots'
];

// Get ordered categories for dropdown
const orderedCategories = headToToeOrder.map(key => ({
  key,
  label: categoryConfig[key as keyof typeof categoryConfig]?.label || key
}));

interface EditLikeDialogProps {
  like: Like;
  onItemUpdated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditLikeDialog({ like, onItemUpdated, open: externalOpen, onOpenChange: externalOnOpenChange }: EditLikeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMovingToCloset, setIsMovingToCloset] = useState(false);
  
  // Use external open state if provided, otherwise use internal
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  
  // Form data - existing fields
  const [title, setTitle] = useState(like.title);
  const [brandName, setBrandName] = useState(like.brand_name || "");
  const [price, setPrice] = useState(like.price || "");
  const [category, setCategory] = useState(like.category || "none");
  const [description, setDescription] = useState(like.description || "");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Closet-specific fields
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [orderNumber, setOrderNumber] = useState("");

  // Check if there are changes
  const hasChanges = 
    title !== like.title ||
    brandName !== (like.brand_name || "") ||
    price !== (like.price || "") ||
    category !== (like.category || "none") ||
    description !== (like.description || "") ||
    selectedImage !== null ||
    (isMovingToCloset && (size !== "" || color !== "" || purchaseDate !== undefined || orderNumber !== ""));
  
  const { toast } = useToast();

  const resetForm = () => {
    setTitle(like.title);
    setBrandName(like.brand_name || "");
    setPrice(like.price || "");
    setCategory(like.category || "none");
    setDescription(like.description || "");
    setSelectedImage(null);
    setImagePreview(null);
    setIsMovingToCloset(false);
    setSize("");
    setColor("");
    setPurchaseDate(undefined);
    setOrderNumber("");
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

  const moveToCloset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only require brand name
      if (!brandName.trim()) {
        toast({
          title: "Error",
          description: "Brand name is required",
          variant: "destructive",
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to move items to closet",
          variant: "destructive",
        });
        return;
      }

      let uploadedImageUrl = like.uploaded_image_url;

      // Upload new image if selected
      if (selectedImage) {
        uploadedImageUrl = await uploadImage(selectedImage, session.user.id);
      }

      // Start transaction: Insert into closet_items, then delete from user_likes
      const { error: insertError } = await supabase
        .from('closet_items')
        .insert({
          user_id: session.user.id,
          product_name: title.trim(),
          brand_name: brandName.trim(),
          price: price.trim() || null,
          category: category === "none" ? null : category,
          product_description: description.trim() || null,
          product_image_url: like.image_url,
          uploaded_image_url: uploadedImageUrl,
          size: size.trim() || null,
          color: color.trim() || null,
          purchase_date: purchaseDate ? purchaseDate.toISOString() : null,
          order_number: orderNumber.trim() || null,
        });

      if (insertError) throw insertError;

      // If closet insertion succeeded, delete from likes
      const { error: deleteError } = await supabase
        .from('user_likes')
        .delete()
        .eq('id', like.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: "Item moved to your closet successfully!",
      });

      setOpen(false);
      onItemUpdated();
    } catch (error) {
      console.error('Error moving item to closet:', error);
      toast({
        title: "Error",
        description: "Failed to move item to closet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isMovingToCloset) {
      await moveToCloset(e);
      return;
    }

    setLoading(true);

    try {
      // Only require brand name
      if (!brandName.trim()) {
        toast({
          title: "Error",
          description: "Brand name is required",
          variant: "destructive",
        });
        return;
      }

      let uploadedImageUrl = like.uploaded_image_url;

      // Upload new image if selected
      if (selectedImage) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          uploadedImageUrl = await uploadImage(selectedImage, session.user.id);
        }
      }

      const { error } = await supabase
        .from('user_likes')
        .update({
          title: title.trim(),
          brand_name: brandName.trim() || null,
          price: price.trim() || null,
          category: category === "none" ? null : category,
          description: description.trim() || null,
          uploaded_image_url: uploadedImageUrl,
        })
        .eq('id', like.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Like updated successfully!",
      });

      setOpen(false);
      onItemUpdated();
    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
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
          onClick={(e) => e.stopPropagation()}
          className="h-8 w-8 p-0 bg-background/90 hover:bg-background"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{isMovingToCloset ? "Move to Closet" : "Edit Liked Item"}</DialogTitle>
          {hasChanges && (
            <Button type="submit" form="edit-form" disabled={loading} size="sm" className="mt-2 w-fit">
              {loading 
                ? (isMovingToCloset ? "Moving..." : "Saving...") 
                : (isMovingToCloset ? "Move to Closet" : "Save")
              }
            </Button>
          )}
        </DialogHeader>

        <form id="edit-form" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
          {/* Common fields matching AddClosetItemDialog structure */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="title">Product Name</Label>
              <Input
                id="title"
                placeholder="Product name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand *</Label>
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
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      No category
                    </div>
                  </SelectItem>
                  {orderedCategories.map((category) => {
                    const config = categoryConfig[category.key as keyof typeof categoryConfig];
                    const IconComponent = config?.icon || Shirt;
                    return (
                      <SelectItem key={category.key} value={category.key}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
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

            {/* Closet-specific fields - only show when moving to closet */}
            {isMovingToCloset && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Ownership Details</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    placeholder="e.g., M, L, 32x30"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="e.g., Navy Blue, Black"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !purchaseDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {purchaseDate ? format(purchaseDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border shadow-lg z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={purchaseDate}
                        onSelect={setPurchaseDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number (Optional)</Label>
                  <Input
                    id="orderNumber"
                    placeholder="e.g., #ORDER123456"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                  />
                </div>
              </div>
            )}

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
                ) : like.uploaded_image_url ? (
                  <div className="space-y-4">
                    <img
                      src={like.uploaded_image_url}
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
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            
            {!isMovingToCloset && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsMovingToCloset(true)}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Move to Closet
              </Button>
            )}
            
            {isMovingToCloset && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsMovingToCloset(false)}
                disabled={loading}
              >
                Back to Edit
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}