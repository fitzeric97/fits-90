import { useState } from "react";
import { Plus, Upload, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

interface AddClosetItemDialogProps {
  onItemAdded: () => void;
}

export function AddClosetItemDialog({ onItemAdded }: AddClosetItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("url");
  
  // Form data
  const [url, setUrl] = useState("");
  const [formData, setFormData] = useState<ItemFormData>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { toast } = useToast();

  const resetForm = () => {
    setUrl("");
    setFormData({});
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

    // Validate form BEFORE setting loading state
    if (activeTab === "url" && !url) {
      toast({
        title: "Error",
        description: "Please enter a product URL",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "upload") {
      if (!selectedImage) {
        toast({
          title: "Error",
          description: "Please upload an image",
          variant: "destructive",
        });
        return;
      }
      
      // For upload tab, require brand name since we can't extract it
      if (!formData.brandName?.trim()) {
        toast({
          title: "Error",
          description: "Please enter the brand name",
          variant: "destructive",
        });
        return;
      }
    }

    // All validation passed, now set loading state
    setLoading(true);

    try {

      // Prepare request data
      const requestData: any = {
        title: formData.title || undefined,
        brand_name: formData.brandName || undefined,
        description: formData.description || undefined,
        price: formData.price || undefined,
        size: formData.size || undefined,
        color: formData.color || undefined,
        category: formData.category || undefined,
        purchase_date: formData.purchaseDate || undefined,
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

          {/* ItemForm for common fields */}
          <div className="mt-6">
            <ItemForm
              initialData={formData}
              onDataChange={setFormData}
              onImageSelect={activeTab === "upload" ? setSelectedImage : undefined}
              imagePreview={activeTab === "upload" ? imagePreview : null}
              onRemoveImage={() => {
                setSelectedImage(null);
                setImagePreview(null);
              }}
              showSizeColor={true}
              showPurchaseDate={true}
              brandRequired={activeTab === "upload"}
              showImageUpload={false}
            />
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