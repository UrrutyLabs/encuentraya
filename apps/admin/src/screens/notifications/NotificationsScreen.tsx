"use client";

import { useState } from "react";
import {
  useFailedNotifications,
  useRetryFailed,
  useDrainQueued,
} from "@/hooks/useNotifications";
import { NotificationsTable } from "@/components/notifications/NotificationsTable";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";

export function NotificationsScreen() {
  const [limit] = useState(100);
  const {
    data: failedNotifications,
    isLoading,
    refetch,
  } = useFailedNotifications(limit);
  const retryMutation = useRetryFailed();
  const drainMutation = useDrainQueued();

  const handleRetryFailed = () => {
    retryMutation.mutate(
      { limit },
      {
        onSuccess: (result) => {
          console.log(
            `Reintentadas: ${result.retried}, Enviadas: ${result.sent}, Fallidas nuevamente: ${result.failedAgain}`
          );
          refetch();
        },
        onError: (error) => {
          console.error("Error al reintentar:", error);
        },
      }
    );
  };

  const handleDrainQueued = () => {
    drainMutation.mutate(
      { limit },
      {
        onSuccess: (result) => {
          console.log(
            `Procesadas: ${result.processed}, Enviadas: ${result.sent}, Fallidas: ${result.failed}`
          );
          refetch();
        },
        onError: (error) => {
          console.error("Error al procesar cola:", error);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Text variant="h1">Notificaciones</Text>
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={handleRetryFailed}
            disabled={retryMutation.isPending || isLoading}
          >
            {retryMutation.isPending
              ? "Reintentando..."
              : "Reintentar fallidas"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDrainQueued}
            disabled={drainMutation.isPending || isLoading}
          >
            {drainMutation.isPending ? "Procesando..." : "Procesar cola"}
          </Button>
        </div>
      </Card>

      <NotificationsTable
        notifications={failedNotifications || []}
        isLoading={isLoading}
      />
    </div>
  );
}
