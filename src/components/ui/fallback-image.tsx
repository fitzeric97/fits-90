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

  // Show fallback icon if no images or both failed
  if ((!src && !fallbackSrc) || (primaryFailed && (fallbackFailed || !fallbackSrc))) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        {fallbackIcon || <Package className="h-12 w-12 text-muted-foreground" />}
      </div>
    );
  }

  // Show primary image if available and not failed
  if (src && !primaryFailed) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={handlePrimaryError}
      />
    );
  }

  // Show fallback image if primary failed and fallback available
  if (fallbackSrc && primaryFailed && !fallbackFailed) {
    return (
      <img
        src={fallbackSrc}
        alt={`${alt} (uploaded)`}
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