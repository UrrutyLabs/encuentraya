"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";
import { JobCreateSkeleton } from "@/components/presentational/JobCreateSkeleton";

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to wizard first step with ALL existing query params
    // Preserve category, subcategory, proId, rebookFrom, and any other params
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    router.replace(`/book/wizard/service-details?${params.toString()}`);
  }, [searchParams, router]);

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
