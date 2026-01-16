import { memo, useMemo } from "react";
import Link from "next/link";
import { Star, DollarSign, Clock, Calendar } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Category, type Pro } from "@repo/domain";
import { useTodayDate } from "@/hooks/shared/useTodayDate";

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

/**
 * Determine availability hint based on availability slots
 * Returns "today", "tomorrow", or null
 */
function getAvailabilityHint(
  availabilitySlots: Pro["availabilitySlots"],
  today: string
): "today" | "tomorrow" | null {
  if (!availabilitySlots || availabilitySlots.length === 0) {
    return null;
  }

  const now = new Date();
  const todayDate = new Date(today);
  const todayDayOfWeek = todayDate.getUTCDay();
  const tomorrowDayOfWeek = (todayDayOfWeek + 1) % 7;

  // Check if pro has availability today
  const hasTodayAvailability = availabilitySlots.some(
    (slot) => slot.dayOfWeek === todayDayOfWeek
  );

  if (hasTodayAvailability) {
    // Check if there are still available time slots today
    const todaySlots = availabilitySlots.filter(
      (slot) => slot.dayOfWeek === todayDayOfWeek
    );

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Check if any slot has a start time after current time (with 1 hour buffer)
    const hasFutureSlotToday = todaySlots.some((slot) => {
      const [slotHour, slotMinute] = slot.startTime.split(":").map(Number);
      const slotStartInMinutes = slotHour * 60 + slotMinute;
      return slotStartInMinutes > currentTimeInMinutes + 60; // 1 hour buffer
    });

    if (hasFutureSlotToday) {
      return "today";
    }
  }

  // Check if pro has availability tomorrow
  const hasTomorrowAvailability = availabilitySlots.some(
    (slot) => slot.dayOfWeek === tomorrowDayOfWeek
  );

  if (hasTomorrowAvailability) {
    return "tomorrow";
  }

  return null;
}

export const ProCard = memo(function ProCard({ pro }: ProCardProps) {
  const today = useTodayDate();
  const isActive = useMemo(() => pro.isApproved && !pro.isSuspended, [pro.isApproved, pro.isSuspended]);
  const isNew = useMemo(() => !pro.rating || pro.reviewCount === 0, [pro.rating, pro.reviewCount]);
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
          <div className="flex gap-1 shrink-0 ml-2">
            {isNew && (
              <Badge variant="new">
                Nuevo
              </Badge>
            )}
            {isActive && (
              <Badge variant="success" showIcon>
                Activo
              </Badge>
            )}
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
              {availabilityHint === "today" ? "Disponible hoy" : "Disponible mañana"}
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
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-primary" />
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
            isNew && (
              <Text variant="small" className="text-muted">
                Sin reseñas aún
              </Text>
            )
          )}
        </div>
      </Card>
    </Link>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.pro.id === nextProps.pro.id &&
    prevProps.pro.isApproved === nextProps.pro.isApproved &&
    prevProps.pro.isSuspended === nextProps.pro.isSuspended &&
    prevProps.pro.rating === nextProps.pro.rating &&
    prevProps.pro.reviewCount === nextProps.pro.reviewCount &&
    prevProps.pro.categories.length === nextProps.pro.categories.length &&
    prevProps.pro.categories.every((cat, idx) => cat === nextProps.pro.categories[idx]) &&
    prevProps.pro.availabilitySlots?.length === nextProps.pro.availabilitySlots?.length
  );
});
