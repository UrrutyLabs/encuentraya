"use client";

import { ReactNode, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Navigation } from "@/components/presentational/Navigation";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { JobCreateSkeleton } from "@/components/presentational/JobCreateSkeleton";

interface BookWizardLayoutProps {
  children: ReactNode;
}

const STEP_LABELS = [
  "Detalles del servicio",
  "Ubicación y duración",
  "Revisar y confirmar",
];

export default function BookWizardLayout({ children }: BookWizardLayoutProps) {
  const pathname = usePathname();

  // Determine current step number based on route
  const stepMap: Record<string, number> = {
    "/book/wizard/service-details": 1,
    "/book/wizard/location": 2,
    "/book/wizard/review": 3,
  };

  const currentStep = stepMap[pathname] || 1;

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <Suspense fallback={<JobCreateSkeleton />}>
        <WizardLayout currentStep={currentStep} stepLabels={STEP_LABELS}>
          {children}
        </WizardLayout>
      </Suspense>
    </div>
  );
}
