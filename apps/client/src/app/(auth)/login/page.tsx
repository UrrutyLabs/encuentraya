import { Suspense } from "react";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { Loader2 } from "lucide-react";
import { Text } from "@repo/ui";

function LoginScreenFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <Text variant="body" className="text-muted">
          Cargando...
        </Text>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginScreenFallback />}>
      <LoginScreen />
    </Suspense>
  );
}
