import { SearchX, Inbox } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "search" | "inbox";
}

export function EmptyState({
  title = "No se encontraron resultados",
  description = "Intenta ajustar los filtros de búsqueda.",
  icon = "search",
}: EmptyStateProps) {
  const IconComponent = icon === "search" ? SearchX : Inbox;

  return (
    <Card className="p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
          <IconComponent className="w-8 h-8 text-muted" />
        </div>
      </div>
      <Text variant="h2" className="mb-2 text-text">
        {title}
      </Text>
      <Text variant="body" className="text-muted">
        {description}
      </Text>
    </Card>
  );
}
