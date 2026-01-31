"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";

export function LandingHero() {
  return (
    <section className="relative px-4 py-16 md:py-24 lg:py-32 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero.jpg"
          alt="Profesional trabajando en instalación de pisos"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-linear-to-r from-bg/95 via-bg/90 to-bg/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <Text
              variant="h1"
              className="mb-6 text-primary animate-[fadeInDown_0.6s_ease-out]"
            >
              EncuentraYa
            </Text>
            <Text
              variant="h2"
              className="mb-4 text-text max-w-2xl mx-auto lg:mx-0 animate-[fadeInUp_0.6s_ease-out_0.15s_both]"
            >
              Soluciones confiables para tu hogar, en un solo lugar.
            </Text>
            <Text
              variant="body"
              className="mb-8 text-muted max-w-xl mx-auto lg:mx-0 animate-[fadeIn_0.6s_ease-out_0.3s_both]"
            >
              Encontrá, reservá y pagá profesionales verificados para arreglos y
              servicios cotidianos.
            </Text>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/search"
                className="animate-[fadeInUp_0.6s_ease-out_0.45s_both]"
              >
                <Button
                  variant="primary"
                  className="px-8 py-3 text-lg w-full sm:w-auto transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Buscar profesionales
                </Button>
              </Link>
              <Link
                href="/pro"
                className="animate-[fadeInUp_0.6s_ease-out_0.5s_both]"
              >
                <Button
                  variant="ghost"
                  className="px-8 py-3 text-lg w-full sm:w-auto transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Soy profesional
                </Button>
              </Link>
            </div>
          </div>

          {/* Image Content - Visible on larger screens */}
          <div className="hidden lg:block relative h-[400px] rounded-lg overflow-hidden shadow-2xl animate-[fadeIn_0.6s_ease-out_0.4s_both]">
            <Image
              src="/hero.jpg"
              alt="Profesional trabajando en instalación de pisos"
              fill
              className="object-cover"
              quality={90}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
