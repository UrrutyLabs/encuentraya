"use client";

import Link from "next/link";
import { FAQ } from "@/components/landing/FAQ";
import { Button } from "@repo/ui";
import { ProHeader } from "@/components/pro/ProHeader";
import { ProFooter } from "@/components/pro/ProFooter";
import { proFAQItems } from "@repo/content";

export function ProFAQScreen() {
  return (
    <div className="min-h-screen bg-bg">
      <ProHeader />
      <FAQ
        title="Preguntas frecuentes para profesionales"
        description="Resolvemos tus dudas sobre cómo trabajar con EncuentraYa"
        items={proFAQItems}
        showContactCTA={false}
      />
      <div className="px-4 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/pro">
            <Button variant="primary" className="px-8 py-3 text-lg">
              Registrarme como profesional
            </Button>
          </Link>
        </div>
      </div>
      <ProFooter />
    </div>
  );
}
