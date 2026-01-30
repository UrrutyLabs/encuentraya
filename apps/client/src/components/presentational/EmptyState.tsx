import { SearchX, Inbox, Filter } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Button } from "@repo/ui";
import { useRouter } from "next/navigation";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "search" | "inbox" | "filter";
  suggestions?: string[];
  onClearFilters?: () => void;
}

export function EmptyState({
  title = "No se encontraron resultados",
  description = "Intenta ajustar los filtros de búsqueda.",
  icon = "search",
  suggestions,
  onClearFilters,
}: EmptyStateProps) {
  const router = useRouter();
  const IconComponent =
    icon === "search" ? SearchX : icon === "inbox" ? Inbox : Filter;

  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    } else {
      router.push("/search/results");
    }
  };

  return (
    <Card className="p-6 md:p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
          <IconComponent className="w-8 h-8 text-muted" />
        </div>
      </div>
      <Text variant="h2" className="mb-2 text-text">
        {title}
      </Text>
      <Text variant="body" className="text-muted mb-4">
        {description}
      </Text>
      {suggestions && suggestions.length > 0 && (
        <div className="mb-4">
          <Text variant="small" className="text-muted mb-2 block">
            Sugerencias:
          </Text>
          <ul className="list-disc list-inside text-left max-w-md mx-auto space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <Text variant="small" className="text-muted">
                  {suggestion}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      )}
      {onClearFilters !== undefined && (
        <Button onClick={handleClearFilters} variant="ghost" className="mt-4">
          Limpiar filtros
        </Button>
      )}
    </Card>
  );
}
