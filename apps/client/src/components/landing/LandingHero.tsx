import Link from "next/link";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";

export function LandingHero() {
  return (
    <section className="px-4 py-16 md:py-24 lg:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <Text variant="h1" className="mb-6 text-primary">
          Arreglatodo
        </Text>
        <Text variant="h2" className="mb-4 text-text max-w-2xl mx-auto">
          Soluciones confiables para tu hogar, en un solo lugar.
        </Text>
        <Text variant="body" className="mb-8 text-muted max-w-xl mx-auto">
          Encontrá, reservá y pagá profesionales verificados para arreglos y servicios cotidianos.
        </Text>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/search">
            <Button variant="primary" className="px-8 py-3 text-lg w-full sm:w-auto">
              Buscar profesionales
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="px-8 py-3 text-lg w-full sm:w-auto">
              Soy profesional
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
