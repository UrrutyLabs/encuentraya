import { MyJobsScreen } from "@/screens/job/MyJobsScreen";
import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";

export default function MyJobsPage() {
  return (
    <AuthenticatedGuard returnUrl="/my-jobs" requiredRole={Role.CLIENT}>
      <MyJobsScreen />
    </AuthenticatedGuard>
  );
}
