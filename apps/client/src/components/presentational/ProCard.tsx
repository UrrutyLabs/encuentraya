import { memo, useMemo } from "react";
import Link from "next/link";
import { Star, Clock, Calendar } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Category, type Pro } from "@repo/domain";
import { useTodayDate } from "@/hooks/shared/useTodayDate";
import { getAvailabilityHint } from "@/utils/proAvailability";

const CATEGORY_LABELS: Record<Category, string> = {
  [Category.PLUMBING]: "Plomería",
  [Category.ELECTRICAL]: "Electricidad",
  [Category.CLEANING]: "Limpieza",
  [Category.HANDYMAN]: "Arreglos generales",
  [Category.PAINTING]: "Pintura",
};

interface ProCardProps {
  pro: Pro;
}

export const ProCard = memo(
  function ProCard({ pro }: ProCardProps) {
    const today = useTodayDate();
    const availabilityHint = useMemo(
      () => getAvailabilityHint(pro.availabilitySlots, today),
      [pro.availabilitySlots, today]
    );

    const displayedCategories = useMemo(() => {
      const maxVisible = 2;
      if (pro.categories.length <= maxVisible) {
        return { visible: pro.categories, remaining: 0 };
      }
      return {
        visible: pro.categories.slice(0, maxVisible),
        remaining: pro.categories.length - maxVisible,
      };
    }, [pro.categories]);

    return (
      <Link href={`/pros/${pro.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <Text variant="h2" className="text-text">
                {pro.name}
              </Text>
            </div>
          </div>

          {/* Availability Hint */}
          {availabilityHint && (
            <div className="flex items-center gap-1 mb-2">
              {availabilityHint === "today" ? (
                <Clock className="w-3 h-3 text-primary" />
              ) : (
                <Calendar className="w-3 h-3 text-primary" />
              )}
              <Text variant="small" className="text-muted">
                {availabilityHint === "today"
                  ? "Disponible hoy"
                  : "Disponible mañana"}
              </Text>
            </div>
          )}

          {pro.serviceArea && (
            <Text variant="body" className="text-muted mb-2">
              {pro.serviceArea}
            </Text>
          )}

          {pro.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {displayedCategories.visible.map((category) => (
                <Badge key={category} variant="info">
                  {CATEGORY_LABELS[category as Category] || category}
                </Badge>
              ))}
              {displayedCategories.remaining > 0 && (
                <Badge variant="info" className="opacity-70">
                  +{displayedCategories.remaining} más
                </Badge>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <Text variant="small" className="text-text font-medium">
                ${pro.hourlyRate.toFixed(0)}/hora
              </Text>
            </div>
            {pro.rating ? (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <Text variant="small" className="text-muted">
                  {pro.rating.toFixed(1)} ({pro.reviewCount})
                </Text>
              </div>
            ) : (
              <Text variant="small" className="text-muted">
                Sin reseñas aún
              </Text>
            )}
          </div>
        </Card>
      </Link>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.pro.id === nextProps.pro.id &&
      prevProps.pro.isApproved === nextProps.pro.isApproved &&
      prevProps.pro.isSuspended === nextProps.pro.isSuspended &&
      prevProps.pro.rating === nextProps.pro.rating &&
      prevProps.pro.reviewCount === nextProps.pro.reviewCount &&
      prevProps.pro.categories.length === nextProps.pro.categories.length &&
      prevProps.pro.categories.every(
        (cat, idx) => cat === nextProps.pro.categories[idx]
      ) &&
      prevProps.pro.availabilitySlots?.length ===
        nextProps.pro.availabilitySlots?.length
    );
  }
);
