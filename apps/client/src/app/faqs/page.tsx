"use client";

import { FAQ } from "@/components/landing/FAQ";
import { Navigation } from "@/components/presentational/Navigation";
import { clientFAQItems } from "@repo/content";

export default function ClientFAQPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={true} showProfile={true} />
      <FAQ
        title="Preguntas frecuentes"
        description="Resolvemos tus dudas sobre cómo funciona EncuentraYa"
        items={clientFAQItems}
      />
    </div>
  );
}
