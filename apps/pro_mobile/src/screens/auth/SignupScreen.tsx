import { useState } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { useProSignup } from "@hooks/auth";
import { theme } from "../../theme";

export function SignupScreen() {
  const router = useRouter();
  const { signup, isPending, error: signupError } = useProSignup();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    try {
      setError(null);
      await signup({
        email,
        password,
      });
      // Success - mutation's onSuccess will handle redirect to confirm-email
    } catch (err) {
      // Error is handled by mutation state, but we can also set local error
      setError(
        err instanceof Error
          ? err.message
          : "Error al registrarse. Por favor, intentá nuevamente."
      );
    }
  };

  // Use error from mutation if available, otherwise use local error
  const displayError = signupError?.message || error;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Feather name="user-plus" size={24} color={theme.colors.primary} />
          <Text variant="h1" style={styles.title}>
            Registrarse
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
        {displayError && (
          <View style={styles.errorContainer}>
            <Feather
              name="alert-circle"
              size={16}
              color={theme.colors.danger}
            />
            <Text variant="small" style={styles.error}>
              {displayError}
            </Text>
          </View>
        )}
        <Button
          variant="primary"
          onPress={handleSignUp}
          disabled={isPending}
          style={styles.button}
        >
          {isPending ? "Registrando..." : "Crear cuenta"}
        </Button>
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.linkButton}
        >
          ¿Ya tenés cuenta? Iniciar sesión
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
