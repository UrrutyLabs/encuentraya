"use client";

import { useState } from "react";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Navigation } from "@/components/presentational/Navigation";
import { ProCard } from "@/components/presentational/ProCard";
import { EmptyState } from "@/components/presentational/EmptyState";
import { useSearchPros } from "@/hooks/useSearchPros";
import { Category, type Pro } from "@repo/domain";

const CATEGORY_OPTIONS: { value: Category | ""; label: string }[] = [
  { value: "", label: "Todas las categorías" },
  { value: Category.PLUMBING, label: "Plomería" },
  { value: Category.ELECTRICAL, label: "Electricidad" },
  { value: Category.CLEANING, label: "Limpieza" },
  { value: Category.HANDYMAN, label: "Arreglos generales" },
  { value: Category.PAINTING, label: "Pintura" },
];

export function SearchScreen() {
  const [category, setCategory] = useState<Category | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const { pros, isLoading } = useSearchPros({
    category: category || undefined,
    date: date || undefined,
    time: time || undefined,
  });

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Text variant="h1" className="mb-6 text-primary">
            Buscar profesionales
          </Text>

          {/* Filters */}
          <Card className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category | "")}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Input
                  label="Fecha"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Hora"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Results */}
          {isLoading ? (
            <Card className="p-8 text-center">
              <Text variant="body" className="text-muted">
                Cargando profesionales...
              </Text>
            </Card>
          ) : pros.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pros.map((pro: Pro) => (
                <ProCard key={pro.id} pro={pro} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
