"use client";

import Link from "next/link";
import { Wrench } from "lucide-react";
import { Text } from "@repo/ui";

export function LandingFooter() {
  return (
    <footer className="px-4 py-8 border-t border-border bg-surface animate-[fadeIn_0.5s_ease-out]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 transition-transform duration-200 hover:scale-105">
            <Wrench className="w-5 h-5 text-muted transition-transform duration-300" />
            <Text variant="small" className="text-muted">
              © EncuentraYa — Hecho para resolver lo cotidiano.
            </Text>
          </div>
          <div className="flex gap-6">
            <Link
              href="/#how-it-works"
              className="text-muted hover:text-text transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Text variant="small">Cómo funciona</Text>
            </Link>
            <Link
              href="#"
              className="text-muted hover:text-text transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Text variant="small">Términos</Text>
            </Link>
            <Link
              href="/faqs"
              className="text-muted hover:text-text transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Text variant="small">Preguntas frecuentes</Text>
            </Link>
            <Link
              href="#"
              className="text-muted hover:text-text transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Text variant="small">Privacidad</Text>
            </Link>
            <Link
              href="/contact"
              className="text-muted hover:text-text transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Text variant="small">Contacto</Text>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
