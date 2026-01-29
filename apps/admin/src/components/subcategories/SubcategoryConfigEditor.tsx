"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";

interface SubcategoryConfigEditorProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
}

export function SubcategoryConfigEditor({
  value,
  onChange,
}: SubcategoryConfigEditorProps) {
  const [jsonString, setJsonString] = useState(() => {
    try {
      return value ? JSON.stringify(value, null, 2) : "";
    } catch {
      return "";
    }
  });
  const [error, setError] = useState<string | null>(null);

  const handleJsonChange = (newJsonString: string) => {
    setJsonString(newJsonString);
    setError(null);

    if (!newJsonString.trim()) {
      onChange(null);
      return;
    }

    try {
      const parsed = JSON.parse(newJsonString);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        onChange(parsed as Record<string, unknown>);
      } else {
        setError("El JSON debe ser un objeto");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON inválido");
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonString(formatted);
      setError(null);
      onChange(parsed as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON inválido");
    }
  };

  const handleClear = () => {
    setJsonString("");
    setError(null);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Text variant="xs" className="text-gray-500">
          Configuración JSON para personalización de UX (opcional)
        </Text>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-sm px-3 py-1.5"
            onClick={handleFormat}
            disabled={!jsonString.trim()}
          >
            Formatear
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-sm px-3 py-1.5"
            onClick={handleClear}
            disabled={!jsonString.trim()}
          >
            Limpiar
          </Button>
        </div>
      </div>
      <textarea
        value={jsonString}
        onChange={(e) => handleJsonChange(e.target.value)}
        rows={10}
        className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        placeholder='{\n  "default_estimated_hours": 1.5,\n  "min_hours": 1,\n  "max_hours": 4\n}'
      />
      {error && (
        <Text variant="xs" className="text-red-500">
          Error: {error}
        </Text>
      )}
      {!error && jsonString.trim() && (
        <Text variant="xs" className="text-green-600">
          JSON válido
        </Text>
      )}
    </div>
  );
}
