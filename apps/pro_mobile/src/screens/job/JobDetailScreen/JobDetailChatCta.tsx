import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { Card } from "@components/ui/Card";
import { theme } from "../../../theme";

interface JobDetailChatCtaProps {
  orderId: string;
  onPress: () => void;
}

export function JobDetailChatCta({ orderId, onPress }: JobDetailChatCtaProps) {
  if (!orderId) return null;

  return (
    <Card style={styles.chatCard}>
      <TouchableOpacity
        style={styles.chatCta}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.chatCtaLeft}>
          <Feather
            name="message-circle"
            size={22}
            color={theme.colors.primary}
          />
          <Text variant="h2" style={styles.chatCtaText}>
            Mensajes
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={theme.colors.muted} />
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  chatCard: {
    marginBottom: theme.spacing[4],
  },
  chatCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
  },
  chatCtaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  chatCtaText: {
    color: theme.colors.text,
  },
});
