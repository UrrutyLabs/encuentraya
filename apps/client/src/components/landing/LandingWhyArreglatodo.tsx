"use client";

import { Shield, DollarSign, ShieldCheck, Headphones } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { useScrollReveal } from "@/hooks/shared/useScrollReveal";

export function LandingWhyArreglatodo() {
  const { elementRef: titleRef, isVisible: titleVisible } = useScrollReveal();
  const { elementRef: gridRef, isVisible: gridVisible } = useScrollReveal();

  return (
    <section className="px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div ref={titleRef}>
          <Text
            variant="h2"
            className={`text-center mb-12 text-text transition-all duration-600 ${
              titleVisible ? "animate-[fadeInDown_0.6s_ease-out]" : "opacity-0"
            }`}
          >
            Por qué Arreglatodo
          </Text>
        </div>
        <div
          ref={gridRef}
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-600 ${
            gridVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <Card
            className={`text-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-2 group ${
              gridVisible ? "animate-[slideUp_0.6s_ease-out_0.1s_both]" : ""
            }`}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:rotate-6">
              <Shield className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
            </div>
            <Text variant="h2" className="mb-2 text-text">
              Profesionales verificados
            </Text>
            <Text variant="body" className="text-muted">
              Todos los profesionales pasan por un proceso de verificación para
              garantizar calidad y confianza.
            </Text>
          </Card>

          <Card
            className={`text-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-2 group ${
              gridVisible ? "animate-[slideUp_0.6s_ease-out_0.25s_both]" : ""
            }`}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
              <DollarSign className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-125" />
            </div>
            <Text variant="h2" className="mb-2 text-text">
              Precios claros
            </Text>
            <Text variant="body" className="text-muted">
              Sabés cuánto vas a pagar antes de confirmar. Sin sorpresas, sin
              costos ocultos.
            </Text>
          </Card>

          <Card
            className={`text-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-2 group ${
              gridVisible ? "animate-[slideUp_0.6s_ease-out_0.4s_both]" : ""
            }`}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
              <ShieldCheck className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-125" />
            </div>
            <Text variant="h2" className="mb-2 text-text">
              Pagos seguros
            </Text>
            <Text variant="body" className="text-muted">
              Pagás solo cuando el trabajo está completo. Tu dinero está
              protegido hasta entonces.
            </Text>
          </Card>

          <Card
            className={`text-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-2 group ${
              gridVisible ? "animate-[slideUp_0.6s_ease-out_0.55s_both]" : ""
            }`}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
              <Headphones className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-125" />
            </div>
            <Text variant="h2" className="mb-2 text-text">
              Soporte local
            </Text>
            <Text variant="body" className="text-muted">
              Estamos acá, en Uruguay. Conocés a quién contactar si necesitás
              ayuda.
            </Text>
          </Card>
        </div>
      </div>
    </section>
  );
}
