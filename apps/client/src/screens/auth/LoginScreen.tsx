"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/forms/AuthForm";
import { Text } from "@/components/ui/Text";

export function LoginScreen() {
  const router = useRouter();
  const { user, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/search");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/search");
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
            href: "/signup",
          }}
        />
      </div>
    </div>
  );
}
