"use client";

import { useMemo, useCallback } from "react";
import { Calendar, History } from "lucide-react";
import { Text, Card } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { JobCard } from "@/components/presentational/JobCard";
import { EmptyState } from "@/components/presentational/EmptyState";
import { MyJobsSkeleton } from "@/components/presentational/MyJobsSkeleton";
import { useMyOrders } from "@/hooks/order";
import { OrderStatus, type Order } from "@repo/domain";
import { JOB_LABELS } from "@/utils/jobLabels";

export function MyJobsScreen() {
  const { orders, isLoading, reviewStatusMap } = useMyOrders();

  // Memoize review status lookup function
  const getHasReview = useCallback(
    (orderId: string) => reviewStatusMap[orderId] ?? false,
    [reviewStatusMap]
  );

  const { upcoming, past } = useMemo((): {
    upcoming: Order[];
    past: Order[];
  } => {
    const now = new Date();
    const upcomingOrders = orders.filter((order: Order) => {
      const scheduledDate = new Date(order.scheduledWindowStartAt);
      return (
        scheduledDate >= now &&
        order.status !== OrderStatus.COMPLETED &&
        order.status !== OrderStatus.CANCELED
      );
    });

    const pastOrders = orders.filter((order: Order) => {
      const scheduledDate = new Date(order.scheduledWindowStartAt);
      return (
        scheduledDate < now ||
        order.status === OrderStatus.COMPLETED ||
        order.status === OrderStatus.CANCELED
      );
    });

    return {
      upcoming: upcomingOrders,
      past: pastOrders,
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          <Text variant="h1" className="mb-6 md:mb-8 text-primary">
            {JOB_LABELS.myJobs}
          </Text>

          {isLoading ? (
            <MyJobsSkeleton />
          ) : orders.length === 0 ? (
            <EmptyState
              title={JOB_LABELS.noJobs}
              description={JOB_LABELS.noJobsDescription}
              icon="inbox"
            />
          ) : (
            <div className="space-y-8">
              {/* Upcoming Jobs */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <Text variant="h2" className="text-text">
                    Próximas
                  </Text>
                </div>
                {upcoming.length === 0 ? (
                  <Card className="p-4 md:p-6">
                    <Text variant="body" className="text-muted text-center">
                      {JOB_LABELS.noUpcomingJobs}
                    </Text>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcoming.map((job: Order) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                )}
              </section>

              {/* Past Jobs */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-muted" />
                  <Text variant="h2" className="text-text">
                    Pasadas
                  </Text>
                </div>
                {past.length === 0 ? (
                  <Card className="p-4 md:p-6">
                    <Text variant="body" className="text-muted text-center">
                      {JOB_LABELS.noPastJobs}
                    </Text>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {past.map((job: Order) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        hasReview={getHasReview(job.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
