"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { useScrollReveal } from "@/hooks/shared/useScrollReveal";

export function LandingForProfessionals() {
  const { elementRef, isVisible } = useScrollReveal();

  return (
    <section className="px-4 py-16 bg-surface">
      <div
        ref={elementRef}
        className={`max-w-4xl mx-auto text-center transition-all duration-600 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className={`flex items-center justify-center gap-3 mb-4 ${
            isVisible ? "animate-[fadeInDown_0.6s_ease-out_0.1s_both]" : ""
          }`}
        >
          <Briefcase className="w-8 h-8 text-primary transition-transform duration-300 hover:scale-110" />
          <Text variant="h2" className="text-text">
            ¿Sos profesional?
          </Text>
        </div>
        <Text
          variant="body"
          className={`mb-8 text-muted max-w-2xl mx-auto ${
            isVisible ? "animate-[fadeIn_0.6s_ease-out_0.25s_both]" : ""
          }`}
        >
          Sumate a EncuentraYa y conseguí trabajos sin intermediarios
          innecesarios.
        </Text>
        <Link
          href="/pro"
          className={`inline-block ${
            isVisible ? "animate-[fadeInUp_0.6s_ease-out_0.4s_both]" : ""
          }`}
        >
          <Button
            variant="primary"
            className="px-8 py-3 text-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Registrarme como profesional
          </Button>
        </Link>
      </div>
    </section>
  );
}
