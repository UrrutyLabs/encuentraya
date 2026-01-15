import { Suspense } from "react";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { AuthPageSkeleton } from "@/components/auth/AuthPageSkeleton";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <LoginScreen />
    </Suspense>
  );
}
