"use client";

import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import type { Order } from "@repo/domain";

interface OrderDetailPhotosProps {
  order: Order;
}

export function OrderDetailPhotos({ order }: OrderDetailPhotosProps) {
  const orderPhotos = order.photoUrls?.filter(Boolean) ?? [];
  const workProofPhotos = order.workProofPhotoUrls?.filter(Boolean) ?? [];

  if (orderPhotos.length === 0 && workProofPhotos.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-gray-600" />
        <Text variant="h2">Fotos</Text>
      </div>

      {orderPhotos.length > 0 && (
        <div className="mb-4 last:mb-0">
          <Text variant="small" className="text-gray-600 mb-2 block">
            Fotos del pedido ({orderPhotos.length})
          </Text>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {orderPhotos.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-lg border border-gray-200 overflow-hidden hover:opacity-90"
              >
                <Image
                  src={url}
                  alt="Pedido"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {workProofPhotos.length > 0 && (
        <div>
          <Text variant="small" className="text-gray-600 mb-2 block">
            Fotos del trabajo completado ({workProofPhotos.length})
          </Text>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {workProofPhotos.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-lg border border-gray-200 overflow-hidden hover:opacity-90"
              >
                <Image
                  src={url}
                  alt="Trabajo completado"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
