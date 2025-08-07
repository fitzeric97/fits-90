import { useState } from "react";
import { Edit } from "lucide-react";
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
}

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
  const [category, setCategory] = useState(like.category || "");
  const [description, setDescription] = useState(like.description || "");
  
  const { toast } = useToast();

  const resetForm = () => {
    setTitle(like.title);
    setBrandName(like.brand_name || "");
    setPrice(like.price || "");
    setCategory(like.category || "");
    setDescription(like.description || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!title.trim()) {
        toast({
          title: "Error",
          description: "Product name is required",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_likes')
        .update({
          title: title.trim(),
          brand_name: brandName.trim() || null,
          price: price.trim() || null,
          category: category || null,
          description: description.trim() || null,
        })
        .eq('id', like.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Like updated successfully!",
      });

      resetForm();
      setOpen(false);
      onItemUpdated();
    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
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
          className="absolute top-3 left-12 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 hover:bg-background"
          onClick={(e) => e.stopPropagation()}
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand</Label>
              <Input
                id="brandName"
                placeholder="Brand name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
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
                  <SelectItem value="">No category</SelectItem>
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