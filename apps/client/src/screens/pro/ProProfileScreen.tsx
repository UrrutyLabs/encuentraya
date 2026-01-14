"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MapPin,
  Star,
  DollarSign,
  User,
  FileText,
  Calendar,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Navigation } from "@/components/presentational/Navigation";
import { ProProfileSkeleton } from "@/components/presentational/ProProfileSkeleton";
import { useProDetail } from "@/hooks/useProDetail";
import { Category } from "@repo/domain";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plomería",
  electrical: "Electricidad",
  cleaning: "Limpieza",
  handyman: "Arreglos generales",
  painting: "Pintura",
};

export function ProProfileScreen() {
  const params = useParams();
  const proId = params.proId as string;

  const { pro, isLoading, error } = useProDetail(proId);

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
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Pro Header */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-6 h-6 text-primary" />
                  <Text variant="h1" className="text-primary">
                    {pro.name}
                  </Text>
                </div>
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
                <div className="flex items-center justify-end gap-2 mb-1">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <Text variant="h2" className="text-primary">
                    ${pro.hourlyRate.toFixed(0)}/hora
                  </Text>
                </div>
                {pro.rating && (
                  <div className="flex items-center justify-end gap-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <Text variant="body" className="text-muted">
                      {pro.rating.toFixed(1)} ({pro.reviewCount} reseñas)
                    </Text>
                  </div>
                )}
              </div>
            </div>
            <Link href={`/book?proId=${pro.id}`}>
              <Button variant="primary" className="w-full md:w-auto flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Reservar
              </Button>
            </Link>
          </Card>

          {/* About Section */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <Text variant="h2" className="text-text">
                Acerca de
              </Text>
            </div>
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
    </div>
  );
}
