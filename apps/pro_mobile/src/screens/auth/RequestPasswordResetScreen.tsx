import { useState } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { useRequestPasswordReset } from "@hooks/auth";
import { theme } from "../../theme";

export function RequestPasswordResetScreen() {
  const router = useRouter();
  const { requestPasswordReset, isPending, error } = useRequestPasswordReset();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    try {
      setSuccess(false);
      await requestPasswordReset(email);
      setSuccess(true);
    } catch {
      // Error is handled by mutation state
    }
  };

  if (success) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <View style={styles.titleRow}>
            <Feather name="check-circle" size={24} color={theme.colors.success} />
            <Text variant="h1" style={styles.title}>
              Email enviado
            </Text>
          </View>
          <Text variant="body" style={styles.message}>
            Si existe una cuenta con el email {email}, recibirás un código de
            recuperación.
          </Text>
          <Text variant="body" style={styles.instructions}>
            Ingresá el código que recibiste en tu email para restablecer tu
            contraseña.
          </Text>
          <Button
            variant="primary"
            onPress={() =>
              router.replace({
                pathname: "/auth/reset-password",
                params: { email },
              } as any)
            }
            style={styles.button}
          >
            Ingresar código
          </Button>
          <Button
            variant="ghost"
            onPress={() => {
              setSuccess(false);
              setEmail("");
            }}
            style={styles.linkButton}
          >
            Enviar otro email
          </Button>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Feather name="lock" size={24} color={theme.colors.primary} />
          <Text variant="h1" style={styles.title}>
            Recuperar contraseña
          </Text>
        </View>
        <Text variant="body" style={styles.message}>
          Ingresá tu email y te enviaremos un código para restablecer tu
          contraseña.
        </Text>
        <Input
          label="Email"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
          editable={!isPending}
        />
        {error && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={16} color={theme.colors.danger} />
            <Text variant="small" style={styles.error}>
              {error.message || "Error al enviar el email. Por favor, intentá nuevamente."}
            </Text>
          </View>
        )}
        <Button
          variant="primary"
          onPress={handleSubmit}
          disabled={isPending || !email}
          style={styles.button}
        >
          {isPending ? "Enviando..." : "Enviar código"}
        </Button>
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.linkButton}
        >
          Volver al inicio de sesión
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
  message: {
    textAlign: "center",
    marginBottom: theme.spacing[4],
    color: theme.colors.text,
  },
  instructions: {
    textAlign: "center",
    marginBottom: theme.spacing[6],
    color: theme.colors.muted,
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
