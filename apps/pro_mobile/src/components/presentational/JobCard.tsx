import React, { useMemo } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "../ui/Card";
import { Text } from "../ui/Text";
import { Badge } from "../ui/Badge";
import type { Order } from "@repo/domain";
import { OrderStatus } from "@repo/domain";
import { getJobStatusLabel, getJobStatusVariant } from "../../utils/jobStatus";
import { JOB_LABELS } from "../../utils/jobLabels";
import { theme } from "../../theme";

interface JobCardProps {
  job: Order;
  onPress: () => void;
}

function JobCardComponent({ job, onPress }: JobCardProps) {
  // Memoize computed values to avoid recalculation on re-renders
  const categoryLabel = useMemo(() => {
    // Try to get category name from metadata, fallback to categoryId
    const categoryName = job.categoryMetadataJson?.name as string | undefined;
    return categoryName || job.categoryId || "";
  }, [job.categoryMetadataJson, job.categoryId]);

  const statusLabel = useMemo(
    () => getJobStatusLabel(job.status),
    [job.status]
  );

  const statusVariant = useMemo(
    () => getJobStatusVariant(job.status),
    [job.status]
  );

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("es-UY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(job.scheduledWindowStartAt)),
    [job.scheduledWindowStartAt]
  );

  const descriptionLines = useMemo(
    () => (job.description || "").split("\n").slice(0, 2).join("\n"),
    [job.description]
  );

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <Text variant="h2" style={styles.category}>
              {categoryLabel}
            </Text>
          </View>
          <View style={styles.badgesContainer}>
            {job.isFirstOrder && job.status !== OrderStatus.COMPLETED && (
              <Badge variant="new">Nuevo Cliente</Badge>
            )}
            <Badge variant={statusVariant} showIcon>
              {statusLabel}
            </Badge>
          </View>
        </View>
        {job.description && (
          <Text variant="body" style={styles.description} numberOfLines={2}>
            {descriptionLines}
          </Text>
        )}
        <View style={styles.dateRow}>
          <Feather name="clock" size={14} color={theme.colors.muted} />
          <Text variant="small" style={styles.date}>
            {formattedDate}
          </Text>
        </View>
        {job.totalAmount && (
          <View style={styles.amountRow}>
            <Feather
              name="dollar-sign"
              size={16}
              color={theme.colors.primary}
            />
            <Text variant="body" style={styles.amount}>
              {JOB_LABELS.totalAmount}: ${job.totalAmount.toFixed(2)}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing[3],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    flexWrap: "wrap",
  },
  category: {
    flexShrink: 1,
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  description: {
    marginBottom: theme.spacing[2],
    color: theme.colors.muted,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[1],
  },
  date: {
    marginLeft: theme.spacing[1],
    color: theme.colors.muted,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing[1],
  },
  amount: {
    marginLeft: theme.spacing[1],
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
});

// Memoize component to prevent unnecessary re-renders
export const JobCard = React.memo(JobCardComponent, (prevProps, nextProps) => {
  // Only re-render if job ID or status changes, or onPress reference changes
  return (
    prevProps.job.id === nextProps.job.id &&
    prevProps.job.status === nextProps.job.status &&
    prevProps.job.isFirstOrder === nextProps.job.isFirstOrder &&
    prevProps.onPress === nextProps.onPress
  );
});
