"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Star,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { useReviewForm } from "@/hooks/useReviewForm";

export function ReviewCreateScreen() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wantsSupportContact, setWantsSupportContact] = useState(false);
  const [whatHappened, setWhatHappened] = useState("");

  const {
    booking,
    existingReview,
    isLoading,
    createReview,
    isPending,
    error: createError,
    canCreateReview,
  } = useReviewForm(bookingId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createReview(rating, comment || undefined);
      // Success - hook's onSuccess will handle redirect
    } catch {
      // Error is handled by hook state
    }
  };

  const handleCancel = () => {
    // Navigation handled by hook
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <Text variant="body" className="text-muted">
                  Cargando...
                </Text>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
              <Text variant="h2" className="mb-2 text-text">
                Reserva no encontrada
              </Text>
              <Text variant="body" className="text-muted mb-4">
                La reserva que buscas no existe.
              </Text>
              <Button
                onClick={() => window.history.back()}
                variant="primary"
                className="flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a mis reservas
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Gating: Check if review can be created
  if (booking && !canCreateReview) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-primary" />
              <Text variant="h1" className="text-primary">
                Dejar reseña
              </Text>
            </div>
            <Card className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-muted mx-auto mb-3" />
              <Text variant="body" className="text-muted">
                La reseña está disponible cuando el trabajo esté completado.
              </Text>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Gating: Check if review already exists
  if (existingReview) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-primary" />
              <Text variant="h1" className="text-primary">
                Dejar reseña
              </Text>
            </div>
            <Card className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
              <Text variant="body" className="text-muted">
                Ya dejaste una reseña para este trabajo.
              </Text>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-6 h-6 text-primary" />
            <Text variant="h1" className="text-primary">
              Dejar reseña
            </Text>
          </div>

          <Card className="p-6">
            <ReviewForm
              rating={rating}
              comment={comment}
              wantsSupportContact={wantsSupportContact}
              whatHappened={whatHappened}
              onRatingChange={setRating}
              onCommentChange={setComment}
              onWantsSupportContactChange={setWantsSupportContact}
              onWhatHappenedChange={setWhatHappened}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={isPending}
              error={createError?.message}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
