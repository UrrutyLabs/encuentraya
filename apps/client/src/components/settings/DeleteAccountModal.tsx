"use client";

import { useState } from "react";
import { X, Trash2, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Card, Text, Button, Input } from "@repo/ui";
import { useDeleteAccount } from "@/hooks/auth";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const {
    password,
    setPassword,
    handleDelete,
    isPending,
    error,
  } = useDeleteAccount();

  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  const isConfirmValid = confirmText.toLowerCase() === "eliminar";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfirmValid) {
      return;
    }

    await handleDelete(e);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-danger" />
            <Text variant="h2" className="text-text">
              Eliminar cuenta
            </Text>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <Card className="p-4 bg-danger/10 border-danger/20 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div>
                <Text variant="body" className="text-danger font-semibold mb-1">
                  Esta acción no se puede deshacer
                </Text>
                <Text variant="body" className="text-danger text-sm">
                  Se eliminará permanentemente tu cuenta y se eliminará tu
                  información personal. Tus reservas y transacciones se
                  mantendrán para fines de auditoría, pero sin datos que te
                  identifiquen.
                </Text>
              </div>
            </div>
          </Card>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Text variant="body" className="text-text mb-2">
              Confirmá tu contraseña
            </Text>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresá tu contraseña"
                required
                disabled={isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Text variant="body" className="text-text mb-2">
              Escribí &quot;ELIMINAR&quot; para confirmar
            </Text>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              required
              disabled={isPending}
            />
            {confirmText && !isConfirmValid && (
              <Text variant="body" className="text-danger text-sm mt-1">
                Debes escribir &quot;ELIMINAR&quot; para confirmar
              </Text>
            )}
          </div>

          {error && (
            <Card className="p-4 bg-danger/10 border-danger/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-danger shrink-0" />
                <Text variant="body" className="text-danger">
                  {error.message || "No se pudo eliminar la cuenta"}
                </Text>
              </div>
            </Card>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={isPending || !isConfirmValid || !password}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Eliminar cuenta
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
