import Link from "next/link";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { AppShell } from "@/components/presentational/AppShell";
import { JOB_LABELS } from "@/utils/jobLabels";

export default function PaymentFailurePage() {
  return (
    <AppShell showLogin={false}>
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <Text variant="h1" className="mb-4 text-primary">
              Pago no autorizado
            </Text>
            <Text variant="body" className="mb-6 text-text">
              No se pudo autorizar el pago. Podés intentar nuevamente.
            </Text>
            <Link href="/my-jobs">
              <Button variant="primary">{JOB_LABELS.myJobs}</Button>
            </Link>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
