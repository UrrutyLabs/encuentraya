import Link from "next/link";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { JOB_LABELS } from "@/utils/jobLabels";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <Text variant="h1" className="mb-4 text-primary">
              Pago autorizado
            </Text>
            <Text variant="body" className="mb-6 text-text">
              Pago autorizado. Ya podés seguir con tu trabajo.
            </Text>
            <Link href="/my-jobs">
              <Button variant="primary">{JOB_LABELS.myJobs}</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
