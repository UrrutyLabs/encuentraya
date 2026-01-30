import { JobDetailScreen } from "@/screens/job/JobDetailScreen";
import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";

export default function JobDetailPage() {
  return (
    <AuthenticatedGuard requiredRole={Role.CLIENT}>
      <JobDetailScreen />
    </AuthenticatedGuard>
  );
}
