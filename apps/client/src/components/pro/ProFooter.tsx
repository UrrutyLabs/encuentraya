import Link from "next/link";
import { Wrench } from "lucide-react";
import { Text } from "@repo/ui";

export function ProFooter() {
  return (
    <footer className="px-4 py-8 border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-muted" />
            <Text variant="small" className="text-muted">
              © Arreglatodo — Hecho para resolver lo cotidiano.
            </Text>
          </div>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-muted hover:text-text transition-colors"
            >
              <Text variant="small">Términos</Text>
            </Link>
            <Link
              href="/pro/faqs"
              className="text-muted hover:text-text transition-colors"
            >
              <Text variant="small">Preguntas frecuentes</Text>
            </Link>
            <Link
              href="#"
              className="text-muted hover:text-text transition-colors"
            >
              <Text variant="small">Privacidad</Text>
            </Link>
            <Link
              href="/contact"
              className="text-muted hover:text-text transition-colors"
            >
              <Text variant="small">Contacto</Text>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
