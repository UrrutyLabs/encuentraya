import { Star } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { RatingStars } from "@/components/presentational/RatingStars";
import { useProReviews } from "@/hooks/review";
import { ReviewComment } from "./ReviewComment";

interface ProReviewsProps {
  proId: string;
  rating?: number;
  reviewCount: number;
}

/**
 * Pro Reviews Component
 * Displays reviews section with rating summary and paginated comments list
 */
export function ProReviews({ proId, rating, reviewCount }: ProReviewsProps) {
  const {
    reviews,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProReviews(proId, 10);

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-primary" />
        <Text variant="h2" className="text-text">
          Reseñas
        </Text>
      </div>

      {/* Rating Summary */}
      {reviewCount > 0 && rating !== undefined ? (
        <div className="flex items-center gap-2 mb-6">
          <RatingStars rating={rating} size="md" />
          <Text variant="body" className="text-muted">
            {rating.toFixed(1)} ({reviewCount}{" "}
            {reviewCount === 1 ? "reseña" : "reseñas"})
          </Text>
        </div>
      ) : (
        <Text variant="body" className="text-muted mb-6">
          Aún no hay reseñas para este profesional.
        </Text>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <Text variant="body" className="text-muted">
          Cargando reseñas...
        </Text>
      ) : error ? (
        <Text variant="body" className="text-danger">
          Error al cargar las reseñas. Por favor, intenta nuevamente.
        </Text>
      ) : reviews.length === 0 ? (
        <Text variant="body" className="text-muted">
          No hay reseñas disponibles.
        </Text>
      ) : (
        <>
          <div className="space-y-4 mb-4">
            {reviews.map((review) => (
              <ReviewComment key={review.id} review={review} />
            ))}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Cargando..." : "Cargar más reseñas"}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
