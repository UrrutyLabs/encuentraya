import { Briefcase } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Badge } from "@repo/ui";
import type { Category } from "@repo/domain";

interface ProServicesOfferedProps {
  categories: Category[];
}

/**
 * Pro Services Offered Component
 * Displays category chips/badges
 */
export function ProServicesOffered({ categories }: ProServicesOfferedProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-primary" />
        <Text variant="h2" className="text-text">
          Servicios Ofrecidos
        </Text>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge key={category.id} variant="info">
            {category.name}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
