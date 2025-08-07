import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddFitDialogProps {
  onFitAdded?: () => void;
}

export function AddFitDialog({ onFitAdded }: AddFitDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setCaption("");
    setInstagramUrl("");
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFitImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = fileName; // Simple filename without nested folders

    const { error: uploadError } = await supabase.storage
      .from('fits')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('fits')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (isInstagram: boolean) => {
    if (!isInstagram && !selectedFile) {
      toast({
        title: "Error",
        description: "Please select an image to upload.",
        variant: "destructive",
      });
      return;
    }

    if (isInstagram && !instagramUrl) {
      toast({
        title: "Error", 
        description: "Please enter an Instagram URL.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let imageUrl = instagramUrl;
      
      if (!isInstagram && selectedFile) {
        imageUrl = await uploadFitImage(selectedFile);
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add fits.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('fits')
        .insert([
          {
            user_id: user.id,
            image_url: imageUrl,
            caption: caption || null,
            is_instagram_url: isInstagram,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your fit has been added!",
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Fit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Fit</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </TabsTrigger>
            <TabsTrigger value="instagram">
              <Link className="h-4 w-4 mr-2" />
              Instagram URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div>
              <Label htmlFor="file">Select Image</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="caption">Caption (optional)</Label>
              <Textarea
                id="caption"
                placeholder="Describe your outfit..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <Button 
              onClick={() => handleSubmit(false)} 
              disabled={loading || !selectedFile}
              className="w-full"
            >
              {loading ? "Uploading..." : "Add Fit"}
            </Button>
          </TabsContent>
          
          <TabsContent value="instagram" className="space-y-4">
            <div>
              <Label htmlFor="instagram-url">Instagram URL</Label>
              <Input
                id="instagram-url"
                placeholder="https://instagram.com/p/..."
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="caption-ig">Caption (optional)</Label>
              <Textarea
                id="caption-ig"
                placeholder="Describe your outfit..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <Button 
              onClick={() => handleSubmit(true)} 
              disabled={loading || !instagramUrl}
              className="w-full"
            >
              {loading ? "Adding..." : "Add Fit"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}