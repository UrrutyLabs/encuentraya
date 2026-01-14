"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/admin");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <p className="text-gray-600">Cargando...</p>
    </main>
  );
}
