import { Text, Avatar } from "@repo/ui";
import { RatingStars } from "@/components/presentational/RatingStars";

interface ProProfileHeaderProps {
  name: string;
  avatarUrl?: string;
  rating?: number;
  reviewCount: number;
}

/**
 * Pro Profile Header Component
 * Displays avatar, name, rating, and review count in a single column layout
 */
export function ProProfileHeader({
  name,
  avatarUrl,
  rating,
  reviewCount,
}: ProProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <Avatar avatarUrl={avatarUrl} name={name} size="xl" />

      {/* Name */}
      <Text variant="h1" className="text-text text-center">
        {name}
      </Text>

      {/* Rating and Review Count */}
      {rating !== undefined && rating > 0 ? (
        <div className="flex flex-col items-center gap-2">
          <RatingStars rating={rating} size="lg" />
          <Text variant="body" className="text-muted">
            {rating.toFixed(1)} ({reviewCount}{" "}
            {reviewCount === 1 ? "reseña" : "reseñas"})
          </Text>
        </div>
      ) : (
        <Text variant="body" className="text-muted">
          Sin reseñas aún
        </Text>
      )}
    </div>
  );
}
