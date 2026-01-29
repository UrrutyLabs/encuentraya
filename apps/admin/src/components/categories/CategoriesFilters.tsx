"use client";

import { Input } from "@repo/ui";
import { Button } from "@repo/ui";

interface CategoriesFiltersProps {
  query: string;
  showDeleted: boolean;
  showInactive: boolean;
  onQueryChange: (query: string) => void;
  onShowDeletedChange: (show: boolean) => void;
  onShowInactiveChange: (show: boolean) => void;
  onClear: () => void;
}

export function CategoriesFilters({
  query,
  showDeleted,
  showInactive,
  onQueryChange,
  onShowDeletedChange,
  onShowInactiveChange,
  onClear,
}: CategoriesFiltersProps) {
  const hasFilters = query || showDeleted || showInactive;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <Input
            type="text"
            placeholder="Nombre, clave o slug"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mostrar eliminadas
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => onShowDeletedChange(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="ml-2 text-sm text-gray-700">
              Incluir categorías eliminadas
            </span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mostrar inactivas
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => onShowInactiveChange(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="ml-2 text-sm text-gray-700">
              Incluir categorías inactivas
            </span>
          </label>
        </div>
      </div>
      {hasFilters && (
        <div>
          <Button variant="ghost" onClick={onClear} className="text-sm">
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
