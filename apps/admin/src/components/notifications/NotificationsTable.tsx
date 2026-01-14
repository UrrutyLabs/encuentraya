"use client";

import { BellOff } from "lucide-react";
import { Badge } from "@repo/ui";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@repo/ui";
import { formatDateShort } from "@/components/utils/formatDate";

interface FailedNotification {
  id: string;
  channel: string;
  recipientRef: string;
  templateId: string;
  error: string | null;
  createdAt: Date;
}

interface NotificationsTableProps {
  notifications: FailedNotification[];
  isLoading?: boolean;
}

export function NotificationsTable({
  notifications,
  isLoading,
}: NotificationsTableProps) {
  const getChannelBadgeVariant = (
    channel: string
  ): "info" | "success" | "warning" | "danger" => {
    const channelMap: Record<string, "info" | "success" | "warning" | "danger"> = {
      EMAIL: "info",
      WHATSAPP: "success",
      PUSH: "warning",
    };
    return channelMap[channel] || "info";
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={5} />;
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title="No hay notificaciones fallidas"
        description="Todas las notificaciones se han enviado correctamente."
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Canal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destinatario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plantilla
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Error
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notifications.map((notification) => (
              <tr key={notification.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getChannelBadgeVariant(notification.channel)}>
                    {notification.channel}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {notification.recipientRef}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {notification.templateId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                  <div className="truncate" title={notification.error || ""}>
                    {notification.error || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDateShort(notification.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
