import {
  Star,
  MessageSquare,
  AlertCircle,
  Send,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";

interface ReviewFormProps {
  rating: number;
  comment: string;
  wantsSupportContact?: boolean;
  whatHappened?: string;
  onRatingChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  onWantsSupportContactChange?: (value: boolean) => void;
  onWhatHappenedChange?: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function ReviewForm({
  rating,
  comment,
  wantsSupportContact = false,
  whatHappened = "",
  onRatingChange,
  onCommentChange,
  onWantsSupportContactChange,
  onWhatHappenedChange,
  onSubmit,
  onCancel,
  loading = false,
  error,
}: ReviewFormProps) {
  const isLowRating = rating >= 1 && rating <= 2;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
          <Star className="w-4 h-4 text-warning" />
          Calificación <span className="text-danger">*</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onRatingChange(value)}
              className={`w-12 h-12 rounded-md border-2 transition-colors flex items-center justify-center ${
                rating >= value
                  ? "bg-warning border-warning text-white"
                  : "bg-surface border-border text-muted hover:border-warning/50"
              }`}
            >
              <Star
                className={`w-6 h-6 ${
                  rating >= value ? "fill-white text-white" : "fill-none"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <Text variant="small" className="text-muted mt-1">
            {rating} {rating === 1 ? "estrella" : "estrellas"}
          </Text>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
          <MessageSquare className="w-4 h-4 text-muted" />
          Comentario (opcional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Contanos tu experiencia con el servicio..."
        />
      </div>

      {isLowRating && onWantsSupportContactChange && (
        <>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="wantsSupportContact"
              checked={wantsSupportContact}
              onChange={(e) => onWantsSupportContactChange(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <label
              htmlFor="wantsSupportContact"
              className="text-sm text-text cursor-pointer"
            >
              Quiero que soporte me contacte
            </label>
          </div>

          {onWhatHappenedChange && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
                <AlertCircle className="w-4 h-4 text-warning" />
                ¿Qué pasó? (opcional)
              </label>
              <textarea
                value={whatHappened}
                onChange={(e) => onWhatHappenedChange(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Contanos qué pasó para poder ayudarte mejor..."
              />
            </div>
          )}
        </>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-md">
          <AlertCircle className="w-4 h-4 text-danger shrink-0" />
          <Text variant="small" className="text-danger">
            {error}
          </Text>
        </div>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            className="flex-1 flex items-center gap-2"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="w-4 h-4" />
            Ahora no
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          className={`${onCancel ? "flex-1" : "w-full"} flex items-center gap-2`}
          disabled={loading || rating === 0}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando reseña...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar reseña
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
