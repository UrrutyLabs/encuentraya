"use client";

import { MessageSquare } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { useOrderChat } from "@/hooks/useOrders";

interface OrderDetailChatProps {
  orderId: string;
}

const SENDER_LABELS: Record<string, string> = {
  client: "Cliente",
  pro: "Pro",
  admin: "Admin",
  system: "Sistema",
};

export function OrderDetailChat({ orderId }: OrderDetailChatProps) {
  const { data, isLoading } = useOrderChat(orderId);

  const messages = data?.items ?? [];
  const chronological = [...messages].reverse();

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-gray-600" />
        <Text variant="h2">Chat del pedido</Text>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 rounded animate-pulse"
              data-testid="chat-skeleton"
            />
          ))}
        </div>
      ) : chronological.length === 0 ? (
        <Text variant="body" className="text-gray-600">
          No hay mensajes en este pedido.
        </Text>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {chronological.map((msg) => (
            <div
              key={msg.id}
              className="p-3 rounded-lg bg-gray-50 border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-1">
                <Text variant="small" className="font-medium text-gray-700">
                  {SENDER_LABELS[msg.senderRole] ?? msg.senderRole}
                </Text>
                <Text variant="small" className="text-gray-500">
                  {new Date(msg.createdAt).toLocaleString("es-UY", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </Text>
              </div>
              <Text
                variant="body"
                className="text-gray-900 whitespace-pre-wrap"
              >
                {msg.text}
              </Text>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
