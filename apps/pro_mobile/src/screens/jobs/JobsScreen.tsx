import { useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { JobCard } from "@components/presentational/JobCard";
import { JobsSkeleton } from "@components/presentational/JobsSkeleton";
import { OrderStatus, Order } from "@repo/domain";
import { theme } from "../../theme";
import { useProJobs } from "@hooks/order";
import { JOB_LABELS } from "../../utils/jobLabels";

export function JobsScreen() {
  const router = useRouter();

  // Fetch pro jobs orders via hook
  const { orders, isLoading, error } = useProJobs();

  // Filter orders into upcoming (accepted and in_progress) and completed
  const { upcoming, completed } = useMemo<{
    upcoming: Order[];
    completed: Order[];
  }>(() => {
    const upcomingOrders = orders.filter(
      (order: Order) =>
        order.status === OrderStatus.ACCEPTED ||
        order.status === OrderStatus.IN_PROGRESS
    );

    const completedOrders = orders.filter(
      (order: Order) => order.status === OrderStatus.COMPLETED
    );

    return {
      upcoming: upcomingOrders,
      completed: completedOrders,
    };
  }, [orders]);

  // Memoize card press handler to prevent unnecessary re-renders
  const handleCardPress = useCallback(
    (orderId: string) => {
      router.push(`/job/${orderId}` as any);
    },
    [router]
  );

  if (isLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <JobsSkeleton />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={48} color={theme.colors.danger} />
        <Text variant="body" style={styles.error}>
          {JOB_LABELS.errorLoadingJobs}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="clock" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Próximos
          </Text>
        </View>
        {upcoming.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="clock" size={48} color={theme.colors.muted} />
            <Text variant="body" style={styles.empty}>
              {JOB_LABELS.noUpcomingJobs}
            </Text>
          </View>
        ) : (
          upcoming.map((job: Order) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => handleCardPress(job.id)}
            />
          ))
        )}
      </View>

      {/* Completed Jobs Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="check-circle" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            {JOB_LABELS.completedJobs}
          </Text>
        </View>
        {completed.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="check-circle" size={48} color={theme.colors.muted} />
            <Text variant="body" style={styles.empty}>
              {JOB_LABELS.noCompletedJobs}
            </Text>
          </View>
        ) : (
          completed.map((job: Order) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => handleCardPress(job.id)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing[4],
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bg,
  },
  loadingText: {
    marginTop: theme.spacing[2],
    color: theme.colors.muted,
  },
  error: {
    color: theme.colors.danger,
  },
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[3],
  },
  sectionTitle: {
    marginLeft: theme.spacing[2],
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing[8],
  },
  empty: {
    marginTop: theme.spacing[3],
    color: theme.colors.muted,
    textAlign: "center",
  },
});
