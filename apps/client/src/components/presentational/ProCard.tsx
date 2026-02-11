import { memo, useMemo } from "react";
import Link from "next/link";
import { Clock, Calendar, Award, CheckCircle2, MapPin } from "lucide-react";
import { Card, Text, Badge, Avatar } from "@repo/ui";
import { type Pro } from "@repo/domain";
import { useTodayDate } from "@/hooks/shared/useTodayDate";
import { getAvailabilityHint } from "@/utils/proAvailability";
import { formatResponseTime, formatCompletedJobs } from "@/utils/proFormatting";
import { RatingStars } from "./RatingStars";

interface ProCardProps {
  pro: Pro;
  categoryId?: string;
  categorySlug?: string;
  subcategorySlug?: string;
}

export const ProCard = memo(
  function ProCard({
    pro,
    categoryId,
    categorySlug,
    subcategorySlug,
  }: ProCardProps) {
    const today = useTodayDate();
    const availabilityHint = useMemo(
      () => getAvailabilityHint(pro.availabilitySlots, today),
      [pro.availabilitySlots, today]
    );

    const responseTimeText = useMemo(
      () => formatResponseTime(pro.responseTimeMinutes ?? undefined),
      [pro.responseTimeMinutes]
    );
    const completedJobsText = useMemo(
      () => formatCompletedJobs(pro.completedJobsCount ?? 0),
      [pro.completedJobsCount]
    );

    // Compute price display from category relation (fixed vs hourly)
    const priceDisplay = useMemo(() => {
      const rel = pro.categoryRelations?.find(
        (r) => r.categoryId === categoryId
      );
      const isFixed =
        rel?.category?.pricingMode === "fixed" && rel.startingFromCents != null;

      if (isFixed && rel && rel.startingFromCents != null) {
        const amount = Math.round(rel.startingFromCents / 100);
        return { mode: "fixed" as const, amount };
      }

      const hourly =
        rel?.hourlyRateCents != null
          ? rel.hourlyRateCents / 100
          : pro.hourlyRate;
      return { mode: "hourly" as const, amount: hourly };
    }, [pro, categoryId]);

    // Build URL with category/subcategory query params if provided
    const proUrl = useMemo(() => {
      const params = new URLSearchParams();
      if (categorySlug) {
        params.set("category", categorySlug);
      }
      if (subcategorySlug) {
        params.set("subcategory", subcategorySlug);
      }
      const queryString = params.toString();
      return `/pros/${pro.id}${queryString ? `?${queryString}` : ""}`;
    }, [pro.id, categorySlug, subcategorySlug]);

    return (
      <Link href={proUrl} className="block">
        <Card className="shadow-md hover:shadow-lg active:shadow-xl transition-shadow h-full cursor-pointer overflow-hidden">
          {/* Main content */}
          <div className="flex gap-4 p-4">
            {/* Left: Avatar */}
            <Avatar avatarUrl={pro.avatarUrl} name={pro.name} size="xl" />

            {/* Center: Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* First row: Name + Rating (stars) */}
              <div className="flex items-center gap-2">
                <Text variant="h2" className="text-text truncate">
                  {pro.name}
                </Text>
                {pro.rating !== undefined && pro.rating > 0 && (
                  <div className="shrink-0">
                    <RatingStars rating={pro.rating} />
                  </div>
                )}
              </div>

              {/* Second row: isTop + rating number + review count */}
              <div className="flex items-center gap-2 flex-wrap">
                {pro.isTopPro && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Award className="w-4 h-4 text-warning" />
                    <Badge variant="warning" className="shrink-0">
                      Top Pro
                    </Badge>
                  </div>
                )}
                {pro.rating !== undefined && pro.rating > 0 && (
                  <>
                    <Text variant="small" className="text-muted">
                      {pro.rating.toFixed(1)}
                    </Text>
                    <Text variant="small" className="text-muted">
                      ({pro.reviewCount})
                    </Text>
                  </>
                )}
              </div>

              {/* Third row: Availability + Response time */}
              <div className="flex items-center gap-3 flex-wrap">
                {availabilityHint && (
                  <div className="flex items-center gap-1">
                    {availabilityHint === "today" ? (
                      <Clock className="w-4 h-4 text-primary" />
                    ) : (
                      <Calendar className="w-4 h-4 text-primary" />
                    )}
                    <Text variant="small" className="text-muted">
                      {availabilityHint === "today"
                        ? "Disponible hoy"
                        : "Disponible mañana"}
                    </Text>
                  </div>
                )}
                {responseTimeText && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted" />
                    <Text variant="small" className="text-muted">
                      {responseTimeText}
                    </Text>
                  </div>
                )}
              </div>

              {/* Fourth row: Completed Jobs */}
              {pro.completedJobsCount > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-muted" />
                  <Text variant="small" className="text-muted">
                    {completedJobsText}
                  </Text>
                </div>
              )}

              {/* Fifth row: Location */}
              {pro.serviceArea && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-muted" />
                  <Text variant="small" className="text-muted">
                    {pro.serviceArea}
                  </Text>
                </div>
              )}
            </div>

            {/* Right: Rate */}
            <div className="shrink-0 w-20 text-left">
              {priceDisplay.mode === "fixed" ? (
                <div className="flex flex-col">
                  <Text variant="small" className="text-muted">
                    Desde
                  </Text>
                  <Text variant="small" className="text-text font-semibold">
                    ${priceDisplay.amount.toFixed(0)}
                  </Text>
                </div>
              ) : (
                <Text variant="small" className="text-text font-semibold">
                  ${priceDisplay.amount.toFixed(0)}/hora
                </Text>
              )}
            </div>
          </div>

          {/* Footer: Bio (aligned with content column) + View Profile button */}
          <div className="flex gap-4 px-4 py-3">
            <div className="w-32 shrink-0" aria-hidden="true" />
            {pro.bio?.trim() ? (
              <div className="flex-1 min-w-0 border border-muted/20 bg-muted/10 px-3 py-2 flex items-center">
                <Text
                  variant="small"
                  className="text-muted line-clamp-2"
                  as="p"
                >
                  {pro.bio.trim()}
                </Text>
              </div>
            ) : (
              <div className="flex-1 min-w-0" aria-hidden="true" />
            )}
            <span className="shrink-0 px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm transition-colors hover:opacity-90 active:opacity-75">
              Ver perfil
            </span>
          </div>
        </Card>
      </Link>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.pro.id === nextProps.pro.id &&
      prevProps.pro.name === nextProps.pro.name &&
      prevProps.pro.avatarUrl === nextProps.pro.avatarUrl &&
      prevProps.pro.rating === nextProps.pro.rating &&
      prevProps.pro.reviewCount === nextProps.pro.reviewCount &&
      prevProps.pro.completedJobsCount === nextProps.pro.completedJobsCount &&
      prevProps.pro.isTopPro === nextProps.pro.isTopPro &&
      prevProps.pro.responseTimeMinutes === nextProps.pro.responseTimeMinutes &&
      prevProps.pro.hourlyRate === nextProps.pro.hourlyRate &&
      prevProps.categoryId === nextProps.categoryId &&
      prevProps.pro.serviceArea === nextProps.pro.serviceArea &&
      prevProps.pro.bio === nextProps.pro.bio &&
      prevProps.pro.availabilitySlots?.length ===
        nextProps.pro.availabilitySlots?.length &&
      prevProps.categorySlug === nextProps.categorySlug &&
      prevProps.subcategorySlug === nextProps.subcategorySlug
    );
  }
);
