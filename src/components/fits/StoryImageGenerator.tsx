import { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { Share2, Instagram, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [debugMode, setDebugMode] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Only show on mobile devices - Instagram Stories are mobile-only
  if (!isMobile) {
    return null;
  }

  // Generate the shareable link
  const shareLink = `${window.location.origin}/fits/${fit.id}`;

  // Enhanced image preloading with better error handling
  const preloadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        console.warn('⏰ Image preload timeout:', src);
        reject(new Error(`Image preload timeout: ${src}`));
      }, 20000); // 20 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        console.log('✅ Image preloaded successfully:', src);
        resolve(img);
      };
      
      img.onerror = (e) => {
        clearTimeout(timeout);
        console.error('❌ Image preload failed:', src, e);
        reject(new Error(`Image preload failed: ${src}`));
      };
      
      // Cache busting for reliable loading
      const cacheBustSrc = src.includes('?') ? `${src}&cb=${Date.now()}` : `${src}?cb=${Date.now()}`;
      img.src = cacheBustSrc;
    });
  };

  // Convert loaded image to data URL for CORS-safe embedding
  const imageToDataUrl = (img: HTMLImageElement): string => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      console.warn('Failed to convert image to data URL:', error);
      return img.src; // Fallback to original
    }
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

      // Pre-load ALL images before story generation to ensure they display
      console.log('🖼️ Pre-loading all images for story...');
      
      // Collect all image URLs that need to be loaded
      const imageUrls: string[] = [];
      
      // Add main outfit image
      if (fit.image_url) {
        imageUrls.push(fit.image_url);
      }
      
      // Add tagged item thumbnails
      taggedItems.forEach(item => {
        if (item.product_image_url) {
          imageUrls.push(item.product_image_url);
        }
      });
      
      console.log(`📸 Pre-loading ${imageUrls.length} images:`, imageUrls);

      // Pre-load all images with robust error handling
      const preloadPromises = imageUrls.map(async (url, index) => {
        try {
          console.log(`🔄 Pre-loading image ${index + 1}/${imageUrls.length}:`, url);
          const loadedImg = await preloadImage(url);
          const dataUrl = imageToDataUrl(loadedImg);
          console.log(`✅ Image ${index + 1} pre-loaded and converted`);
          return { url, dataUrl, success: true };
        } catch (error) {
          console.warn(`⚠️ Image ${index + 1} failed to pre-load:`, url, error);
          return { url, dataUrl: url, success: false }; // Use original URL as fallback
        }
      });

      const preloadResults = await Promise.all(preloadPromises);
      console.log('✅ Pre-loading completed, updating DOM images...');

      // Update all images in the DOM with pre-loaded data URLs
      const images = storyRef.current.querySelectorAll('img');
      Array.from(images).forEach((img) => {
        const originalSrc = img.getAttribute('data-original-src') || img.src;
        const result = preloadResults.find(r => r.url === originalSrc);
        if (result) {
          img.src = result.dataUrl;
          console.log(`🔄 Updated DOM image:`, originalSrc.substring(0, 50));
        }
      });
      
      console.log('✅ All DOM images updated with pre-loaded data');

      // Wait longer for DOM to fully update and render images
      console.log('⏳ Waiting for DOM to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Increased to 3 seconds

      // Debug: Log what's actually in the template
      console.log('🔍 Template debugging info:', {
        width: storyRef.current.offsetWidth,
        height: storyRef.current.offsetHeight,
        isVisible: storyRef.current.offsetParent !== null,
        hasContent: storyRef.current.innerHTML.length > 0,
        childrenCount: storyRef.current.children.length,
        textContent: storyRef.current.textContent?.substring(0, 100)
      });

      // Final check - ensure all images are actually loaded
      const finalImages = storyRef.current.querySelectorAll('img');
      let imagesReady = true;
      Array.from(finalImages).forEach((img, index) => {
        console.log(`🖼️ Final image ${index} check:`, {
          src: img.src.substring(0, 50) + '...',
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          offsetWidth: img.offsetWidth,
          offsetHeight: img.offsetHeight
        });
        
        if (!img.complete || img.naturalWidth === 0) {
          console.warn(`⚠️ Image ${index} not ready`);
          imagesReady = false;
        } else {
          console.log(`✅ Image ${index} confirmed ready`);
        }
      });
      
      console.log('📊 Final images status:', { total: finalImages.length, ready: imagesReady });

      // Force a repaint
      storyRef.current.style.transform = 'translateZ(0)';
      await new Promise(resolve => setTimeout(resolve, 100));

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
        className="fixed top-0 left-0 pointer-events-none bg-white"
        style={{ 
          width: '1080px', 
          height: '1920px',
          position: 'fixed',
          zIndex: generating ? 9999 : -9999,
          opacity: generating ? 1 : 0,
          visibility: generating ? 'visible' : 'hidden',
          transform: generating ? 'translateX(0)' : 'translateX(-100vw)'
        }}
      >
        <div className="relative w-full h-full bg-white">
          {/* Main outfit image - takes up most of the space */}
          <div className="absolute inset-0">
            <img 
              src={fit.image_url} 
              data-original-src={fit.image_url}
              alt="Outfit"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          </div>

          {/* Tagged items overlay - positioned on the right side */}
          {taggedItems.length > 0 && (
            <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg max-w-[200px]">
              <div className="space-y-3">
                {taggedItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.product_image_url && (
                      <div className="w-12 h-12 bg-white rounded-xl shadow-md overflow-hidden flex-shrink-0">
                        <img 
                          src={item.product_image_url} 
                          data-original-src={item.product_image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold text-sm truncate">
                        {item.brand_name}
                      </p>
                      <p className="text-gray-600 text-xs truncate">
                        {item.product_name}
                      </p>
                    </div>
                  </div>
                ))}
                
                {taggedItems.length > 3 && (
                  <div className="text-center pt-2 border-t border-gray-200">
                    <p className="text-gray-600 text-xs">
                      +{taggedItems.length - 3} more items
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fits logo - bottom right corner */}
          <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
                alt="Fits" 
                className="h-8 w-8"
              />
              <span className="text-gray-900 font-bold text-lg">Fits</span>
            </div>
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
        
        {/* Debug button to preview template */}
        <Button
          onClick={() => setDebugMode(!debugMode)}
          size="sm"
          variant="outline"
          className="text-xs px-2 py-1 h-6"
        >
          {debugMode ? 'Hide Preview' : 'Preview Template'}
        </Button>
      </div>

      {/* Debug Template Preview - Shows actual template when debug mode is on */}
      {debugMode && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Story Template Preview</h3>
              <Button onClick={() => setDebugMode(false)} size="sm" variant="ghost">✕</Button>
            </div>
            
            <div 
              className="w-full bg-white border rounded-lg overflow-hidden"
              style={{ 
                aspectRatio: '9/16',
                maxHeight: '400px'
              }}
            >
              <div className="relative w-full h-full flex flex-col bg-white text-black" style={{ fontSize: '3px' }}>
                {/* Scaled down version for preview */}
                <div className="flex items-center justify-center pt-4 pb-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-black font-bold" style={{ fontSize: '6px' }}>Fits</span>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center px-2 pb-2">
                  <div className="w-16 h-20 bg-gray-200 rounded border flex items-center justify-center">
                    <span style={{ fontSize: '4px' }}>Outfit Image</span>
                  </div>
                </div>

                {taggedItems.length > 0 && (
                  <div className="bg-gray-50 px-2 py-1 rounded-t-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {taggedItems.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-white rounded border"></div>
                          <span style={{ fontSize: '2px' }}>{item.brand_name.substring(0, 4)}</span>
                        </div>
                      ))}
                      {taggedItems.length > 3 && (
                        <div className="w-3 h-3 bg-gray-200 rounded flex items-center justify-center">
                          <span style={{ fontSize: '2px' }}>+{taggedItems.length - 3}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <span style={{ fontSize: '3px' }}>Tap link to shop these items</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-600 mt-2">
              This is what your story template should look like. If this looks correct but the generated image is still white, there may be a rendering issue.
            </p>
          </div>
        </div>
      )}
    </>
  );
}