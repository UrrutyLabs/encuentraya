"use client";

import Link from "next/link";
import { Wrench } from "lucide-react";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";

export function LandingHeader() {
  return (
    <header className="px-4 py-4 border-b border-border bg-surface animate-[fadeIn_0.4s_ease-out]">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 transition-all duration-200 hover:scale-105 group"
        >
          <Wrench className="w-8 h-8 text-primary transition-transform duration-300" />
          <Text variant="h2" className="text-primary">
            EncuentraYa
          </Text>
        </Link>
        <Link href="/login">
          <Button variant="ghost" className="px-6">
            Iniciar sesión
          </Button>
        </Link>
      </div>
    </header>
  );
}
