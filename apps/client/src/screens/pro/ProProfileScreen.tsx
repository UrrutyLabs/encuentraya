"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Star,
  User,
  FileText,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { ProProfileSkeleton } from "@/components/presentational/ProProfileSkeleton";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";
import { useProDetail } from "@/hooks/pro";
import { useAuth } from "@/hooks/auth";
import { Category } from "@repo/domain";
import { useTodayDate } from "@/hooks/shared/useTodayDate";
import { getAvailabilityHint } from "@/utils/proAvailability";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plomería",
  electrical: "Electricidad",
  cleaning: "Limpieza",
  handyman: "Arreglos generales",
  painting: "Pintura",
};

export function ProProfileScreen() {
  const params = useParams();
  const router = useRouter();
  const proId = params.proId as string;
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { pro, isLoading, error } = useProDetail(proId);
  const { user, loading: authLoading } = useAuth();
  const today = useTodayDate();

  // Calculate derived states
  const isActive = useMemo(
    () => pro?.isApproved && !pro?.isSuspended,
    [pro?.isApproved, pro?.isSuspended]
  );
  const availabilityHint = useMemo(
    () => (pro ? getAvailabilityHint(pro.availabilitySlots, today) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pro?.availabilitySlots, today]
  );

  const handleReserveClick = () => {
    if (authLoading) {
      // Still checking auth, wait
      return;
    }
    if (!user) {
      // Not authenticated, show modal
      setShowAuthModal(true);
      return;
    }
    // Ensure pro exists before proceeding
    if (!pro?.id) {
      return;
    }
    // Authenticated, proceed to booking
    router.push(`/book?proId=${pro.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <ProProfileSkeleton />
        </div>
      </div>
    );
  }

  if (error || !pro) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
              <Text variant="h2" className="mb-2 text-text">
                Profesional no encontrado
              </Text>
              <Text variant="body" className="text-muted mb-4">
                El profesional que buscas no existe o fue eliminado.
              </Text>
              <Link href="/search">
                <Button variant="primary" className="flex items-center gap-2 mx-auto">
                  <ArrowLeft className="w-4 h-4" />
                  Volver a búsqueda
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={true} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Pro Header */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <User className="w-6 h-6 text-primary" />
                  <Text variant="h1" className="text-primary">
                    {pro.name}
                  </Text>
                  <div className="flex gap-1 flex-wrap">
                    {pro.isSuspended && (
                      <Badge variant="danger">
                        Suspendido
                      </Badge>
                    )}
                    {isActive && (
                      <Badge variant="info">
                        Verificado
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Availability Hint */}
                {availabilityHint && (
                  <div className="flex items-center gap-2 mb-3">
                    {availabilityHint === "today" ? (
                      <Clock className="w-4 h-4 text-primary" />
                    ) : (
                      <Calendar className="w-4 h-4 text-primary" />
                    )}
                    <Text variant="body" className="text-muted">
                      {availabilityHint === "today" ? "Disponible hoy" : "Disponible mañana"}
                    </Text>
                  </div>
                )}

                {pro.serviceArea && (
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-muted" />
                    <Text variant="body" className="text-muted">
                      {pro.serviceArea}
                    </Text>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  {pro.categories.map((category: Category | string) => (
                    <Badge key={category} variant="info">
                      {CATEGORY_LABELS[category] || category}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="mb-1">
                  <Text variant="h2" className="text-primary">
                    ${pro.hourlyRate.toFixed(0)}/hora
                  </Text>
                </div>
                {pro.rating ? (
                  <div className="flex items-center justify-end gap-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <Text variant="body" className="text-muted">
                      {pro.rating.toFixed(1)} ({pro.reviewCount} {pro.reviewCount === 1 ? "reseña" : "reseñas"})
                    </Text>
                  </div>
                ) : (
                  <Text variant="body" className="text-muted">
                    Sin reseñas aún
                  </Text>
                )}
              </div>
            </div>
            {isActive && !pro.isSuspended && (
              <Button
                variant="primary"
                onClick={handleReserveClick}
                disabled={authLoading}
                className="w-full md:w-auto flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Reservar
              </Button>
            )}
          </Card>

          {/* About Section */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <Text variant="h2" className="text-text">
                Acerca de
              </Text>
            </div>
            {pro.bio ? (
              <Text variant="body" className="text-text whitespace-pre-line">
                {pro.bio}
              </Text>
            ) : (
              <>
                {pro.serviceArea ? (
                  <Text variant="body" className="text-muted">
                    Profesional en {pro.serviceArea} con experiencia en{" "}
                    {pro.categories
                      .map((cat: Category | string) => CATEGORY_LABELS[cat] || cat)
                      .join(", ")}
                    .
                  </Text>
                ) : (
                  <Text variant="body" className="text-muted">
                    Profesional con experiencia en{" "}
                    {pro.categories
                      .map((cat: Category | string) => CATEGORY_LABELS[cat] || cat)
                      .join(", ")}
                    .
                  </Text>
                )}
              </>
            )}
          </Card>

          {/* Reviews Section */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary" />
              <Text variant="h2" className="text-text">
                Reseñas
              </Text>
            </div>
            {pro.reviewCount > 0 ? (
              <div className="flex items-center gap-2">
                <Text variant="body" className="text-muted">
                  {pro.reviewCount} {pro.reviewCount === 1 ? "reseña" : "reseñas"}
                </Text>
                {pro.rating && (
                  <>
                    <span className="text-muted">-</span>
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <Text variant="body" className="text-muted">
                      Promedio: {pro.rating.toFixed(1)}
                    </Text>
                  </>
                )}
              </div>
            ) : (
              <Text variant="body" className="text-muted">
                Aún no hay reseñas para este profesional.
              </Text>
            )}
          </Card>
        </div>
      </div>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        returnUrl={`/book?proId=${pro.id}`}
        title="Iniciá sesión para reservar"
        message="Necesitás iniciar sesión para reservar un servicio con este profesional."
      />
    </div>
  );
}
