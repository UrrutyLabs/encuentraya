import { JobChatScreen } from "@/screens/job/JobChatScreen";
import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";

export default function JobChatPage() {
  return (
    <AuthenticatedGuard requiredRole={Role.CLIENT}>
      <JobChatScreen />
    </AuthenticatedGuard>
  );
}
