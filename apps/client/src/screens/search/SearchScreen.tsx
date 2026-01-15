"use client";

import { useState, useMemo, useCallback } from "react";
import { Filter, Calendar, Clock } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Input } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { ProCard } from "@/components/presentational/ProCard";
import { EmptyState } from "@/components/presentational/EmptyState";
import { SearchSkeleton } from "@/components/presentational/SearchSkeleton";
import { useSearchPros } from "@/hooks/pro";
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

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      category: category || undefined,
      date: date || undefined,
      time: time || undefined,
    }),
    [category, date, time]
  );

  const { pros, isLoading } = useSearchPros(filters);

  // Memoize event handlers
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value as Category | "");
  }, []);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  }, []);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
  }, []);

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
            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
                  <Filter className="w-4 h-4 text-primary" />
                  Categoría de servicio
                </label>
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Fecha
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={handleDateChange}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Hora
                  </label>
                  <Input
                    type="time"
                    value={time}
                    onChange={handleTimeChange}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Results */}
          {isLoading ? (
            <SearchSkeleton />
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
