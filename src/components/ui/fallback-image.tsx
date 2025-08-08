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

  const handlePrimaryError = () => {
    setPrimaryFailed(true);
  };

  const handleFallbackError = () => {
    setFallbackFailed(true);
  };

  // Prioritize uploaded image if available
  const primaryImage = fallbackSrc || src;
  const secondaryImage = fallbackSrc ? src : null;

  // Show fallback icon if no images or both failed
  if (!primaryImage || (primaryFailed && (fallbackFailed || !secondaryImage))) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        {fallbackIcon || <Package className="h-12 w-12 text-muted-foreground" />}
      </div>
    );
  }

  // Show primary image (uploaded takes priority)
  if (!primaryFailed) {
    return (
      <img
        src={primaryImage}
        alt={fallbackSrc ? `${alt} (uploaded)` : alt}
        className={className}
        onError={handlePrimaryError}
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