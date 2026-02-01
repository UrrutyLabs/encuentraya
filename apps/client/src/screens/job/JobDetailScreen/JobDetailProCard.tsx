"use client";

import Link from "next/link";
import { User, MessageCircle } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";

interface ProInfo {
  id: string;
  name: string;
  hourlyRate: number;
}

interface JobDetailProCardProps {
  pro: ProInfo;
  orderId: string;
  showChatLink: boolean;
}

export function JobDetailProCard({
  pro,
  orderId,
  showChatLink,
}: JobDetailProCardProps) {
  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-primary" />
        <Text variant="h2" className="text-text">
          Profesional
        </Text>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Text variant="body" className="text-text font-medium mb-1">
            {pro.name}
          </Text>
          <Text variant="small" className="text-muted">
            ${pro.hourlyRate.toFixed(0)}/hora
          </Text>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/pros/${pro.id}`}>
            <Button variant="ghost" className="flex items-center gap-2">
              Ver perfil
            </Button>
          </Link>
          {showChatLink && (
            <Link href={`/my-jobs/${orderId}/chat`}>
              <Button
                variant="ghost"
                className="flex items-center gap-2 border border-primary text-primary hover:bg-primary/5"
              >
                <MessageCircle className="w-4 h-4" />
                Mensajes
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
