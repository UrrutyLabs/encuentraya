"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Text } from "@repo/ui";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { JOB_LABELS } from "@/utils/jobLabels";

interface JobDetailHeaderProps {
  statusLabel: string;
  statusVariant: "success" | "info" | "warning" | "danger" | "new";
}

export function JobDetailHeader({
  statusLabel,
  statusVariant,
}: JobDetailHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <Link href="/my-jobs">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
        <Badge variant={statusVariant} showIcon>
          {statusLabel}
        </Badge>
      </div>
      <Text variant="h1" className="mb-4 md:mb-6 text-primary">
        {JOB_LABELS.jobDetails}
      </Text>
    </>
  );
}
