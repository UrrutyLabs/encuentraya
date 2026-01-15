"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, AlertCircle } from "lucide-react";
import { useResetPassword } from "@/hooks/auth";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Text, Card } from "@repo/ui";

export function ResetPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isPending, error } = useResetPassword();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get token from URL
  // Supabase sends the token in the hash fragment (#access_token=...) or as query param
  // We need to check both URL hash and query params
  const [token, setToken] = useState<string>("");
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    // Extract token from URL on mount
    // This is a client component, so window is always available
    
    // Check query params first
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get("access_token") || urlParams.get("token");
    
    if (queryToken) {
      setToken(queryToken);
      setIsCheckingToken(false);
      return;
    }
    
    // Check hash fragment (Supabase typically uses this)
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1)); // Remove #
      const hashToken = hashParams.get("access_token") || hashParams.get("token");
      
      if (hashToken) {
        setToken(hashToken);
        // Clean up the hash from URL
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        setIsCheckingToken(false);
        return;
      }
    }
    
    // No token found - update state and redirect after render
    setIsCheckingToken(false);
    setTimeout(() => {
      router.push("/forgot-password");
    }, 0);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setValidationError("Las contraseñas no coinciden");
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setValidationError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      await resetPassword(token, newPassword);
      // Success - mutation's onSuccess will handle redirect
    } catch (err) {
      // Error is handled by mutation state
    }
  };

  // Show loading state while checking token
  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <Text variant="body" className="text-muted">
            Cargando...
          </Text>
        </div>
      </div>
    );
  }

  // Show error state if no token found
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-danger" />
          </div>
          <div className="text-center space-y-2">
            <Text variant="h1" className="text-text">
              Enlace inválido
            </Text>
            <Text variant="body" className="text-muted">
              El enlace de recuperación no es válido o ha expirado.
            </Text>
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push("/forgot-password")}
          >
            Solicitar nuevo enlace
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <Text variant="h1" className="text-text">
            Restablecer contraseña
          </Text>
          <Text variant="body" className="text-muted">
            Ingresá tu nueva contraseña.
          </Text>
        </div>

        <Card className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
                <Lock className="w-4 h-4 text-muted" />
                Nueva contraseña
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                disabled={isPending}
                minLength={8}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
                <Lock className="w-4 h-4 text-muted" />
                Confirmar contraseña
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí tu contraseña"
                required
                disabled={isPending}
                minLength={8}
              />
            </div>

            {(error || validationError) && (
              <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                <Text variant="small" className="text-danger">
                  {validationError ||
                    error?.message ||
                    "Error al restablecer la contraseña. Por favor, intentá nuevamente."}
                </Text>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full flex items-center gap-2 justify-center"
              disabled={isPending || !newPassword || !confirmPassword}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Restableciendo...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Restablecer contraseña
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
