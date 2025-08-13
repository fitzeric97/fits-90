import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Instagram, ExternalLink, Loader2 } from "lucide-react";

interface InstagramMedia {
  id: string;
  media_type: string;
  media_url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

interface InstagramPhotoBrowserProps {
  onPhotoSelect: (media: InstagramMedia) => void;
  onClose: () => void;
}

export function InstagramPhotoBrowser({ onPhotoSelect, onClose }: InstagramPhotoBrowserProps) {
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    checkInstagramConnection();
  }, [user]);

  const checkInstagramConnection = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('instagram_connections')
        .select('access_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.access_token) {
        setAccessToken(data.access_token);
        fetchInstagramMedia(data.access_token);
      } else {
        generateAuthUrl();
      }
    } catch (error) {
      console.error('Error checking Instagram connection:', error);
    }
  };

  const generateAuthUrl = () => {
    // Note: In production, you'd get this from your backend
    // For now, we'll need to configure this properly with the Instagram app
    const clientId = 'NEED_TO_CONFIGURE'; // This will be set when Instagram app is configured
    const redirectUri = encodeURIComponent(`${window.location.origin}/instagram-callback`);
    const scope = 'user_profile,user_media';
    
    const url = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    setAuthUrl(url);
  };

  const fetchInstagramMedia = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-api', {
        body: {
          action: 'get_media',
          access_token: token,
        },
      });

      if (error) throw error;

      setMedia(data.data || []);
    } catch (error: any) {
      console.error('Error fetching Instagram media:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your Instagram photos. Please try reconnecting.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (selectedMedia: InstagramMedia) => {
    onPhotoSelect(selectedMedia);
    onClose();
  };

  const openInstagramApp = () => {
    // Try to open Instagram app first, fallback to web
    const instagramAppUrl = 'instagram://user?username=self';
    const instagramWebUrl = 'https://www.instagram.com/';
    
    // Create a temporary link to try opening the app
    const tempLink = document.createElement('a');
    tempLink.href = instagramAppUrl;
    tempLink.click();
    
    // Fallback to web after a short delay if app doesn't open
    setTimeout(() => {
      window.open(instagramWebUrl, '_blank');
    }, 1000);
  };

  if (!accessToken && authUrl) {
    return (
      <div className="space-y-6 p-6 text-center">
        <div className="space-y-2">
          <Instagram className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">Import from Instagram</h3>
          <p className="text-sm text-muted-foreground">
            Choose how you'd like to import your Instagram photos
          </p>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={openInstagramApp}
            variant="outline"
            className="w-full"
          >
            <Instagram className="h-4 w-4 mr-2" />
            Open Instagram App
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
          
          <div className="text-xs text-muted-foreground">
            Copy the image URL from Instagram and paste it in the "URL" tab
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>
          
          <Button
            onClick={() => window.open(authUrl, '_blank')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Instagram className="h-4 w-4 mr-2" />
            Connect Instagram Account
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
          
          <div className="text-xs text-muted-foreground">
            Full integration - browse and import photos directly
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your Instagram photos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select an Instagram Photo</h3>
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
      
      {media.length === 0 ? (
        <div className="text-center py-8">
          <Instagram className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No photos found in your Instagram account</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {media
            .filter(item => item.media_type === 'IMAGE')
            .map((item) => (
              <div
                key={item.id}
                className="aspect-square relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                onClick={() => handlePhotoSelect(item)}
              >
                <img
                  src={item.media_url}
                  alt={item.caption || 'Instagram photo'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" className="bg-white/90 text-black hover:bg-white">
                      Select
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}