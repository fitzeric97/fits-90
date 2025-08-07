import { useState } from "react";
import { Plus, Upload, Link as LinkIcon, Calendar, Package, Palette, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddClosetItemDialogProps {
  onItemAdded: () => void;
}

export function AddClosetItemDialog({ onItemAdded }: AddClosetItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("url");
  
  // Form data
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [category, setCategory] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { toast } = useToast();

  const resetForm = () => {
    setUrl("");
    setTitle("");
    setBrandName("");
    setDescription("");
    setPrice("");
    setSize("");
    setColor("");
    setCategory("");
    setPurchaseDate("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (activeTab === "url" && !url) {
        toast({
          title: "Error",
          description: "Please enter a product URL",
          variant: "destructive",
        });
        return;
      }

      if (activeTab === "upload" && !selectedImage && !title) {
        toast({
          title: "Error",
          description: "Please upload an image or enter a product title",
          variant: "destructive",
        });
        return;
      }

      // Prepare request data
      const requestData: any = {
        title: title || undefined,
        brand_name: brandName || undefined,
        description: description || undefined,
        price: price || undefined,
        size: size || undefined,
        color: color || undefined,
        category: category || undefined,
        purchase_date: purchaseDate || undefined,
      };

      if (activeTab === "url") {
        requestData.url = url;
      }

      // Handle image upload
      if (selectedImage) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          requestData.uploaded_image = e.target?.result as string;
          await submitToCloset(requestData);
        };
        reader.readAsDataURL(selectedImage);
      } else {
        if (activeTab === "url") {
          requestData.url = url;
        }
        await submitToCloset(requestData);
      }

    } catch (error) {
      console.error('Error adding closet item:', error);
      toast({
        title: "Error",
        description: "Failed to add item to closet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitToCloset = async (requestData: any) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      toast({
        title: "Error",
        description: "Please sign in to add items to your closet",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase.functions.invoke('add-item-to-closet', {
      body: requestData,
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
      },
    });

    if (error) {
      console.error('Error calling edge function:', error);
      toast({
        title: "Error",
        description: "Failed to add item to closet",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Item added to your closet!",
    });

    resetForm();
    setOpen(false);
    onItemAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Item to Closet</DialogTitle>
          <DialogDescription>
            Add a new item to your closet by URL or upload a photo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Add by URL
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Photo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Upload Image</Label>
                <div className="border-2 border-dashed rounded-lg p-6">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop an image
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
            </TabsContent>
          </Tabs>

          {/* Common fields for both tabs */}
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
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="tops">Tops</SelectItem>
                  <SelectItem value="bottoms">Bottoms</SelectItem>
                  <SelectItem value="footwear">Footwear</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="swimwear">Swimwear</SelectItem>
                  <SelectItem value="undergarments">Undergarments</SelectItem>
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
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add to Closet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}