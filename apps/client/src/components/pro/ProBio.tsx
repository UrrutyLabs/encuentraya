import { FileText } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";

interface ProBioProps {
  bio?: string;
}

/**
 * Pro Bio Component
 * Displays the professional's bio with a section header
 */
export function ProBio({ bio }: ProBioProps) {
  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <Text variant="h2" className="text-text">
          Acerca de
        </Text>
      </div>
      {bio ? (
        <Text variant="body" className="text-text whitespace-pre-line">
          {bio}
        </Text>
      ) : (
        <Text variant="body" className="text-muted">
          Este profesional aún no ha completado su biografía.
        </Text>
      )}
    </Card>
  );
}
