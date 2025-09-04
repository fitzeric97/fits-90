import { useState } from "react";
import { Package } from "lucide-react";

interface FallbackImageProps {
  src: string | null;
  fallbackSrc?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function FallbackImage({ 
  src, 
  fallbackSrc, 
  alt, 
  className = "", 
  fallbackIcon 
}: FallbackImageProps) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  
  // Debug logging for image URLs
  if (process.env.NODE_ENV === 'development') {
    console.log('FallbackImage debug:', { 
      src, 
      fallbackSrc, 
      alt, 
      primaryFailed, 
      fallbackFailed 
    });
  }

  const handlePrimaryError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Primary image failed to load:', src, event);
    }
    setPrimaryFailed(true);
  };

  const handleFallbackError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Fallback image failed to load:', fallbackSrc, event);
    }
    setFallbackFailed(true);
  };

  // Prioritize scraped image (src) first, then uploaded image (fallbackSrc)
  const primaryImage = src;
  const secondaryImage = fallbackSrc;

  // Show fallback icon if no images or both failed
  if (!primaryImage || (primaryFailed && (fallbackFailed || !secondaryImage))) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        {fallbackIcon || <Package className="h-12 w-12 text-muted-foreground" />}
      </div>
    );
  }

  // Show primary image (scraped image takes priority)
  if (!primaryFailed) {
    return (
      <img
        src={primaryImage}
        alt={alt}
        className={className}
        onError={handlePrimaryError}
        crossOrigin="anonymous"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  // Show secondary image if primary failed and available
  if (secondaryImage && !fallbackFailed) {
    return (
      <img
        src={secondaryImage}
        alt={alt}
        className={className}
        onError={handleFallbackError}
        crossOrigin="anonymous"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  // Fallback to icon
  return (
    <div className={`flex items-center justify-center bg-muted ${className}`}>
      {fallbackIcon || <Package className="h-12 w-12 text-muted-foreground" />}
    </div>
  );
}