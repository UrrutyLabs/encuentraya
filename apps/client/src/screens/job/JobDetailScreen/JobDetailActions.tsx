"use client";

import { X } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { JOB_LABELS } from "@/utils/jobLabels";

interface JobDetailActionsProps {
  onCancel: () => void;
  isCancelling: boolean;
}

export function JobDetailActions({
  onCancel,
  isCancelling,
}: JobDetailActionsProps) {
  return (
    <Card className="p-4 md:p-6">
      <Text variant="h2" className="mb-4 text-text">
        Acciones
      </Text>
      <Button
        variant="danger"
        onClick={onCancel}
        disabled={isCancelling}
        className="w-full md:w-auto flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        {isCancelling ? "Cancelando..." : JOB_LABELS.cancelJob}
      </Button>
    </Card>
  );
}
