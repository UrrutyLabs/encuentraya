"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Navigation } from "@/components/presentational/Navigation";
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
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Text variant="body" className="text-muted">
                Cargando perfil...
              </Text>
            </Card>
          </div>
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
              <Text variant="h2" className="mb-2 text-text">
                Profesional no encontrado
              </Text>
              <Text variant="body" className="text-muted mb-4">
                El profesional que buscas no existe o fue eliminado.
              </Text>
              <Link href="/search">
                <Button variant="primary">Volver a búsqueda</Button>
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
              <div>
                <Text variant="h1" className="mb-2 text-primary">
                  {pro.name}
                </Text>
                {pro.serviceArea && (
                  <Text variant="body" className="text-muted mb-3">
                    {pro.serviceArea}
                  </Text>
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
                <Text variant="h2" className="text-primary mb-1">
                  ${pro.hourlyRate.toFixed(0)}/hora
                </Text>
                {pro.rating && (
                  <Text variant="body" className="text-muted">
                    ⭐ {pro.rating.toFixed(1)} ({pro.reviewCount} reseñas)
                  </Text>
                )}
              </div>
            </div>
            <Link href={`/book?proId=${pro.id}`}>
              <Button variant="primary" className="w-full md:w-auto">
                Reservar
              </Button>
            </Link>
          </Card>

          {/* About Section */}
          <Card className="p-6 mb-6">
            <Text variant="h2" className="mb-4 text-text">
              Acerca de
            </Text>
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
            {pro.phone && (
              <Text variant="body" className="text-muted mt-2">
                Teléfono: {pro.phone}
              </Text>
            )}
          </Card>

          {/* Reviews Section */}
          <Card className="p-6">
            <Text variant="h2" className="mb-4 text-text">
              Reseñas
            </Text>
            {pro.reviewCount > 0 ? (
              <Text variant="body" className="text-muted">
                {pro.reviewCount} {pro.reviewCount === 1 ? "reseña" : "reseñas"}
                {pro.rating && ` - Promedio: ${pro.rating.toFixed(1)} ⭐`}
              </Text>
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
