import { useState } from "react";
import { Plus, Upload, Link as LinkIcon, Edit, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageEditor } from "./ImageEditor";
import { InstagramPhotoBrowser } from "./InstagramPhotoBrowser";
import { InstagramUrlImport } from "./InstagramUrlImport";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddFitDialogProps {
  onFitAdded?: () => void;
}

export function AddFitDialog({ onFitAdded }: AddFitDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [showInstagramBrowser, setShowInstagramBrowser] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  
  // Form data
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editedImageBlob, setEditedImageBlob] = useState<Blob | null>(null);
  
  const { toast } = useToast();

  const resetForm = () => {
    setImageUrl("");
    setCaption("");
    setSelectedImage(null);
    setImagePreview(null);
    setEditedImageBlob(null);
    setShowImageEditor(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setShowImageEditor(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageEditSave = (blob: Blob) => {
    setEditedImageBlob(blob);
    setShowImageEditor(false);
    toast({
      title: "Image edited",
      description: "Your image has been cropped and positioned. Ready to post!",
    });
  };

  const handleImageEditCancel = () => {
    setShowImageEditor(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleInstagramPhotoSelect = (media: any) => {
    setImageUrl(media.media_url);
    setShowInstagramBrowser(false);
    toast({
      title: "Instagram photo selected",
      description: "Your Instagram photo is ready to be shared as a fit!",
    });
  };

  const uploadImageToStorage = async (file: Blob): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const fileName = `fit-${Date.now()}.jpg`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fits')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('fits')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = imageUrl;

      // If we have an edited image, upload it
      if (editedImageBlob) {
        const uploadedUrl = await uploadImageToStorage(editedImageBlob);
        if (!uploadedUrl) {
          toast({
            title: "Upload failed",
            description: "Failed to upload your edited image. Please try again.",
            variant: "destructive",
          });
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      // Validate we have an image
      if (!finalImageUrl) {
        toast({
          title: "Error",
          description: "Please provide an image URL or upload an image",
          variant: "destructive",
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to add fits",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('fits')
        .insert({
          user_id: session.user.id,
          image_url: finalImageUrl,
          caption: caption.trim() || null,
          is_instagram_url: finalImageUrl.includes('instagram.com'),
        });

      if (error) throw error;

      toast({
        title: "Fit added!",
        description: "Your fit has been shared successfully",
      });

      resetForm();
      setOpen(false);
      onFitAdded?.();
    } catch (error) {
      console.error('Error adding fit:', error);
      toast({
        title: "Error",
        description: "Failed to add fit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Fit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Fit</DialogTitle>
            <DialogDescription>
              Upload a photo or share an Instagram post of your outfit
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </TabsTrigger>
                <TabsTrigger value="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-upload">Upload Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-6">
                    {editedImageBlob ? (
                      <div className="space-y-4">
                        <img
                          src={URL.createObjectURL(editedImageBlob)}
                          alt="Edited preview"
                          className="max-h-48 mx-auto rounded-lg object-cover"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowImageEditor(true)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Again
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditedImageBlob(null);
                              setSelectedImage(null);
                              setImagePreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : imagePreview && !showImageEditor ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg object-cover"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowImageEditor(true)}
                          className="flex items-center gap-1 mx-auto"
                        >
                          <Edit className="w-4 h-4" />
                          Edit & Crop
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload your fit photo to edit and crop it perfectly
                        </p>
                        <Input
                          id="image-upload"
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

              <TabsContent value="instagram" className="space-y-4">
                <InstagramUrlImport 
                  onUrlImport={(url) => {
                    setImageUrl(url);
                    toast({
                      title: "Instagram photo imported",
                      description: "Your Instagram photo is ready to be shared!",
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input
                    id="image-url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea
                  id="caption"
                  placeholder="Describe your fit..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || (!imageUrl && !editedImageBlob)}
                  className="flex-1"
                >
                  {loading ? "Sharing..." : "Share Fit"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Editor Dialog */}
      {showImageEditor && imagePreview && (
        <Dialog open={showImageEditor} onOpenChange={setShowImageEditor}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <ImageEditor
              imageUrl={imagePreview}
              onSave={handleImageEditSave}
              onCancel={handleImageEditCancel}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Instagram Browser Dialog */}
      {showInstagramBrowser && (
        <Dialog open={showInstagramBrowser} onOpenChange={setShowInstagramBrowser}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <InstagramPhotoBrowser
              onPhotoSelect={handleInstagramPhotoSelect}
              onClose={() => setShowInstagramBrowser(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}