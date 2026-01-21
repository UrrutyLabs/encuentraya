"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Text } from "@repo/ui";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/admin/bookings");
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push("/admin/bookings");
      }
    } catch {
      setError("Error al iniciar sesión. Por favor, intentá nuevamente.");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Text variant="body" className="text-gray-600">
          Cargando...
        </Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <Text variant="h1" className="text-center text-gray-900">
          Admin - Iniciar sesión
        </Text>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <Text variant="small" className="text-red-600">
              {error}
            </Text>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Iniciando sesión..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
