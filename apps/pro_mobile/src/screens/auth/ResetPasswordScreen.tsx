import { useState } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { useResetPasswordWithOtp } from "@hooks/auth";
import { theme } from "../../theme";

export function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { resetPassword, isPending, error } = useResetPasswordWithOtp();
  const [email, setEmail] = useState(params.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setValidationError(null);

    // Validate email
    if (!email) {
      setValidationError("El email es requerido");
      return;
    }

    // Validate OTP
    if (!otp || otp.length < 6 || otp.length > 8) {
      setValidationError("El código debe tener entre 6 y 8 dígitos");
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setValidationError("Las contraseñas no coinciden");
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setValidationError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      await resetPassword(email, otp, newPassword);
      // Success - hook will handle redirect
    } catch {
      // Error is handled by hook state
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Feather name="lock" size={24} color={theme.colors.primary} />
          <Text variant="h1" style={styles.title}>
            Restablecer contraseña
          </Text>
        </View>
        <Text variant="body" style={styles.message}>
          Ingresá el código que recibiste por email y tu nueva contraseña.
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
        <Input
          label="Código de recuperación"
          icon="key"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          placeholder="12345678"
          maxLength={8}
          style={styles.input}
          editable={!isPending}
        />
        <Input
          label="Nueva contraseña"
          icon="lock"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
          placeholder="Mínimo 8 caracteres"
          style={styles.input}
          editable={!isPending}
        />
        <Input
          label="Confirmar contraseña"
          icon="lock"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
          placeholder="Repetí tu contraseña"
          style={styles.input}
          editable={!isPending}
        />
        {(error || validationError) && (
          <View style={styles.errorContainer}>
            <Feather
              name="alert-circle"
              size={16}
              color={theme.colors.danger}
            />
            <Text variant="small" style={styles.error}>
              {validationError ||
                error?.message ||
                "Error al restablecer la contraseña. Por favor, intentá nuevamente."}
            </Text>
          </View>
        )}
        <Button
          variant="primary"
          onPress={handleSubmit}
          disabled={
            isPending || !email || !otp || !newPassword || !confirmPassword
          }
          style={styles.button}
        >
          {isPending ? "Restableciendo..." : "Restablecer contraseña"}
        </Button>
        <Button
          variant="ghost"
          onPress={() => router.replace("/auth/forgot-password" as any)}
          style={styles.linkButton}
        >
          Solicitar nuevo código
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
    marginBottom: theme.spacing[6],
    color: theme.colors.text,
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
