import { Clock, Users, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";

export function LandingHowItWorks() {
  return (
    <section className="px-4 py-16 bg-surface">
      <div className="max-w-6xl mx-auto">
        <Text variant="h2" className="text-center mb-12 text-text">
          Cómo funciona
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <Text variant="h2" className="mb-2 text-text">
                Contanos qué necesitás
              </Text>
            </div>
            <Text variant="body" className="text-muted">
              Elegí el servicio y el horario.
            </Text>
          </Card>

          <Card className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <Text variant="h2" className="mb-2 text-text">
                Un profesional acepta
              </Text>
            </div>
            <Text variant="body" className="text-muted">
              Personas reales, perfiles claros, precios visibles.
            </Text>
          </Card>

          <Card className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
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
