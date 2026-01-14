import Link from "next/link";
import { Star, User, CheckCircle, Clock, Calendar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Pro } from "@repo/domain";
import { Category } from "@repo/domain";

interface ProfessionalCardProps {
  pro: Pro;
  hasWorkedWith?: boolean;
  availabilityHint?: "today" | "tomorrow" | null;
}

const CATEGORY_LABELS: Record<Category, string> = {
  [Category.PLUMBING]: "Plomería",
  [Category.ELECTRICAL]: "Electricidad",
  [Category.CLEANING]: "Limpieza",
  [Category.HANDYMAN]: "Arreglos generales",
  [Category.PAINTING]: "Pintura",
};

function getAvailabilityText(hint: "today" | "tomorrow" | null): string | null {
  if (hint === "today") return "Disponible hoy";
  if (hint === "tomorrow") return "Disponible mañana";
  return null;
}

function getTrustSignal(pro: Pro): string | null {
  if (pro.isApproved && !pro.isSuspended) {
    return "Verificado";
  }
  // Could add more trust signals based on response time, etc.
  return null;
}

export function ProfessionalCard({
  pro,
  hasWorkedWith = false,
  availabilityHint = null,
}: ProfessionalCardProps) {
  const primaryCategory = pro.categories[0];
  const trustSignal = getTrustSignal(pro);
  const availabilityText = getAvailabilityText(availabilityHint);
  const isNew = !pro.rating || pro.reviewCount === 0;
  const isActive = pro.isApproved && !pro.isSuspended;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex flex-col h-full">
        {/* Header: Photo, Name, Status */}
        <div className="flex items-start gap-4 mb-4">
          {/* Profile Photo Placeholder */}
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-muted" />
          </div>

          {/* Name and Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <Text variant="h2" className="text-text truncate">
                {pro.name}
              </Text>
              {hasWorkedWith && (
                <Badge variant="info" className="shrink-0">
                  Ya trabajaste con este profesional
                </Badge>
              )}
            </div>

            {/* Primary Category */}
            {primaryCategory && (
              <Text variant="small" className="text-muted mb-2">
                {CATEGORY_LABELS[primaryCategory] || primaryCategory}
              </Text>
            )}

            {/* Trust Signal */}
            {trustSignal && (
              <div className="flex items-center gap-1 mb-2">
                <CheckCircle className="w-3 h-3 text-success" />
                <Text variant="small" className="text-muted">
                  {trustSignal}
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Rating or "Nuevo" */}
        <div className="mb-4">
          {isNew ? (
            <Badge variant="info">Nuevo</Badge>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <Text variant="small" className="text-text font-medium">
                  {pro.rating?.toFixed(1)}
                </Text>
              </div>
              <Text variant="small" className="text-muted">
                ({pro.reviewCount} {pro.reviewCount === 1 ? "reseña" : "reseñas"})
              </Text>
            </div>
          )}
        </div>

        {/* Availability Hint */}
        {availabilityText && (
          <div className="flex items-center gap-2 mb-4">
            {availabilityHint === "today" ? (
              <Clock className="w-4 h-4 text-primary" />
            ) : (
              <Calendar className="w-4 h-4 text-primary" />
            )}
            <Text variant="small" className="text-muted">
              {availabilityText}
            </Text>
          </div>
        )}

        {/* Service Area (if available) */}
        {pro.serviceArea && (
          <Text variant="small" className="text-muted mb-4">
            {pro.serviceArea}
          </Text>
        )}

        {/* CTA Button */}
        <div className="mt-auto pt-4">
          <Link href={`/pros/${pro.id}`} className="block">
            <Button variant="primary" className="w-full">
              Ver perfil
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
