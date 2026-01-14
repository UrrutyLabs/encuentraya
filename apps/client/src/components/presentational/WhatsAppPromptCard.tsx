import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Button } from "@repo/ui";

export function WhatsAppPromptCard() {
  return (
    <Card className="p-4 mb-6 bg-accent/10 border-accent/20">
      <div className="flex items-start gap-3">
        <MessageCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="flex-1">
          <Text variant="body" className="mb-3 text-text">
            ¿Querés recibir avisos por WhatsApp?
          </Text>
          <Link href="/settings">
            <Button variant="secondary" className="w-full sm:w-auto flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Configurar
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
