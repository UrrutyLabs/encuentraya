import { Suspense } from "react";
import { SignupScreen } from "@/screens/auth/SignupScreen";
import { AuthPageSkeleton } from "@/components/auth/AuthPageSkeleton";

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <SignupScreen />
    </Suspense>
  );
}
