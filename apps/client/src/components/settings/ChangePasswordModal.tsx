"use client";

import { useState } from "react";
import { X, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Card, Text, Button, Input } from "@repo/ui";
import { useChangePassword } from "@/hooks/useChangePassword";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    handleSubmit,
    isPending,
    error,
    isSuccess,
  } = useChangePassword();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  if (!isOpen) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }

    setPasswordMismatch(false);
    await handleSubmit(e);
  };

  if (isSuccess) {
    // Don't show success state - hook will handle redirect to login
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <Text variant="h2" className="text-text">
              Cambiar contraseña
            </Text>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Text variant="body" className="text-text mb-2">
              Contraseña actual
            </Text>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresá tu contraseña actual"
                required
                disabled={isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Text variant="body" className="text-text mb-2">
              Nueva contraseña
            </Text>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                disabled={isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Text variant="body" className="text-text mb-2">
              Confirmar nueva contraseña
            </Text>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordMismatch(false);
                }}
                placeholder="Confirmá tu nueva contraseña"
                required
                disabled={isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordMismatch && (
              <Text variant="body" className="text-danger text-sm mt-1">
                Las contraseñas no coinciden
              </Text>
            )}
          </div>

          {(error || passwordMismatch) && (
            <Card className="p-4 bg-danger/10 border-danger/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-danger shrink-0" />
                <Text variant="body" className="text-danger">
                  {passwordMismatch
                    ? "Las contraseñas no coinciden"
                    : error?.message || "No se pudo cambiar la contraseña"}
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
              variant="primary"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
