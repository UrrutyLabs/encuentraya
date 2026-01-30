"use client";

import { Suspense } from "react";
import { ServiceDetailsStep } from "@/components/wizard/steps/ServiceDetailsStep";
import { JobCreateSkeleton } from "@/components/presentational/JobCreateSkeleton";
import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";

function ServiceDetailsContent() {
  const handleNext = () => {
    // Navigation handled by component
  };

  return <ServiceDetailsStep onNext={handleNext} />;
}

export const dynamic = "force-dynamic";

export default function ServiceDetailsPage() {
  return (
    <AuthenticatedGuard requiredRole={Role.CLIENT}>
      <Suspense fallback={<JobCreateSkeleton />}>
        <ServiceDetailsContent />
      </Suspense>
    </AuthenticatedGuard>
  );
}
