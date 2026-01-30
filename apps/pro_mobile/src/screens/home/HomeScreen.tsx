import { useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { JobCard } from "@components/presentational/JobCard";
import { HomeSkeleton } from "@components/presentational/HomeSkeleton";
import { Order, OrderStatus } from "@repo/domain";
import { theme } from "../../theme";
import { useProInbox } from "@hooks/order";
import { JOB_LABELS } from "../../utils/jobLabels";

export function HomeScreen() {
  const router = useRouter();

  // Fetch pro inbox orders via hook
  const { orders, isLoading, error } = useProInbox();

  // Filter orders into pending and accepted
  const { pending, upcoming } = useMemo(() => {
    const pendingOrders = orders.filter(
      (order: Order) => order.status === OrderStatus.PENDING_PRO_CONFIRMATION
    );

    const upcomingOrders = orders.filter(
      (order: Order) => order.status === OrderStatus.ACCEPTED
    );

    return {
      pending: pendingOrders,
      upcoming: upcomingOrders,
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
        <HomeSkeleton />
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
          <Feather name="bell" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            {JOB_LABELS.newRequests}
          </Text>
        </View>
        {pending.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={theme.colors.muted} />
            <Text variant="body" style={styles.empty}>
              {JOB_LABELS.noPendingJobs}
            </Text>
          </View>
        ) : (
          pending.map((job: Order) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => handleCardPress(job.id)}
            />
          ))
        )}
      </View>

      {/* Upcoming Jobs Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="calendar" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            {JOB_LABELS.upcomingJobs}
          </Text>
        </View>
        {upcoming.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={48} color={theme.colors.muted} />
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
