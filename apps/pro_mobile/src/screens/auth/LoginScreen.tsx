import { useState } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { useAuth } from "@hooks/auth";
import { theme } from "../../theme";

export function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn(email, password);
      // Redirect to index route, which will check onboarding status and redirect appropriately
      router.replace("/" as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Feather name="log-in" size={24} color={theme.colors.primary} />
          <Text variant="h1" style={styles.title}>
            Iniciar sesión
          </Text>
        </View>
        <Input
          label="Email"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
        />
        <Input
          label="Contraseña"
          icon="lock"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          style={styles.input}
        />
        {error && (
          <View style={styles.errorContainer}>
            <Feather
              name="alert-circle"
              size={16}
              color={theme.colors.danger}
            />
            <Text variant="small" style={styles.error}>
              {error}
            </Text>
          </View>
        )}
        <Button
          variant="primary"
          onPress={handleSignIn}
          disabled={loading}
          style={styles.button}
        >
          {loading ? "Iniciando sesión..." : "Ingresar"}
        </Button>
        <Button
          variant="ghost"
          onPress={() => router.push("/auth/signup" as any)}
          style={styles.linkButton}
        >
          ¿No tenés cuenta? Registrate
        </Button>
        <Button
          variant="ghost"
          onPress={() => router.push("/auth/forgot-password" as any)}
          style={styles.linkButton}
        >
          ¿Olvidaste tu contraseña?
        </Button>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing[4],
  },
  card: {
    width: "100%",
    maxWidth: 400,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing[6],
  },
  title: {
    marginLeft: theme.spacing[2],
  },
  input: {
    marginBottom: theme.spacing[4],
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[2],
    padding: theme.spacing[2],
    backgroundColor: `${theme.colors.danger}1A`,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: `${theme.colors.danger}33`,
  },
  error: {
    marginLeft: theme.spacing[1],
    color: theme.colors.danger,
  },
  button: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  linkButton: {
    marginTop: theme.spacing[2],
  },
});
