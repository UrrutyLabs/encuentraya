"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, AlertTriangle } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import {
  useChatMessages,
  useSendMessage,
  useChatMeta,
  useMarkRead,
} from "@/hooks/chat";

/** Message shown when contact info is detected (must match API). */
const CHAT_CONTACT_INFO_MESSAGE =
  "No está permitido compartir teléfono, email u otros datos de contacto. Hacerlo puede resultar en la suspensión de tu cuenta.";

function isContactInfoError(error: { message?: string } | null): boolean {
  const msg = error?.message ?? "";
  return (
    msg.includes("suspensión de tu cuenta") || msg.includes("datos de contacto")
  );
}

type ChatMessage = {
  id: string;
  orderId: string;
  senderUserId: string | null;
  senderRole: "client" | "pro" | "admin" | "system";
  type: "user" | "system";
  text: string;
  attachmentsJson: Record<string, unknown> | null;
  createdAt: Date;
};

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function OrderChatSection({
  orderId,
  isClient,
}: {
  orderId: string;
  isClient: boolean;
}) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    items,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessages(orderId);
  const { sendMessage, isSending, error: sendError } = useSendMessage(orderId);
  const { unreadCount, isChatOpen } = useChatMeta(orderId);
  const { markRead } = useMarkRead(orderId);
  const lastMarkedOrderIdRef = useRef<string | null>(null);

  // Mark as read once when viewing this order's chat (not on every re-render/poll)
  useEffect(() => {
    if (!orderId) return;
    if (lastMarkedOrderIdRef.current === orderId) return;
    lastMarkedOrderIdRef.current = orderId;
    markRead();
  }, [orderId, markRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending || !isChatOpen) return;
    try {
      await sendMessage({ orderId, text });
      setInputText("");
    } catch {
      // Error surfaced via sendError
    }
  };

  if (error) {
    return (
      <Card className="p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <Text variant="h2" className="text-text">
            Chat
          </Text>
        </div>
        <Text variant="body" className="text-danger">
          {error.message}
        </Text>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        <Text variant="h2" className="text-text">
          Chat
        </Text>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-primary text-white text-xs font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      <div className="flex flex-col min-h-[200px] max-h-[400px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <Text variant="body" className="text-muted">
              Cargando mensajes...
            </Text>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pb-4">
            {items.length === 0 ? (
              <Text variant="body" className="text-muted py-4">
                No hay mensajes aún. Escribí para iniciar la conversación.
              </Text>
            ) : (
              items.map((item: ChatMessage) => {
                const isOwn = item.senderRole === "client" && isClient;
                const isSystem =
                  item.type === "system" || item.senderRole === "system";

                if (isSystem) {
                  return (
                    <div key={item.id} className="flex justify-center">
                      <Text variant="small" className="text-muted">
                        {item.text}
                      </Text>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        isOwn
                          ? "bg-primary text-white"
                          : "bg-muted/50 border border-border"
                      }`}
                    >
                      <Text
                        variant="body"
                        className={isOwn ? "text-white" : "text-text"}
                      >
                        {item.text}
                      </Text>
                      <Text
                        variant="small"
                        className={
                          isOwn
                            ? "text-white/80 mt-1 text-right"
                            : "text-muted mt-1 text-right"
                        }
                      >
                        {formatTime(item.createdAt)}
                      </Text>
                    </div>
                  </div>
                );
              })
            )}
            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  className="text-sm py-2"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Cargando..." : "Ver más"}
                </Button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {sendError && (
          <div className="mb-2">
            {isContactInfoError(sendError) ? (
              <div
                role="alert"
                className="flex gap-2 p-3 rounded-lg border border-danger/50 bg-danger/10"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 text-danger mt-0.5" />
                <div>
                  <Text variant="small" className="font-medium text-danger">
                    Mensaje no permitido
                  </Text>
                  <Text variant="small" className="text-danger/90 mt-0.5">
                    {CHAT_CONTACT_INFO_MESSAGE}
                  </Text>
                </div>
              </div>
            ) : (
              <Text variant="small" className="text-danger">
                {sendError.message}
              </Text>
            )}
          </div>
        )}

        {isChatOpen ? (
          <div className="flex gap-2 pt-2 border-t border-border">
            <input
              type="text"
              placeholder="Escribí un mensaje..."
              className="flex-1 min-h-[40px] rounded-lg border border-border bg-bg px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              maxLength={10000}
              disabled={isSending}
            />
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
              className="flex items-center gap-2 shrink-0"
            >
              {isSending ? (
                <span className="text-sm">Enviando...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="pt-3 mt-2 border-t border-border">
            <Text variant="small" className="text-muted text-center block">
              El chat está cerrado. Solo podés ver el historial.
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
}
