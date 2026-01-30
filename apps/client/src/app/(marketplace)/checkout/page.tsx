import { CheckoutScreen } from "@/screens/job/CheckoutScreen";
import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";

export default function CheckoutPage() {
  return (
    <AuthenticatedGuard requiredRole={Role.CLIENT}>
      <CheckoutScreen />
    </AuthenticatedGuard>
  );
}
