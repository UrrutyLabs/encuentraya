import { Text, Avatar } from "@repo/ui";
import { RatingStars } from "@/components/presentational/RatingStars";
import { formatDaysAgo } from "@/utils/date";
import type { Review } from "@repo/domain";

interface ReviewCommentProps {
  review: Review;
}

/**
 * Review Comment Component
 * Displays individual review with commenter name, days ago, stars, and comment text
 */
export function ReviewComment({ review }: ReviewCommentProps) {
  const clientName = review.clientDisplayName || "Cliente";

  return (
    <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
      {/* Top row: Avatar + Commenter name | days ago (right-aligned) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar name={clientName} size="sm" />
          <Text variant="body" className="text-text font-medium">
            {clientName}
          </Text>
        </div>
        <Text variant="small" className="text-muted">
          {formatDaysAgo(review.createdAt)}
        </Text>
      </div>

      {/* Middle: Star rating */}
      <div className="mb-2">
        <RatingStars rating={review.rating} size="sm" />
      </div>

      {/* Bottom: Comment text */}
      {review.comment && (
        <Text variant="body" className="text-text whitespace-pre-line">
          {review.comment}
        </Text>
      )}
    </div>
  );
}
