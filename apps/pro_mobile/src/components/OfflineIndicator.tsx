import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "./ui/Text";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { theme } from "../theme";

/**
 * Offline indicator component
 * Shows a banner at the top when device is offline
 */
export function OfflineIndicator() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Feather name="wifi-off" size={16} color={theme.colors.surface} />
      <Text variant="small" style={styles.text}>
        Sin conexión
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.warning,
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    gap: theme.spacing[1],
  },
  text: {
    color: theme.colors.surface,
    fontWeight: theme.typography.weights.medium,
  },
});
