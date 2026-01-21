"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Smartphone,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
  Download,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@repo/ui";
import { Text, Card } from "@repo/ui";
import { AuthPageSkeleton } from "@/components/auth/AuthPageSkeleton";
import { ProHeader } from "@/components/pro/ProHeader";
import { useAuth } from "@/hooks/auth";

function ProDownloadAppContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { user, session } = useAuth();

  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get email from session if not in URL params
  const displayEmail = email || session?.user?.email || "";

  const handleResendEmail = async () => {
    const emailToResend = displayEmail;
    if (!emailToResend) {
      setError("No se encontró el email");
      return;
    }

    try {
      setResending(true);
      setError(null);
      setResendSuccess(false);

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: emailToResend,
      });

      if (resendError) {
        setError(resendError.message || "Error al reenviar el email");
        return;
      }

      setResendSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al reenviar el email. Por favor, intentá nuevamente."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <ProHeader />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-73px)]">
        <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Smartphone className="w-12 h-12 text-primary" />
          </div>
          <Text variant="h1" className="text-text">
            Descargá la app móvil
          </Text>
          <Text variant="body" className="text-muted">
            Para completar tu registro y empezar a recibir trabajos, necesitás descargar nuestra app móvil
          </Text>
        </div>

        <Card className="p-8 space-y-6">
          {!user && displayEmail && (
            <div className="flex items-start gap-2 p-4 bg-info/10 border border-info/20 rounded-md mb-4">
              <AlertCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
              <div className="flex-1">
                <Text variant="body" className="text-info font-semibold mb-1">
                  Confirmá tu email para continuar
                </Text>
                <Text variant="small" className="text-muted">
                  Te enviamos un email de confirmación a <span className="font-medium text-text">{displayEmail}</span>. 
                  Hacé click en el link del email para confirmar tu cuenta. 
                  Luego podrás descargar la app y completar tu perfil profesional.
                </Text>
              </div>
            </div>
          )}
          {user && session?.user?.email_confirmed_at && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-md mb-4">
              <CheckCircle className="w-5 h-5 text-success shrink-0" />
              <Text variant="body" className="text-success">
                ¡Email confirmado! Ya podés descargar la app y completar tu perfil.
              </Text>
            </div>
          )}
          <div className="space-y-4">
            <Text variant="body" className="text-text">
              {user && session?.user?.email_confirmed_at
                ? "En la app móvil podrás:"
                : "Una vez que confirmes tu email en la app móvil, podrás:"}
            </Text>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <Text variant="body" className="text-muted">
                  Completar tu perfil profesional
                </Text>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <Text variant="body" className="text-muted">
                  Configurar tus servicios y tarifas
                </Text>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <Text variant="body" className="text-muted">
                  Recibir y gestionar solicitudes de trabajo
                </Text>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <Text variant="body" className="text-muted">
                  Comunicarte con clientes
                </Text>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-border">
            <Text variant="body" className="text-text mb-4 text-center">
              Los enlaces de descarga estarán disponibles próximamente
            </Text>
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                disabled
                className="w-full flex items-center gap-2 justify-center opacity-50"
              >
                <Download className="w-4 h-4" />
                Descargar para iOS (Próximamente)
              </Button>
              <Button
                variant="primary"
                disabled
                className="w-full flex items-center gap-2 justify-center opacity-50"
              >
                <Download className="w-4 h-4" />
                Descargar para Android (Próximamente)
              </Button>
            </div>
          </div>

          {displayEmail && !user && (
            <div className="pt-4 border-t border-border space-y-4">
              <Text variant="body" className="text-text text-center">
                ¿No recibiste el email de confirmación?
              </Text>

              {resendSuccess && (
                <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-md">
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                  <Text variant="small" className="text-success text-center">
                    Email reenviado. Revisá tu bandeja de entrada.
                  </Text>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                  <Text variant="small" className="text-danger text-center">
                    {error}
                  </Text>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={handleResendEmail}
                disabled={resending || !displayEmail}
                className="w-full flex items-center gap-2 justify-center"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Reenviar email de confirmación
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
        </div>
      </div>
    </div>
  );
}

export function ProDownloadAppScreen() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <ProDownloadAppContent />
    </Suspense>
  );
}
