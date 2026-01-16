import { useCallback, useMemo } from "react";
import { StyleSheet, ScrollView, View, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Text } from "@components/ui/Text";
import { Button } from "@components/ui/Button";
import { EarningsGroupHeader } from "@components/presentational/EarningsGroupHeader";
import { EarningsGroupHeaderSkeleton } from "@components/presentational/EarningsGroupHeaderSkeleton";
import { EarningsSummaryCard } from "@components/presentational/EarningsSummaryCard";
import { EarningsSummaryCardSkeleton } from "@components/presentational/EarningsSummaryCardSkeleton";
import { EarningsCardSkeleton } from "@components/presentational/EarningsCardSkeleton";
import { useEarnings } from "@hooks/payout";
import { formatAmount, formatDateShort, getMonthKey, isCurrentMonth, isLastMonth } from "../../utils/format";
import { theme } from "../../theme";

interface Earning {
  id: string;
  bookingId: string;
  bookingDisplayId: string;
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  status: "PENDING" | "PAYABLE" | "PAID" | "REVERSED";
  currency: string;
  availableAt: string | Date | null;
  createdAt: string | Date;
}


export function EarningsListScreen() {
  const limit = 50; // Load up to 50 earnings at once

  const {
    data: earnings = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useEarnings({
    limit,
  });

  // Group earnings by month
  const groupedEarnings = useMemo(() => {
    const groups: Record<string, Earning[]> = {};
    (earnings as Earning[]).forEach((earning) => {
      const dateRaw = earning.createdAt;
      const date = dateRaw instanceof Date ? dateRaw : new Date(dateRaw);
      const monthKey = getMonthKey(date);
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(earning);
    });
    return groups;
  }, [earnings]);

  // Calculate summary totals
  const { thisMonthTotal, lastMonthTotal, currency } = useMemo(() => {
    let thisMonth = 0;
    let lastMonth = 0;
    let firstCurrency = "UYU";

    (earnings as Earning[]).forEach((earning) => {
      const dateRaw = earning.createdAt;
      const date = dateRaw instanceof Date ? dateRaw : new Date(dateRaw);
      firstCurrency = earning.currency;

      if (isCurrentMonth(date)) {
        thisMonth += earning.netAmount;
      } else if (isLastMonth(date)) {
        lastMonth += earning.netAmount;
      }
    });

    return {
      thisMonthTotal: thisMonth,
      lastMonthTotal: lastMonth,
      currency: firstCurrency,
    };
  }, [earnings]);

  // Sort month keys (most recent first)
  const sortedMonthKeys = useMemo(() => {
    return Object.keys(groupedEarnings).sort((a, b) => b.localeCompare(a));
  }, [groupedEarnings]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);


  if (isLoading && earnings.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Summary Card Skeleton */}
        <EarningsSummaryCardSkeleton />

        {/* Month Group Skeleton */}
        <View style={styles.monthGroup}>
          <EarningsGroupHeaderSkeleton />
          {/* Earning Cards Skeletons */}
          {[1, 2, 3].map((i) => (
            <EarningsCardSkeleton key={i} />
          ))}
        </View>
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.colors.danger} />
          <Text variant="h2" style={styles.errorTitle}>
            Error al cargar ingresos
          </Text>
          <Text variant="body" style={styles.errorText}>
            {error.message || "No se pudieron cargar los ingresos. Intentá nuevamente."}
          </Text>
          <Button onPress={handleRetry} style={styles.retryButton}>
            Reintentar
          </Button>
        </View>
      </ScrollView>
    );
  }

  if (earnings.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
      >
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={48} color={theme.colors.muted} />
          <Text variant="h2" style={styles.emptyTitle}>
            No hay ingresos
          </Text>
          <Text variant="body" style={styles.emptyText}>
            Aún no tenés ingresos registrados
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
    >
      {/* Summary Card - Only show if there are earnings */}
      {earnings.length > 0 && (
        <EarningsSummaryCard
          thisMonthTotal={thisMonthTotal}
          lastMonthTotal={lastMonthTotal}
          currency={currency}
        />
      )}

      {/* Grouped Earnings */}
      {sortedMonthKeys.map((monthKey) => {
        const monthEarnings = groupedEarnings[monthKey];
        const monthTotal = monthEarnings.reduce((sum, e) => sum + e.netAmount, 0);
        const firstEarning = monthEarnings[0];

        return (
          <View key={monthKey} style={styles.monthGroup}>
            <EarningsGroupHeader
              monthKey={monthKey}
              totalNetAmount={monthTotal}
              currency={firstEarning.currency}
              count={monthEarnings.length}
            />
            <View style={styles.earningsList}>
              {monthEarnings.map((earning) => {
              const displayDateRaw = earning.createdAt;
              const displayDate = displayDateRaw instanceof Date ? displayDateRaw : new Date(displayDateRaw);

              return (
                <Card key={earning.id} style={styles.earningCard}>
                  <View style={styles.earningRow}>
                    <Text variant="small" style={styles.date}>
                      {formatDateShort(displayDate)}
                    </Text>
                    <Text variant="body" style={styles.netAmount}>
                      {formatAmount(earning.netAmount, earning.currency)}
                    </Text>
                    <Text variant="xs" style={styles.bookingId}>
                      #{earning.bookingDisplayId}
                    </Text>
                  </View>
                </Card>
              );
              })}
            </View>
          </View>
        );
      })}
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing[8],
  },
  emptyTitle: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
    color: theme.colors.text,
  },
  emptyText: {
    color: theme.colors.muted,
    textAlign: "center",
  },
  earningCard: {
    marginBottom: theme.spacing[2],
    paddingVertical: theme.spacing[2],
  },
  earningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  date: {
    color: theme.colors.muted,
    flex: 1,
  },
  netAmount: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    flex: 1,
    textAlign: "right",
  },
  bookingId: {
    color: theme.colors.muted,
    fontFamily: "monospace",
  },
  monthGroup: {
    marginBottom: theme.spacing[4],
  },
  earningsList: {
    paddingTop: theme.spacing[2],
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing[8],
  },
  errorTitle: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
    color: theme.colors.text,
  },
  errorText: {
    color: theme.colors.muted,
    textAlign: "center",
    marginBottom: theme.spacing[4],
  },
  retryButton: {
    marginTop: theme.spacing[2],
  },
});
