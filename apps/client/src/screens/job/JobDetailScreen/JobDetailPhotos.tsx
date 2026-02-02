"use client";

import { Image as ImageIcon } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import type { OrderDetailView } from "@repo/domain";

interface JobDetailPhotosProps {
  job: OrderDetailView;
}

export function JobDetailPhotos({ job }: JobDetailPhotosProps) {
  const orderPhotos = job.photoUrls?.filter(Boolean) ?? [];
  const workProofPhotos = job.workProofPhotoUrls?.filter(Boolean) ?? [];

  if (orderPhotos.length === 0 && workProofPhotos.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-primary" />
        <Text variant="h2" className="text-text">
          Fotos
        </Text>
      </div>

      {orderPhotos.length > 0 && (
        <div className="mb-4 last:mb-0">
          <Text variant="small" className="text-muted mb-2 block">
            Fotos del pedido ({orderPhotos.length})
          </Text>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {orderPhotos.map((url) => (
              <img
                key={url}
                src={url}
                alt="Pedido"
                className="aspect-square object-cover rounded-lg border border-border"
              />
            ))}
          </div>
        </div>
      )}

      {workProofPhotos.length > 0 && (
        <div>
          <Text variant="small" className="text-muted mb-2 block">
            Fotos del trabajo completado ({workProofPhotos.length})
          </Text>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {workProofPhotos.map((url) => (
              <img
                key={url}
                src={url}
                alt="Trabajo completado"
                className="aspect-square object-cover rounded-lg border border-border"
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
