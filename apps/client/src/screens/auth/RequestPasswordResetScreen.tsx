"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { useRequestPasswordReset } from "@/hooks/auth";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Text, Card } from "@repo/ui";
import Link from "next/link";

export function RequestPasswordResetScreen() {
  const router = useRouter();
  const { requestPasswordReset, isPending, error } = useRequestPasswordReset();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch {
      // Error is handled by mutation state
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-success/10 p-3">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <Text variant="h1" className="text-text">
              Email enviado
            </Text>
            <Text variant="body" className="text-muted">
              Si existe una cuenta con el email {email}, recibirás un enlace
              para restablecer tu contraseña.
            </Text>
          </div>
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Volver al inicio de sesión
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
            >
              Enviar otro email
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <Text variant="h1" className="text-text">
            Recuperar contraseña
          </Text>
          <Text variant="body" className="text-muted">
            Ingresá tu email y te enviaremos un enlace para restablecer tu
            contraseña.
          </Text>
        </div>

        <Card className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-md">
                <Text variant="small" className="text-danger">
                  {error.message ||
                    "Error al enviar el email. Por favor, intentá nuevamente."}
                </Text>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full flex items-center gap-2 justify-center"
              disabled={isPending || !email}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Enviar enlace de recuperación
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-border">
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
