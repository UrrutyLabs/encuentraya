import { Star } from "lucide-react";

interface RatingStarsProps {
  /**
   * Rating value (0-5)
   * Can be a decimal (e.g., 4.5)
   */
  rating: number;
  /**
   * Size of the stars (default: "md")
   */
  size?: "sm" | "md" | "lg";
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Display a 5-star rating with filled/empty/half stars
 * @example
 * <RatingStars rating={4.5} />
 */
export function RatingStars({
  rating,
  size = "md",
  className = "",
}: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const starSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className={`${starSize} text-warning fill-warning`}
        />
      ))}
      {hasHalfStar && (
        <Star className={`${starSize} text-warning fill-warning opacity-50`} />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className={`${starSize} text-muted`} />
      ))}
    </div>
  );
}
