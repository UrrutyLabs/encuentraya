"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";
import { JobCreateSkeleton } from "@/components/presentational/JobCreateSkeleton";

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proId = searchParams.get("proId");
  const rebookFrom = searchParams.get("rebookFrom");

  useEffect(() => {
    // Redirect to wizard first step with existing query params
    const params = new URLSearchParams();
    if (proId) params.set("proId", proId);
    if (rebookFrom) params.set("rebookFrom", rebookFrom);

    router.replace(`/book/wizard/service-details?${params.toString()}`);
  }, [proId, rebookFrom, router]);

  return (
    <div className="min-h-screen bg-bg">
      <JobCreateSkeleton />
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function BookPage() {
  return (
    <AuthenticatedGuard requiredRole={Role.CLIENT}>
      <BookPageContent />
    </AuthenticatedGuard>
  );
}
