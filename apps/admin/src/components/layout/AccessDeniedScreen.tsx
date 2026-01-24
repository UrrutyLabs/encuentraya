"use client";

import Link from "next/link";
import { Text } from "@repo/ui";
import { Button } from "@repo/ui";

export function AccessDeniedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow text-center">
        <Text variant="h1" className="text-gray-900">
          Acceso denegado
        </Text>
        <Text variant="body" className="text-gray-600">
          No tenés permisos para acceder a esta sección. Solo los
          administradores pueden acceder.
        </Text>
        <Link href="/login">
          <Button variant="primary" className="w-full">
            Ir a inicio de sesión
          </Button>
        </Link>
      </div>
    </div>
  );
}
