"use client";

import { Text } from "@repo/ui";
import { OrderStatus } from "@repo/domain";
import { getOrderStatusLabel } from "@/utils/orderStatus";
import { ORDER_LABELS } from "@/utils/orderLabels";

interface OrderTimelineProps {
  createdAt: Date;
  updatedAt: Date;
  scheduledWindowStartAt: Date;
  status: OrderStatus;
  acceptedAt?: Date | null;
  confirmedAt?: Date | null;
  startedAt?: Date | null;
  arrivedAt?: Date | null;
  completedAt?: Date | null;
  paidAt?: Date | null;
  canceledAt?: Date | null;
}

export function OrderTimeline({
  createdAt,
  updatedAt,
  scheduledWindowStartAt,
  status,
  acceptedAt,
  confirmedAt,
  startedAt,
  arrivedAt,
  completedAt,
  paidAt,
  canceledAt,
}: OrderTimelineProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-UY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const timelineItems = [
    {
      label: `${ORDER_LABELS.singular} creado`,
      date: createdAt,
      isActive: true,
    },
    {
      label: "Fecha programada",
      date: scheduledWindowStartAt,
      isActive: true,
    },
    ...(acceptedAt
      ? [
          {
            label: "Aceptado",
            date: acceptedAt,
            isActive: true,
          },
        ]
      : []),
    ...(confirmedAt
      ? [
          {
            label: "Confirmado",
            date: confirmedAt,
            isActive: true,
          },
        ]
      : []),
    ...(startedAt
      ? [
          {
            label: "En progreso",
            date: startedAt,
            isActive: true,
          },
        ]
      : []),
    ...(arrivedAt
      ? [
          {
            label: "Llegó",
            date: arrivedAt,
            isActive: true,
          },
        ]
      : []),
    ...(completedAt
      ? [
          {
            label: "Completado",
            date: completedAt,
            isActive: true,
          },
        ]
      : []),
    ...(paidAt
      ? [
          {
            label: "Pagado",
            date: paidAt,
            isActive: true,
          },
        ]
      : []),
    ...(canceledAt
      ? [
          {
            label: "Cancelado",
            date: canceledAt,
            isActive: true,
          },
        ]
      : []),
    {
      label: `Estado actual: ${getOrderStatusLabel(status)}`,
      date: updatedAt,
      isActive: true,
    },
  ];

  return (
    <div className="space-y-4">
      <Text variant="h2">Cronología</Text>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline items */}
        <div className="space-y-6">
          {timelineItems.map((item, index) => (
            <div key={index} className="relative flex items-start">
              {/* Dot */}
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>

              {/* Content */}
              <div className="ml-4 flex-1 pb-8">
                <Text variant="body" className="font-medium text-gray-900">
                  {item.label}
                </Text>
                <Text variant="small" className="text-gray-600 mt-1">
                  {formatDate(item.date)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
