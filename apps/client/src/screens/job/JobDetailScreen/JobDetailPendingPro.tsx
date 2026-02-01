"use client";

import { AlertCircle } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Badge } from "@repo/ui";

export function JobDetailPendingPro() {
  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-info/10 border-info/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-info" />
            <Text variant="h2" className="text-text">
              Esperando confirmación del profesional
            </Text>
          </div>
          <Text variant="body" className="text-muted mb-2">
            El profesional está revisando tu solicitud. Te notificaremos cuando
            acepte el trabajo.
          </Text>
        </div>
        <Badge variant="info" showIcon>
          Pendiente
        </Badge>
      </div>
    </Card>
  );
}
