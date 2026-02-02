import { View, StyleSheet, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { Card } from "@components/ui/Card";
import { theme } from "../../../theme";

interface JobDetailPhotoGridProps {
  title: string;
  photoUrls: string[];
}

export function JobDetailPhotoGrid({
  title,
  photoUrls,
}: JobDetailPhotoGridProps) {
  if (!photoUrls.length) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Feather name="image" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            {title}
          </Text>
        </View>
      </View>
      <View style={styles.grid}>
        {photoUrls.map((url) => (
          <Image
            key={url}
            source={{ uri: url }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing[4],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing[3],
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    marginLeft: theme.spacing[2],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.md,
  },
});
