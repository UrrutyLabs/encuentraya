"use client";

import { Suspense } from "react";
import { PhotosStep } from "@/components/wizard/steps/PhotosStep";
import { JobCreateSkeleton } from "@/components/presentational/JobCreateSkeleton";
import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";

function PhotosContent() {
  return <PhotosStep />;
}

export const dynamic = "force-dynamic";

export default function PhotosPage() {
  return (
    <AuthenticatedGuard requiredRole={Role.CLIENT}>
      <Suspense fallback={<JobCreateSkeleton />}>
        <PhotosContent />
      </Suspense>
    </AuthenticatedGuard>
  );
}
