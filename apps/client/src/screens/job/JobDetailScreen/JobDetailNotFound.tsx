"use client";

import Link from "next/link";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { JOB_LABELS } from "@/utils/jobLabels";

export function JobDetailNotFound() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6 md:p-8 text-center">
        <Text variant="h2" className="mb-2 text-text">
          Trabajo no encontrado
        </Text>
        <Text variant="body" className="text-muted mb-4">
          El trabajo que buscas no existe o fue eliminado.
        </Text>
        <Link href="/my-jobs">
          <Button variant="primary">{JOB_LABELS.backToJobs}</Button>
        </Link>
      </Card>
    </div>
  );
}
