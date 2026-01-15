import { Suspense } from "react";
import { ConfirmEmailScreen } from "@/screens/auth/ConfirmEmailScreen";
import { AuthPageSkeleton } from "@/components/auth/AuthPageSkeleton";

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <ConfirmEmailScreen />
    </Suspense>
  );
}
