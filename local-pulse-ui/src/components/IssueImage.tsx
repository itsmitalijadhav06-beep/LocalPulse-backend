import { useState, useEffect } from "react";

// High-quality category-specific civic-themed placeholders from Unsplash
export const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  road: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
  water: "https://images.unsplash.com/photo-1504470695779-75300268aa0e?auto=format&fit=crop&q=80&w=600",
  electricity: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600",
  safety: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600",
  sanitation: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
  other: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=600",
};

export const getCategoryPlaceholder = (category?: string) => {
  const cat = String(category || "other").toLowerCase();
  return CATEGORY_PLACEHOLDERS[cat] || CATEGORY_PLACEHOLDERS.other;
};

interface IssueImageProps {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
}

export function IssueImage({ src, alt, category, className = "" }: IssueImageProps) {
  const fallbackUrl = getCategoryPlaceholder(category);
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackUrl);
  const [hasError, setHasError] = useState<boolean>(false);

  // Sync state if src changes
  useEffect(() => {
    setImgSrc(src || fallbackUrl);
    setHasError(false);
  }, [src, fallbackUrl]);

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackUrl);
      setHasError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}
