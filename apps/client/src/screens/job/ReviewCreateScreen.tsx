"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Star, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { AppShell } from "@/components/presentational/AppShell";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { ReviewCreateSkeleton } from "@/components/presentational/ReviewCreateSkeleton";
import { useReviewForm } from "@/hooks/order";
import { JOB_LABELS } from "@/utils/jobLabels";
import { type Order } from "@repo/domain";

export function ReviewCreateScreen() {
  const params = useParams();
  const orderId = params.jobId as string; // Extract jobId from route, use as orderId for API calls

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wantsSupportContact, setWantsSupportContact] = useState(false);
  const [whatHappened, setWhatHappened] = useState("");

  const {
    order,
    existingReview,
    isLoading,
    createReview,
    isPending,
    error: createError,
    canCreateReview,
  } = useReviewForm(orderId);

  // Use job variable for display (type is Order)
  const job: Order | undefined = order ?? undefined;

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
      <AppShell showLogin={false}>
        <div className="px-4 py-4 md:py-8">
          <ReviewCreateSkeleton />
        </div>
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell showLogin={false}>
        <div className="px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
              <Text variant="h2" className="mb-2 text-text">
                Trabajo no encontrado
              </Text>
              <Text variant="body" className="text-muted mb-4">
                El trabajo que buscas no existe.
              </Text>
              <Button
                onClick={() => window.history.back()}
                variant="primary"
                className="flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                {JOB_LABELS.backToJobs}
              </Button>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  // Gating: Check if review can be created
  if (job && !canCreateReview) {
    return (
      <AppShell showLogin={false}>
        <div className="px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-primary" />
              <Text variant="h1" className="text-primary">
                Dejar reseña
              </Text>
            </div>
            <Card className="p-4 md:p-6 text-center">
              <AlertCircle className="w-12 h-12 text-muted mx-auto mb-3" />
              <Text variant="body" className="text-muted">
                La reseña está disponible cuando el trabajo esté completado.
              </Text>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  // Gating: Check if review already exists
  if (existingReview) {
    return (
      <AppShell showLogin={false}>
        <div className="px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-primary" />
              <Text variant="h1" className="text-primary">
                Dejar reseña
              </Text>
            </div>
            <Card className="p-4 md:p-6 text-center">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
              <Text variant="body" className="text-muted">
                Ya dejaste una reseña para este trabajo.
              </Text>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showLogin={false}>
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-6 h-6 text-primary" />
            <Text variant="h1" className="text-primary">
              Dejar reseña
            </Text>
          </div>

          <Card className="p-4 md:p-6">
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
    </AppShell>
  );
}
