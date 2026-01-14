import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
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
        <label className="block text-sm font-medium text-text mb-1">
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
        <Input
          label="Fecha"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          required
        />
        <Input
          label="Hora"
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          required
        />
      </div>

      <Input
        label="Dirección"
        type="text"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder="Ingresá la dirección donde se realizará el trabajo"
        required
      />

      <Input
        label="Horas estimadas"
        type="number"
        min="0.5"
        step="0.5"
        value={hours}
        onChange={(e) => onHoursChange(e.target.value)}
        placeholder="Ej: 2.5"
        required
      />

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

      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? "Creando reserva..." : "Confirmar reserva"}
      </Button>
    </form>
  );
}
