"use client";

import { Text } from "@/components/ui/Text";
import { BookingStatus } from "@repo/domain";

interface BookingTimelineProps {
  createdAt: Date;
  updatedAt: Date;
  scheduledAt: Date;
  status: BookingStatus;
}

export function BookingTimeline({
  createdAt,
  updatedAt,
  scheduledAt,
  status,
}: BookingTimelineProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-UY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: BookingStatus): string => {
    const labels: Record<BookingStatus, string> = {
      [BookingStatus.PENDING_PAYMENT]: "Pago pendiente",
      [BookingStatus.PENDING]: "Pendiente",
      [BookingStatus.ACCEPTED]: "Aceptada",
      [BookingStatus.ON_MY_WAY]: "En camino",
      [BookingStatus.ARRIVED]: "Llegó",
      [BookingStatus.COMPLETED]: "Completada",
      [BookingStatus.REJECTED]: "Rechazada",
      [BookingStatus.CANCELLED]: "Cancelada",
    };
    return labels[status] || status;
  };

  const timelineItems = [
    {
      label: "Reserva creada",
      date: createdAt,
      isActive: true,
    },
    {
      label: "Fecha programada",
      date: scheduledAt,
      isActive: true,
    },
    {
      label: `Estado actual: ${getStatusLabel(status)}`,
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
