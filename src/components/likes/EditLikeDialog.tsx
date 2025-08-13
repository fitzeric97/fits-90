import { useState } from "react";
import { Edit, Upload, X, Shirt, User, Square, Scissors, Crown, Watch, Footprints, Sparkles, Archive, Gem, ShirtIcon, Package, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
}

export function EditLikeDialog({ like, onItemUpdated }: EditLikeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [title, setTitle] = useState(like.title);
  const [brandName, setBrandName] = useState(like.brand_name || "");
  const [price, setPrice] = useState(like.price || "");
  const [category, setCategory] = useState(like.category || "none");
  const [description, setDescription] = useState(like.description || "");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { toast } = useToast();

  const resetForm = () => {
    setTitle(like.title);
    setBrandName(like.brand_name || "");
    setPrice(like.price || "");
    setCategory(like.category || "none");
    setDescription(like.description || "");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Liked Item</DialogTitle>
          <DialogDescription>
            Update the details of your liked item
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Like"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}