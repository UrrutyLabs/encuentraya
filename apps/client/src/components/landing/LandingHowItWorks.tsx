"use client";

import { Clock, Users, CheckCircle } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { useScrollReveal } from "@/hooks/shared/useScrollReveal";

export function LandingHowItWorks() {
  const { elementRef: titleRef, isVisible: titleVisible } = useScrollReveal();
  const { elementRef: cardsRef, isVisible: cardsVisible } = useScrollReveal();

  return (
    <section className="px-4 py-16 bg-surface">
      <div className="max-w-6xl mx-auto">
        <div ref={titleRef}>
          <Text
            variant="h2"
            className={`text-center mb-12 text-text transition-all duration-600 ${
              titleVisible ? "animate-[fadeInDown_0.6s_ease-out]" : "opacity-0"
            }`}
          >
            Cómo funciona
          </Text>
        </div>
        <div
          ref={cardsRef}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-600 ${
            cardsVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <Card
            className={`text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1 ${
              cardsVisible ? "animate-[slideUp_0.6s_ease-out_0.1s_both]" : ""
            }`}
          >
            <div className="mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <Clock className="w-8 h-8 text-primary transition-transform duration-300" />
              </div>
              <Text variant="h2" className="mb-2 text-text">
                Contanos qué necesitás
              </Text>
            </div>
            <Text variant="body" className="text-muted">
              Elegí el servicio y el horario.
            </Text>
          </Card>

          <Card
            className={`text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1 ${
              cardsVisible ? "animate-[slideUp_0.6s_ease-out_0.25s_both]" : ""
            }`}
          >
            <div className="mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <Users className="w-8 h-8 text-primary transition-transform duration-300 group-hover:rotate-12" />
              </div>
              <Text variant="h2" className="mb-2 text-text">
                Un profesional acepta
              </Text>
            </div>
            <Text variant="body" className="text-muted">
              Personas reales, perfiles claros. Precio por hora o presupuesto
              según el rubro.
            </Text>
          </Card>

          <Card
            className={`text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1 ${
              cardsVisible ? "animate-[slideUp_0.6s_ease-out_0.4s_both]" : ""
            }`}
          >
            <div className="mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <CheckCircle className="w-8 h-8 text-primary transition-transform duration-300" />
              </div>
              <Text variant="h2" className="mb-2 text-text">
                Trabajo hecho, pago seguro
              </Text>
            </div>
            <Text variant="body" className="text-muted">
              Pagás desde la app cuando el trabajo se completa.
            </Text>
          </Card>
        </div>
      </div>
    </section>
  );
}
