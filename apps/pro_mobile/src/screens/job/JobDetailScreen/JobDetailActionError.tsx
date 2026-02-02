import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { Card } from "@components/ui/Card";
import { theme } from "../../../theme";

interface JobDetailActionErrorProps {
  message: string;
}

export function JobDetailActionError({ message }: JobDetailActionErrorProps) {
  return (
    <Card style={styles.errorCard}>
      <View style={styles.errorRow}>
        <Feather name="alert-circle" size={16} color={theme.colors.danger} />
        <Text variant="small" style={styles.errorText}>
          {message}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: `${theme.colors.danger}1A`,
    borderColor: theme.colors.danger,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    marginLeft: theme.spacing[1],
    color: theme.colors.danger,
  },
});
