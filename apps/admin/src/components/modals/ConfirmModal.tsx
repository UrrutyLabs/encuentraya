"use client";

import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  variant?: "primary" | "danger";
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  isPending = false,
  variant = "primary",
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-6 max-w-md w-full m-4">
        <Text variant="h2" className="mb-4">
          {title}
        </Text>
        <Text variant="body" className="mb-4">
          {message}
        </Text>
        <div className="flex gap-2">
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? "Procesando..." : confirmLabel}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
