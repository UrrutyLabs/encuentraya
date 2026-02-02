import { View, StyleSheet } from "react-native";
import { Text } from "@components/ui/Text";
import { Badge } from "@components/ui/Badge";
import { JOB_LABELS } from "../../../utils/jobLabels";
import { theme } from "../../../theme";

interface JobDetailHeaderProps {
  statusLabel: string;
  statusVariant: "new" | "info" | "success" | "warning" | "danger";
}

export function JobDetailHeader({
  statusLabel,
  statusVariant,
}: JobDetailHeaderProps) {
  return (
    <View style={styles.header}>
      <Text variant="h1">{JOB_LABELS.jobDetails}</Text>
      <Badge variant={statusVariant} showIcon>
        {statusLabel}
      </Badge>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[4],
  },
});
