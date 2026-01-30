"use client";

import { Suspense } from "react";
import { ReviewStep } from "@/components/wizard/steps/ReviewStep";
import { JobCreateSkeleton } from "@/components/presentational/JobCreateSkeleton";
import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";

function ReviewContent() {
  const handleBack = () => {
    // Navigation handled by component
  };

  return <ReviewStep onBack={handleBack} />;
}

export const dynamic = "force-dynamic";

export default function ReviewPage() {
  return (
    <AuthenticatedGuard requiredRole={Role.CLIENT}>
      <Suspense fallback={<JobCreateSkeleton />}>
        <ReviewContent />
      </Suspense>
    </AuthenticatedGuard>
  );
}
