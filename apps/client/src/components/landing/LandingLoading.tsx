import { Loader2 } from "lucide-react";
import { Text } from "@/components/ui/Text";

export function LandingLoading() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <Text variant="body" className="text-muted">
          Cargando...
        </Text>
      </div>
    </div>
  );
}
