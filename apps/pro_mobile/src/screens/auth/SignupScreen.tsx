import { useState } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Text } from "../../components/ui/Text";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../theme";
import { trpc } from "../../lib/trpc/client";
import { Category } from "@repo/domain";

export function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutation to convert user to PRO after signup
  const convertToProMutation = trpc.pro.convertToPro.useMutation({
    onError: (err) => {
      setError(err.message || "Error al crear perfil de profesional");
    },
  });

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Step 1: Sign up with Supabase
      await signUp(email, password);
      
      // Step 2: Convert user to PRO role and create pro profile
      // Use email as name initially, user can update later
      // Use default values for required fields
      await convertToProMutation.mutateAsync({
        name: email.split("@")[0] || "Profesional", // Use email prefix as name
        email: email,
        phone: undefined,
        hourlyRate: 1000, // Default hourly rate (user can update later)
        categories: [Category.PLUMBING], // Default category (user can update later)
        serviceArea: undefined,
      });

      router.replace("/(tabs)/home" as any);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al registrarse. Por favor, intentá nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Text variant="h1" style={styles.title}>
          Registrarse
        </Text>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
        />
        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          style={styles.input}
        />
        {error && (
          <Text variant="small" style={styles.error}>
            {error}
          </Text>
        )}
        <Button
          variant="primary"
          onPress={handleSignUp}
          disabled={loading || convertToProMutation.isPending}
          style={styles.button}
        >
          {loading || convertToProMutation.isPending
            ? "Registrando..."
            : "Crear cuenta"}
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
  title: {
    marginBottom: theme.spacing[6],
    textAlign: "center",
  },
  input: {
    marginBottom: theme.spacing[4],
  },
  button: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  linkButton: {
    marginTop: theme.spacing[2],
  },
  error: {
    color: theme.colors.danger,
    marginBottom: theme.spacing[2],
  },
});
