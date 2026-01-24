import { Filter, Calendar, Clock, MapPin, Hourglass } from "lucide-react";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Category } from "@repo/domain";

interface BookingFormProps {
  date: string;
  time: string;
  address: string;
  hours: string;
  category: Category | "";
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onHoursChange: (value: string) => void;
  onCategoryChange: (value: Category) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  error?: string | null;
  estimatedCost?: number;
  availableCategories?: Category[];
  minDate?: string;
  availableTimes?: { value: string; label: string }[];
}

const ALL_CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: Category.PLUMBING, label: "Plomería" },
  { value: Category.ELECTRICAL, label: "Electricidad" },
  { value: Category.CLEANING, label: "Limpieza" },
  { value: Category.HANDYMAN, label: "Arreglos generales" },
  { value: Category.PAINTING, label: "Pintura" },
];

export function BookingForm({
  date,
  time,
  address,
  hours,
  category,
  onDateChange,
  onTimeChange,
  onAddressChange,
  onHoursChange,
  onCategoryChange,
  onSubmit,
  loading = false,
  error,
  estimatedCost,
  availableCategories,
  minDate,
  availableTimes = [],
}: BookingFormProps) {
  // Filter category options based on available categories
  // If availableCategories is provided, only show those categories
  // Otherwise, show all categories (for backward compatibility)
  const categoryOptions = availableCategories
    ? ALL_CATEGORY_OPTIONS.filter((option) =>
        availableCategories.includes(option.value)
      )
    : ALL_CATEGORY_OPTIONS;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
          <Filter className="w-4 h-4 text-muted" />
          Categoría
        </label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as Category)}
          required
          className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Seleccionar categoría</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
            <Calendar className="w-4 h-4 text-muted" />
            Fecha
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            min={minDate}
            required
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
            <Clock className="w-4 h-4 text-muted" />
            Hora
          </label>
          <select
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Seleccionar hora</option>
            {availableTimes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
          <MapPin className="w-4 h-4 text-muted" />
          Dirección
        </label>
        <Input
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Ingresá la dirección donde se realizará el trabajo"
          required
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
          <Hourglass className="w-4 h-4 text-muted" />
          Horas estimadas
        </label>
        <Input
          type="number"
          min="0.5"
          step="0.5"
          value={hours}
          onChange={(e) => onHoursChange(e.target.value)}
          placeholder="Ej: 2.5"
          required
        />
      </div>

      {estimatedCost !== undefined && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex justify-between items-center">
            <Text variant="body" className="text-text font-medium">
              Costo estimado:
            </Text>
            <Text variant="h2" className="text-primary">
              ${estimatedCost.toFixed(0)}
            </Text>
          </div>
          <Text variant="small" className="text-muted mt-1">
            Basado en las horas estimadas y la tarifa del profesional
          </Text>
        </Card>
      )}

      {error && (
        <Text variant="small" className="text-danger">
          {error}
        </Text>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={loading}
      >
        {loading ? "Creando reserva..." : "Confirmar reserva"}
      </Button>
    </form>
  );
}
