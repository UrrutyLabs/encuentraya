"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
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
              <Text variant="body" className="text-muted">
                Cargando...
              </Text>
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
              <Text variant="h2" className="mb-2 text-text">
                Reserva no encontrada
              </Text>
              <Text variant="body" className="text-muted mb-4">
                La reserva que buscas no existe.
              </Text>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90"
              >
                Volver a mis reservas
              </button>
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
            <Text variant="h1" className="mb-6 text-primary">
              Dejar reseña
            </Text>
            <Card className="p-6 text-center">
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
            <Text variant="h1" className="mb-6 text-primary">
              Dejar reseña
            </Text>
            <Card className="p-6 text-center">
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
          <Text variant="h1" className="mb-6 text-primary">
            Dejar reseña
          </Text>

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
