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

  // Helper function to convert image to data URL with CORS handling and fallbacks
  const getImageAsDataUrl = async (imgSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Longer timeout for slow loading images
      const timeout = setTimeout(() => {
        console.warn('⏰ Image load timeout, using original:', imgSrc);
        resolve(imgSrc); // Fallback to original src
      }, 15000); // Increased to 15 seconds
      
      img.onload = () => {
        clearTimeout(timeout);
        console.log('✅ Image loaded, converting to data URL:', imgSrc);
        
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.warn('❌ No canvas context, using original');
            resolve(imgSrc);
            return;
          }
          
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          console.log('✅ Successfully converted to data URL');
          resolve(dataUrl);
        } catch (error) {
          console.warn('❌ CORS conversion failed, using original:', error);
          resolve(imgSrc); // Fallback to original src
        }
      };
      
      img.onerror = (e) => {
        clearTimeout(timeout);
        console.warn('❌ Image failed to load, using original:', imgSrc, e);
        resolve(imgSrc); // Fallback to original src
      };
      
      // Try loading with cache busting
      const cacheBustSrc = imgSrc.includes('?') ? `${imgSrc}&t=${Date.now()}` : `${imgSrc}?t=${Date.now()}`;
      img.src = cacheBustSrc;
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

      // Wait longer for DOM to fully update and render images
      console.log('⏳ Waiting for DOM to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2 seconds

      // Final check - ensure all images are actually loaded
      const finalImages = storyRef.current.querySelectorAll('img');
      let imagesReady = true;
      Array.from(finalImages).forEach((img, index) => {
        if (!img.complete || img.naturalWidth === 0) {
          console.warn(`⚠️ Image ${index} not ready:`, {
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            src: img.src.substring(0, 100)
          });
          imagesReady = false;
        } else {
          console.log(`✅ Image ${index} confirmed ready`);
        }
      });
      
      console.log('📊 Final images status:', { total: finalImages.length, ready: imagesReady });

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
        className="fixed top-0 left-0 pointer-events-none bg-gradient-to-br from-white to-gray-50"
        style={{ 
          width: '1080px', 
          height: '1920px',
          position: 'fixed',
          zIndex: -9999,
          opacity: generating ? 1 : 0,
          visibility: generating ? 'visible' : 'hidden',
          transform: 'translateX(-200vw)'
        }}
      >
        <div className="relative w-full h-full flex flex-col bg-white">
          {/* Top - Fits Logo */}
          <div className="flex items-center justify-center pt-16 pb-8">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
                alt="Fits" 
                className="h-12 w-12"
              />
              <h2 className="text-2xl font-bold text-gray-900">Fits</h2>
            </div>
          </div>

          {/* Main Outfit Image - Takes most of the space */}
          <div className="flex-1 flex items-center justify-center px-8 pb-8">
            <div className="relative max-w-full max-h-full">
              <img 
                src={fit.image_url} 
                data-original-src={fit.image_url}
                alt="Outfit"
                className="max-w-full max-h-full object-contain rounded-3xl shadow-lg"
                style={{ maxHeight: '900px', maxWidth: '600px' }}
                crossOrigin="anonymous"
              />
            </div>
          </div>

          {/* Bottom - Tagged Items Thumbnails */}
          {taggedItems.length > 0 && (
            <div className="bg-gray-50 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-center gap-4 mb-4">
                {taggedItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex flex-col items-center">
                    {item.product_image_url && (
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center p-2">
                        <img 
                          src={item.product_image_url} 
                          data-original-src={item.product_image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover rounded-xl"
                          crossOrigin="anonymous"
                        />
                      </div>
                    )}
                    <p className="text-xs font-medium text-gray-900 mt-2 text-center max-w-16 truncate">
                      {item.brand_name}
                    </p>
                  </div>
                ))}
                {taggedItems.length > 3 && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl shadow-md flex items-center justify-center">
                      <span className="text-gray-600 font-bold text-sm">+{taggedItems.length - 3}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-600 mt-2">more</p>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-gray-600 text-sm font-medium">
                  Tap link to shop these items
                </p>
              </div>
            </div>
          )}
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