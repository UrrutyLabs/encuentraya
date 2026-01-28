import { ReviewCreateScreen } from "@/screens/job/ReviewCreateScreen";
import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";

export default function ReviewCreatePage() {
  return (
    <AuthenticatedGuard requiredRole={Role.CLIENT}>
      <ReviewCreateScreen />
    </AuthenticatedGuard>
  );
}
