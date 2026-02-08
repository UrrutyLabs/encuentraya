"use client";

import { FAQ } from "@/components/landing/FAQ";
import { AppShell } from "@/components/presentational/AppShell";
import { clientFAQItems } from "@repo/content";

export default function ClientFAQPage() {
  return (
    <AppShell showLogin={true}>
      <FAQ
        title="Preguntas frecuentes"
        description="Resolvemos tus dudas sobre cómo funciona EncuentraYa"
        items={clientFAQItems}
      />
    </AppShell>
  );
}
