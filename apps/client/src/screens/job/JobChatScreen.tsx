"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui";
import { AppShell } from "@/components/presentational/AppShell";
import { OrderChatSection } from "@/components/chat/OrderChatSection";

export function JobChatScreen() {
  const params = useParams();
  const orderId = params.jobId as string;

  return (
    <AppShell showLogin={false}>
      <div className="px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 md:mb-6 hidden md:block">
            <Link href={`/my-jobs/${orderId}`}>
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al trabajo
              </Button>
            </Link>
          </div>
          {orderId && <OrderChatSection orderId={orderId} isClient />}
        </div>
      </div>
    </AppShell>
  );
}
