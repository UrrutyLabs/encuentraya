import { StyleSheet, ScrollView, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Text } from "@components/ui/Text";
import { FAQAccordion } from "@components/presentational/FAQAccordion";
import { proFAQItems } from "@repo/content";
import { theme } from "../../theme";

export function HelpScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* FAQs Section */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Feather
            name="message-circle"
            size={20}
            color={theme.colors.primary}
          />
          <Text variant="h2" style={styles.sectionTitle}>
            Preguntas frecuentes
          </Text>
        </View>
        <Text variant="body" style={styles.sectionDescription}>
          Resolvé tus dudas sobre cómo trabajar con Arreglatodo
        </Text>
        <FAQAccordion items={proFAQItems} defaultExpandedCount={4} />
      </Card>

      {/* Support Section (Future) */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Feather name="headphones" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Contactar soporte
          </Text>
        </View>
        <Text variant="body" style={styles.sectionDescription}>
          Próximamente: podrás chatear directamente con nuestro equipo de
          soporte desde aquí.
        </Text>
      </Card>
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
  sectionCard: {
    marginBottom: theme.spacing[4],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  sectionTitle: {
    marginLeft: theme.spacing[2],
    color: theme.colors.text,
  },
  sectionDescription: {
    marginBottom: theme.spacing[4],
    color: theme.colors.muted,
  },
});
