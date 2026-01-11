import { useState } from "react";
import { StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Text } from "../../components/ui/Text";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../theme";

export function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que querés cerrar sesión?",
      [
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
            } catch (error) {
              Alert.alert(
                "Error",
                "No se pudo cerrar sesión. Por favor, intentá nuevamente."
              );
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="h1" style={styles.title}>
        Perfil
      </Text>

      <Card style={styles.card}>
        <Text variant="h2" style={styles.sectionTitle}>
          Información de cuenta
        </Text>
        {user?.email && (
          <Text variant="body" style={styles.email}>
            {user.email}
          </Text>
        )}
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
  title: {
    marginBottom: theme.spacing[6],
    color: theme.colors.primary,
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  sectionTitle: {
    marginBottom: theme.spacing[2],
    color: theme.colors.text,
  },
  email: {
    color: theme.colors.muted,
  },
  signOutButton: {
    width: "100%",
  },
});
