"use client";

import { useState } from "react";

import {
  UserPlus,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import { useProSignup } from "@/hooks/auth";
import { Button, Input } from "@repo/ui";
import { Text, Card } from "@repo/ui";
import { ProHeader } from "@/components/pro/ProHeader";

export function ProSignupScreen() {
  const { signup, isPending, error: signupError } = useProSignup();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await signup({
        email,
        password,
      });
      // Success - mutation's onSuccess will handle redirect to confirm-email
    } catch (err) {
      // Error is handled by mutation state, but we can also set local error
      setError(
        err instanceof Error
          ? err.message
          : "Error al registrarse. Por favor, intentá nuevamente."
      );
    }
  };

  // Use error from mutation if available, otherwise use local error
  const displayError = signupError?.message || error;

  return (
    <div className="min-h-screen bg-bg">
      <ProHeader />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-73px)]">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <Text variant="h1" className="text-text">
              Registrarse como profesional
            </Text>
            <Text variant="body" className="text-muted">
              Creá tu cuenta para empezar a recibir trabajos
            </Text>
          </div>

          <Card className="p-8 space-y-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
                  <Mail className="w-4 h-4 text-muted" />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  disabled={isPending}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
                  <Lock className="w-4 h-4 text-muted" />
                  Contraseña
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  disabled={isPending}
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              {displayError && (
                <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                  <Text variant="small" className="text-danger">
                    {displayError}
                  </Text>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full flex items-center gap-2 justify-center"
                disabled={isPending || !email || !password}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Crear cuenta
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-border">
              <div className="flex items-start gap-3 p-4 bg-info/5 border border-info/10 rounded-md">
                <Smartphone className="w-5 h-5 text-info shrink-0 mt-0.5" />
                <div className="flex-1">
                  <Text variant="small" className="text-text font-medium mb-1">
                    ¿Ya tenés cuenta?
                  </Text>
                  <Text variant="small" className="text-muted">
                    Descargá la app móvil para iniciar sesión y gestionar tus
                    trabajos.
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
