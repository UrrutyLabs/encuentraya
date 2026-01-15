"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { AuthForm } from "@/components/forms/AuthForm";
import { Text, Card } from "@repo/ui";

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordChanged = searchParams.get("passwordChanged") === "true";
  const returnUrl = searchParams.get("returnUrl");

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      // If there's a returnUrl, go there; otherwise go to search
      if (returnUrl) {
        router.replace(decodeURIComponent(returnUrl));
      } else {
        router.replace("/search");
      }
    }
  }, [user, authLoading, router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Redirect to returnUrl if provided, otherwise to search
      if (returnUrl) {
        router.push(decodeURIComponent(returnUrl));
      } else {
        router.push("/search");
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <Text variant="body" className="text-muted">
            Cargando...
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="max-w-md w-full space-y-8 p-8 bg-surface rounded-lg border border-border">
        <div className="flex items-center justify-center gap-2">
          <LogIn className="w-6 h-6 text-primary" />
          <Text variant="h1" className="text-center text-text">
            Iniciar sesión
          </Text>
        </div>
        {passwordChanged && (
          <Card className="p-4 bg-success/10 border-success/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success shrink-0" />
              <Text variant="body" className="text-success">
                Tu contraseña ha sido cambiada. Por favor, iniciá sesión con tu
                nueva contraseña.
              </Text>
            </div>
          </Card>
        )}
        <AuthForm
          mode="login"
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          footerLink={{
            text: "¿No tenés cuenta?",
            linkText: "Registrate",
            href: returnUrl ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}` : "/signup",
          }}
        />
      </div>
    </div>
  );
}
