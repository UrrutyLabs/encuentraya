import { Card } from "@repo/ui";

/**
 * Skeleton loader for auth pages (login, signup, confirm-email)
 * Used as Suspense fallback
 */
export function AuthPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="max-w-md w-full space-y-8 p-8 bg-surface rounded-lg border border-border">
        {/* Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 bg-muted/30 rounded animate-pulse" />
          <div className="h-8 bg-muted/30 rounded w-48 animate-pulse" />
        </div>

        {/* Form Card */}
        <Card className="p-6 animate-pulse">
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <div className="h-4 bg-muted/30 rounded w-16 mb-2" />
              <div className="h-10 bg-muted/30 rounded w-full" />
            </div>

            {/* Password Field */}
            <div>
              <div className="h-4 bg-muted/30 rounded w-20 mb-2" />
              <div className="h-10 bg-muted/30 rounded w-full" />
            </div>

            {/* Additional Fields (for signup) */}
            <div>
              <div className="h-4 bg-muted/30 rounded w-24 mb-2" />
              <div className="h-10 bg-muted/30 rounded w-full" />
            </div>

            {/* Submit Button */}
            <div className="h-10 bg-muted/30 rounded w-full mt-4" />

            {/* Footer Link */}
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-border">
              <div className="h-4 bg-muted/30 rounded w-32" />
              <div className="h-4 bg-muted/30 rounded w-24" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
