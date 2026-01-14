import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export function LandingForProfessionals() {
  return (
    <section className="px-4 py-16 bg-surface">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Briefcase className="w-8 h-8 text-primary" />
          <Text variant="h2" className="text-text">
            ¿Sos profesional?
          </Text>
        </div>
        <Text variant="body" className="mb-8 text-muted max-w-2xl mx-auto">
          Sumate a Arreglatodo y conseguí trabajos sin intermediarios innecesarios.
        </Text>
        <Link href="/login">
          <Button variant="primary" className="px-8 py-3 text-lg">
            Registrarme como profesional
          </Button>
        </Link>
      </div>
    </section>
  );
}
