import { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { useAuth } from "@hooks/auth";
import { theme } from "../../theme";

export function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que querés cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try {
            setIsSigningOut(true);
            await signOut();
            router.replace("/auth/login");
          } catch {
            Alert.alert(
              "Error",
              "No se pudo cerrar sesión. Por favor, intentá nuevamente."
            );
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Feather name="user" size={24} color={theme.colors.primary} />
        <Text variant="h1" style={styles.title}>
          Perfil
        </Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="user" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Información de cuenta
          </Text>
        </View>
        {user?.email && (
          <View style={styles.emailRow}>
            <Feather name="mail" size={16} color={theme.colors.muted} />
            <Text variant="body" style={styles.email}>
              {user.email}
            </Text>
          </View>
        )}
      </Card>

      {/* Edit Profile Link */}
      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() => router.push("/profile/edit")}
          style={styles.linkRow}
        >
          <View style={styles.linkLeft}>
            <Feather name="edit" size={20} color={theme.colors.text} />
            <Text variant="body" style={styles.linkText}>
              Editar perfil
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={theme.colors.muted} />
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() => router.push("/profile/earnings")}
          style={styles.linkRow}
        >
          <View style={styles.linkLeft}>
            <Feather name="dollar-sign" size={20} color={theme.colors.text} />
            <Text variant="body" style={styles.linkText}>
              Ingresos
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={theme.colors.muted} />
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() => router.push("/settings/payout")}
          style={styles.linkRow}
        >
          <View style={styles.linkLeft}>
            <Feather name="credit-card" size={20} color={theme.colors.text} />
            <Text variant="body" style={styles.linkText}>
              Cobros
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={theme.colors.muted} />
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() => router.push("/settings/help")}
          style={styles.linkRow}
        >
          <View style={styles.linkLeft}>
            <Feather name="help-circle" size={20} color={theme.colors.text} />
            <Text variant="body" style={styles.linkText}>
              Ayuda
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={theme.colors.muted} />
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <Button
          variant="danger"
          onPress={handleSignOut}
          disabled={isSigningOut}
          style={styles.signOutButton}
        >
          {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </Button>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[6],
  },
  title: {
    marginLeft: theme.spacing[2],
    color: theme.colors.primary,
  },
  card: {
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
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  email: {
    marginLeft: theme.spacing[1],
    color: theme.colors.muted,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  linkText: {
    marginLeft: theme.spacing[2],
    color: theme.colors.text,
  },
  signOutButton: {
    width: "100%",
  },
});
