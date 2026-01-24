import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedGuard requiredRole={Role.CLIENT}>
      {children}
    </AuthenticatedGuard>
  );
}
