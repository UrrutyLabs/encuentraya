import { LucideIcon } from "lucide-react";
import { Text } from "../atoms/Text";
import { Card } from "../atoms/Card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted" />
        </div>
        <Text variant="h2" className="mb-2 text-text">
          {title}
        </Text>
        {description && (
          <Text variant="body" className="text-muted max-w-md">
            {description}
          </Text>
        )}
      </div>
    </Card>
  );
}
