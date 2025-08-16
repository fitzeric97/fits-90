import { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { Share2, Instagram, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface StoryImageGeneratorProps {
  fit: {
    id: string;
    image_url: string;
    caption?: string;
    created_at: string;
  };
  taggedItems: Array<{
    id: string;
    product_name: string;
    brand_name: string;
    product_image_url?: string;
    price?: string;
  }>;
  username?: string;
}

export function StoryImageGenerator({ fit, taggedItems, username }: StoryImageGeneratorProps) {
  const storyRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { toast } = useToast();

  // Generate the shareable link
  const shareLink = `${window.location.origin}/fits/${fit.id}`;

  const generateAndShare = async () => {
    if (!storyRef.current) return;
    
    setGenerating(true);
    
    try {
      // Generate high-quality image
      const dataUrl = await htmlToImage.toJpeg(storyRef.current, {
        quality: 0.95,
        width: 1080,
        height: 1920,
        pixelRatio: 2,
      });

      // Convert to blob for sharing
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'fit-story.jpg', { type: 'image/jpeg' });

      // Copy link to clipboard first
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      
      // Check if we can share (mobile only)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Share to Instagram Story',
        });
        
        toast({
          title: "Link copied!",
          description: "Paste it as a link sticker in your story",
        });
      } else {
        // Fallback: Download image and open Instagram
        const link = document.createElement('a');
        link.download = 'fit-story.jpg';
        link.href = dataUrl;
        link.click();
        
        // Try to open Instagram app
        window.open('instagram://story-camera', '_blank');
        
        toast({
          title: "Image downloaded & link copied!",
          description: "Open Instagram, select the image from gallery, and add link sticker",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Error",
        description: "Could not generate story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
    toast({
      title: "Link copied!",
      description: "Paste it in your Instagram story",
    });
  };

  return (
    <>
      {/* Hidden Story Template - This gets converted to image */}
      <div 
        ref={storyRef}
        className="fixed -left-[9999px] bg-gradient-to-br from-background to-card"
        style={{ width: 1080, height: 1920 }}
      >
        <div className="relative w-full h-full p-12 flex flex-col">
          {/* App Logo/Branding */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
                alt="Fits" 
                className="h-16 w-16"
              />
              <div>
                <h2 className="text-3xl font-bold text-foreground">Fits</h2>
                <p className="text-muted-foreground text-lg">@{username || 'user'}</p>
              </div>
            </div>
          </div>

          {/* Main Fit Image */}
          <div className="flex-1 flex items-center justify-center mb-8">
            <div className="relative">
              <img 
                src={fit.image_url} 
                alt="Fit"
                className="max-w-full max-h-[800px] object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </div>

          {/* Caption */}
          {fit.caption && (
            <div className="mb-8">
              <p className="text-foreground text-xl text-center font-medium">
                "{fit.caption}"
              </p>
            </div>
          )}

          {/* Tagged Items */}
          {taggedItems.length > 0 && (
            <div className="bg-white/90 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-foreground text-2xl font-bold mb-6 text-center">Tagged Items</h3>
              <div className="grid grid-cols-2 gap-6">
                {taggedItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-lg">
                    {item.product_image_url && (
                      <img 
                        src={item.product_image_url} 
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-lg truncate">
                        {item.brand_name}
                      </p>
                      <p className="text-muted-foreground text-base truncate">
                        {item.product_name}
                      </p>
                      {item.price && (
                        <p className="text-foreground font-bold text-lg">
                          {item.price}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {taggedItems.length > 4 && (
                <p className="text-center text-muted-foreground text-lg mt-4">
                  +{taggedItems.length - 4} more items
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-lg">
              View full details at fits.app
            </p>
          </div>
        </div>
      </div>

      {/* Visible UI */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={generateAndShare}
          disabled={generating}
          size="sm"
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-3 py-1 h-8 text-xs"
        >
          <Instagram className="w-3 h-3 mr-1" />
          {generating ? 'Generating...' : 'Story'}
        </Button>
      </div>
    </>
  );
}