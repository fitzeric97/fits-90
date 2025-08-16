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
  const [debugError, setDebugError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate the shareable link
  const shareLink = `${window.location.origin}/fits/${fit.id}`;

  // Helper function to convert image to data URL with CORS handling
  const getImageAsDataUrl = async (imgSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(dataUrl);
        } catch (error) {
          console.warn('CORS image conversion failed, using original:', error);
          resolve(imgSrc); // Fallback to original src
        }
      };
      
      img.onerror = () => {
        console.warn('Image load failed, using original src');
        resolve(imgSrc); // Fallback to original src
      };
      
      img.src = imgSrc;
    });
  };

  const generateAndShare = async () => {
    console.log('🎬 Starting story generation...', { 
      fitId: fit.id, 
      hasTaggedItems: taggedItems.length > 0,
      username,
      storyRefExists: !!storyRef.current 
    });
    
    setDebugError(null);
    
    if (!storyRef.current) {
      const error = 'Story ref is null - DOM element not found';
      console.error('❌', error);
      setDebugError(error);
      return;
    }
    
    setGenerating(true);
    
    try {
      console.log('📐 Story element dimensions:', {
        width: storyRef.current.offsetWidth,
        height: storyRef.current.offsetHeight,
        scrollWidth: storyRef.current.scrollWidth,
        scrollHeight: storyRef.current.scrollHeight
      });

      // Convert images to data URLs to avoid CORS issues
      const images = storyRef.current.querySelectorAll('img');
      console.log('🖼️ Found images:', images.length);
      
      const imageConversionPromises = Array.from(images).map(async (img, index) => {
        console.log(`📸 Processing Image ${index}:`, {
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
        
        try {
          const dataUrl = await getImageAsDataUrl(img.src);
          img.src = dataUrl;
          console.log(`✅ Image ${index} converted to data URL`);
        } catch (error) {
          console.warn(`⚠️ Image ${index} conversion failed, keeping original:`, error);
        }
      });

      await Promise.all(imageConversionPromises);
      console.log('✅ All images processed');

      // Wait a bit for DOM to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try multiple generation methods
      let dataUrl: string;
      let generationMethod = '';
      
      try {
        console.log('🎨 Attempting PNG generation...');
        dataUrl = await htmlToImage.toPng(storyRef.current, {
          width: 1080,
          height: 1920,
          pixelRatio: 1,
          backgroundColor: '#ffffff',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
          }
        });
        generationMethod = 'PNG';
        console.log('✅ PNG generation successful');
      } catch (pngError) {
        console.warn('PNG generation failed, trying JPEG:', pngError);
        
        try {
          dataUrl = await htmlToImage.toJpeg(storyRef.current, {
            quality: 0.95,
            width: 1080,
            height: 1920,
            pixelRatio: 1,
            backgroundColor: '#ffffff',
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left',
            }
          });
          generationMethod = 'JPEG';
          console.log('✅ JPEG generation successful');
        } catch (jpegError) {
          console.warn('JPEG generation failed, trying SVG:', jpegError);
          
          const svgDataUrl = await htmlToImage.toSvg(storyRef.current, {
            width: 1080,
            height: 1920,
            backgroundColor: '#ffffff',
          });
          
          // Convert SVG to canvas for final image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 1080;
          canvas.height = 1920;
          
          const svgImg = new Image();
          await new Promise((resolve, reject) => {
            svgImg.onload = resolve;
            svgImg.onerror = reject;
            svgImg.src = svgDataUrl;
          });
          
          ctx?.drawImage(svgImg, 0, 0);
          dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          generationMethod = 'SVG->Canvas';
          console.log('✅ SVG conversion successful');
        }
      }

      console.log(`✅ Story image generated successfully using ${generationMethod}, size:`, dataUrl.length);

      // Convert to blob for sharing
      console.log('🔄 Converting to blob...');
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'fit-story.jpg', { type: 'image/jpeg' });
      console.log('✅ Blob created:', { size: blob.size, type: blob.type });

      // Copy link to clipboard first
      console.log('📋 Copying link to clipboard...');
      try {
        await navigator.clipboard.writeText(shareLink);
        setLinkCopied(true);
        console.log('✅ Link copied successfully');
      } catch (clipboardError) {
        console.warn('Clipboard copy failed:', clipboardError);
      }
      
      console.log('📱 Checking share capabilities...', { 
        hasNavigatorShare: !!navigator.share,
        canShareFiles: navigator.share ? navigator.canShare({ files: [file] }) : false
      });
      
      // Progressive fallback for sharing
      if (navigator.share && navigator.canShare({ files: [file] })) {
        console.log('📤 Using native share...');
        try {
          await navigator.share({
            files: [file],
            title: 'Share to Instagram Story',
          });
          
          toast({
            title: "Shared successfully!",
            description: "Link copied - add it as a link sticker in your story",
          });
        } catch (shareError) {
          console.warn('Native share failed, using download fallback:', shareError);
          downloadFallback(dataUrl);
        }
      } else {
        console.log('💾 Using fallback download...');
        downloadFallback(dataUrl);
      }
      
      console.log('🎉 Story generation completed successfully!');
      
    } catch (error) {
      console.error('💥 Story generation failed:', error);
      
      const errorDetails = {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
        toString: String(error).substring(0, 200)
      };
      
      console.error('🔍 Error details:', errorDetails);
      setDebugError(JSON.stringify(errorDetails, null, 2));
      
      // Provide helpful error messages and recovery options
      let errorMessage = "Story generation failed. ";
      let recoveryAction = "Please try again or contact support.";
      
      if (error instanceof Error) {
        if (error.message.includes('tainted') || error.message.includes('CORS')) {
          errorMessage = "Image security restrictions detected. ";
          recoveryAction = "Try refreshing the page or using different images.";
        } else if (error.message.includes('timeout') || error.message.includes('load')) {
          errorMessage = "Images failed to load properly. ";
          recoveryAction = "Check your internet connection and try again.";
        } else if (error.message.includes('canvas') || error.message.includes('context')) {
          errorMessage = "Browser canvas error. ";
          recoveryAction = "Try using a different browser or clear browser cache.";
        } else if (error.message.includes('memory') || error.message.includes('quota')) {
          errorMessage = "Browser memory issue. ";
          recoveryAction = "Close other tabs and try again.";
        }
      }
      
      // Offer simple link sharing as ultimate fallback
      try {
        await navigator.clipboard.writeText(shareLink);
        toast({
          title: "Fallback: Link Copied",
          description: "Image generation failed, but link is copied. Share this link instead!",
          variant: "destructive"
        });
      } catch (clipboardError) {
        toast({
          title: "Error",
          description: errorMessage + recoveryAction,
          variant: "destructive"
        });
      }
    } finally {
      setGenerating(false);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const downloadFallback = (dataUrl: string) => {
    // Fallback: Download image and provide instructions
    const link = document.createElement('a');
    link.download = 'fit-story.jpg';
    link.href = dataUrl;
    link.click();
    
    // Try to open Instagram app
    setTimeout(() => {
      window.open('instagram://story-camera', '_blank');
    }, 1000);
    
    toast({
      title: "Image downloaded & link copied!",
      description: "Open Instagram, select the image, and add the link as a sticker",
    });
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
      {/* Debug Error Display */}
      {debugError && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg max-h-64 overflow-auto">
          <h3 className="font-bold mb-2">🐛 Debug Error:</h3>
          <pre className="text-xs whitespace-pre-wrap font-mono">{debugError}</pre>
          <button 
            onClick={() => setDebugError(null)}
            className="mt-2 px-2 py-1 bg-red-700 rounded text-xs"
          >
            Close
          </button>
        </div>
      )}

      {/* Hidden Story Template - This gets converted to image */}
      <div 
        ref={storyRef}
        className="fixed top-0 left-[-2000px] opacity-0 pointer-events-none bg-gradient-to-br from-background to-card"
        style={{ 
          width: '1080px', 
          height: '1920px',
          position: 'fixed',
          zIndex: -1
        }}
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