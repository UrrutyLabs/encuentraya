import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { ActivityIndicator, View } from "react-native";
import { TRPCProvider } from "@lib/trpc/Provider";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { OfflineIndicator } from "@components/OfflineIndicator";
import { CategoriesPrefetcher } from "@components/CategoriesPrefetcher";
import { initCrashReporting } from "@lib/crash-reporting";
import { initializeEnvValidation } from "@lib/env-validation";
import { theme } from "../src/theme";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Validate environment variables and initialize crash reporting on app start
  useEffect(() => {
    initializeEnvValidation();
    initCrashReporting();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <TRPCProvider>
        <CategoriesPrefetcher />
        <OfflineIndicator />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.text,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="auth/login"
            options={{ title: "Iniciar sesión" }}
          />
          <Stack.Screen name="auth/signup" options={{ title: "Registrarse" }} />
          <Stack.Screen
            name="auth/confirm-email"
            options={{
              title: "Confirmar email",
              headerBackVisible: false,
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{
              title: "Completar perfil",
              headerBackVisible: false,
            }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="job/[jobId]"
            options={{
              title: "Detalles del Trabajo",
              headerBackTitle: "Atrás",
            }}
          />
          <Stack.Screen
            name="job/[jobId]/chat"
            options={{
              title: "Mensajes",
              headerBackTitle: "Atrás",
            }}
          />
          <Stack.Screen
            name="settings/payout"
            options={{
              title: "Cobros",
              headerBackTitle: "Atrás",
            }}
          />
          <Stack.Screen
            name="settings/help"
            options={{
              title: "Ayuda",
              headerBackTitle: "Atrás",
            }}
          />
          <Stack.Screen
            name="profile/earnings"
            options={{
              title: "Historial de ingresos",
              headerBackTitle: "Atrás",
            }}
          />
          <Stack.Screen
            name="profile/edit"
            options={{
              title: "Editar perfil",
              headerBackTitle: "Atrás",
            }}
          />
        </Stack>
      </TRPCProvider>
    </ErrorBoundary>
  );
}
