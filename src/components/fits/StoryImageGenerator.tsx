import { useRef, useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import { Share2, Instagram, Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { StoryTutorial } from './StoryTutorial';

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
  const [showTutorial, setShowTutorial] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Check if user has seen tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('fits-story-tutorial-completed');
    if (!hasSeenTutorial && isMobile) {
      // Show tutorial on first use
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

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
    // Simple download without Instagram integration
    const link = document.createElement('a');
    link.download = 'fit-story.jpg';
    link.href = dataUrl;
    link.click();
    
    toast({
      title: "Image downloaded!",
      description: "Your fit story has been saved to your device",
    });
  };

  const saveToDevice = async () => {
    console.log('💾 Starting simple save to device...', { 
      fitId: fit.id, 
      hasTaggedItems: taggedItems.length > 0
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
      // Pre-load images (same as existing logic)
      const imageUrls: string[] = [];
      
      if (fit.image_url) {
        imageUrls.push(fit.image_url);
      }
      
      taggedItems.forEach(item => {
        if (item.product_image_url) {
          imageUrls.push(item.product_image_url);
        }
      });
      
      const preloadPromises = imageUrls.map(async (url, index) => {
        try {
          const loadedImg = await preloadImage(url);
          const dataUrl = imageToDataUrl(loadedImg);
          return { url, dataUrl, success: true };
        } catch (error) {
          console.warn(`⚠️ Image ${index + 1} failed to pre-load:`, url, error);
          return { url, dataUrl: url, success: false };
        }
      });

      const preloadResults = await Promise.all(preloadPromises);
      
      // Update DOM images
      const images = storyRef.current.querySelectorAll('img');
      Array.from(images).forEach((img) => {
        const originalSrc = img.getAttribute('data-original-src') || img.src;
        const result = preloadResults.find(r => r.url === originalSrc);
        if (result) {
          img.src = result.dataUrl;
        }
      });
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate image
      const dataUrl = await htmlToImage.toPng(storyRef.current, {
        width: 1080,
        height: 1920,
        pixelRatio: 1,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });

      // Simple download
      downloadFallback(dataUrl);
      
    } catch (error) {
      console.error('💥 Save to device failed:', error);
      
      toast({
        title: "Error",
        description: "Failed to save image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
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
      {/* Tutorial Modal */}
      <StoryTutorial 
        open={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />

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
        className="fixed top-0 left-0 pointer-events-none"
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
        {/* Enhanced Story Design with Brand Gradient */}
        <div className="relative w-full h-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          
          {/* Brand Header with Gradient */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center z-20">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
                alt="Fits" 
                className="h-16 w-16 rounded-2xl shadow-lg"
              />
              <div className="text-white">
                <h1 className="text-5xl font-bold tracking-tight">FITS</h1>
                <p className="text-xl opacity-90">Style Creator</p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="absolute inset-0 pt-32 pb-40">
            
            {/* Main outfit image - Enhanced with shadow and border */}
            <div className="absolute left-12 top-12 bottom-12" style={{ width: taggedItems.length > 0 ? '580px' : 'calc(100% - 96px)' }}>
              <div className="relative w-full h-full">
                {/* Decorative border */}
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 rounded-3xl blur-sm opacity-75"></div>
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img 
                    src={fit.image_url} 
                    data-original-src={fit.image_url}
                    alt="Outfit"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
                
                {/* Stylish Caption Overlay */}
                {fit.caption && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md rounded-2xl p-4">
                    <p className="text-white text-lg font-medium leading-relaxed">
                      {fit.caption}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Tagged Items Section */}
            {taggedItems.length > 0 && (
              <div className="absolute right-12 top-12 bottom-12 w-96">
                <div className="relative h-full">
                  {/* Background with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/95 to-amber-50/95 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-white/50"></div>
                  
                  <div className="relative p-8 h-full">
                    {/* Section Header */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-amber-800 mb-2">Get The Look</h3>
                      <div className="h-1 w-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                    </div>
                    
                    <div className="space-y-6 overflow-y-auto max-h-[calc(100%-120px)]">
                      {taggedItems.slice(0, 4).map((item, index) => (
                        <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-amber-100 hover-scale">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {item.product_image_url && (
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl overflow-hidden flex-shrink-0">
                                  <img 
                                    src={item.product_image_url} 
                                    data-original-src={item.product_image_url}
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                  />
                                </div>
                              )}
                              <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-amber-900 font-bold text-lg mb-1 truncate">
                                {item.brand_name}
                              </p>
                              <p className="text-amber-700 text-sm leading-tight">
                                {item.product_name}
                              </p>
                              {item.price && (
                                <p className="text-orange-600 font-semibold text-sm mt-1">
                                  {item.price}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {taggedItems.length > 4 && (
                        <div className="text-center py-4">
                          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-lg font-semibold">
                            <span>+{taggedItems.length - 4} more items</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Footer with Call-to-Action */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-r from-amber-700 via-orange-700 to-yellow-700">
            <div className="flex items-center justify-between px-12 h-full">
              
              {/* Brand Section */}
              <div className="flex items-center gap-4">
                <img 
                  src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
                  alt="Fits" 
                  className="h-12 w-12 rounded-xl"
                />
                <div className="text-white">
                  <h2 className="text-3xl font-bold">FITS</h2>
                  <p className="text-lg opacity-90">Style. Share. Inspire.</p>
                </div>
              </div>
              
              {/* Call to Action */}
              <div className="text-right text-white">
                <p className="text-2xl font-bold mb-1">Download the app!</p>
                <p className="text-lg opacity-90">Create your style story</p>
                {username && (
                  <p className="text-sm opacity-75 mt-2">Styled by @{username}</p>
                )}
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-1/4 right-4 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-60"></div>
          <div className="absolute top-1/3 left-4 w-6 h-6 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full opacity-40"></div>
          <div className="absolute bottom-1/3 right-8 w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-50"></div>
          
        </div>
      </div>

      {/* Visible UI - Enhanced with Preview and Tutorial */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={generateAndShare}
            disabled={generating}
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-lg animate-fade-in"
            size="lg"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Creating Story...
              </>
            ) : (
              <>
                <Instagram className="w-5 h-5 mr-2" />
                Share to Story
              </>
            )}
          </Button>
          
          <Button
            onClick={saveToDevice}
            disabled={generating}
            variant="outline"
            size="lg"
            className="bg-white/90 border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <Download className="w-5 h-5 mr-2" />
            Save Image
          </Button>
        </div>
        
        <Button
          onClick={copyLink}
          variant="ghost"
          size="sm"
          className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
        >
          {linkCopied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              Link Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </Button>
      </div>
    </>
  );
}