import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Instagram, ExternalLink, Copy, Check } from "lucide-react";

interface InstagramUrlImportProps {
  onUrlImport: (url: string) => void;
}

export function InstagramUrlImport({ onUrlImport }: InstagramUrlImportProps) {
  const [instagramUrl, setInstagramUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const openInstagramApp = () => {
    // Try to open Instagram app to user's own profile
    const instagramAppUrl = 'instagram://user'; // Opens to user's own profile
    const instagramWebUrl = 'https://www.instagram.com/';
    
    // For mobile devices, try app first
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Create a hidden iframe to test if the app opens
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = instagramAppUrl;
      document.body.appendChild(iframe);
      
      // Fallback to web if app doesn't open
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(instagramWebUrl, '_blank');
      }, 1500);
    } else {
      // For desktop, open web version
      window.open(instagramWebUrl, '_blank');
    }
  };

  const extractImageUrl = async (url: string): Promise<string | null> => {
    try {
      // This is a simplified version - in reality you'd need a service to extract the image
      // For now, we'll accept direct image URLs
      if (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') || url.includes('.webp')) {
        return url;
      }
      
      // For Instagram post URLs, we'd need to use Instagram API or a scraping service
      if (url.includes('instagram.com/p/')) {
        toast({
          title: "Instagram Post Detected",
          description: "Please copy the direct image URL from the post instead",
          variant: "destructive",
        });
        return null;
      }
      
      return url; // Assume it's a valid image URL
    } catch (error) {
      return null;
    }
  };

  const handleImport = async () => {
    if (!instagramUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await extractImageUrl(instagramUrl);
      if (imageUrl) {
        onUrlImport(imageUrl);
        setInstagramUrl("");
        toast({
          title: "Image Imported",
          description: "Your image is ready to be shared as a fit!",
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Please check the URL and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <Button
          onClick={openInstagramApp}
          variant="outline"
          className="w-full"
        >
          <Instagram className="h-4 w-4 mr-2" />
          Open Instagram
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>1. Find the photo you want to import</p>
          <p>2. Tap the three dots → "Copy Link"</p>
          <p>3. Paste the link below</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagram-url">Instagram Photo URL</Label>
        <div className="flex gap-2">
          <Input
            id="instagram-url"
            type="url"
            placeholder="Paste Instagram link here..."
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
          />
          <Button
            onClick={handleImport}
            disabled={loading || !instagramUrl.trim()}
            size="sm"
          >
            {loading ? "Importing..." : "Import"}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <p><strong>Tip:</strong> You can also paste direct image URLs from any source</p>
      </div>
    </div>
  );
}