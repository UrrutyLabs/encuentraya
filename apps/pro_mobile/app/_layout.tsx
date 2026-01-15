import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { ActivityIndicator, View } from "react-native";
import { TRPCProvider } from "../src/lib/trpc/Provider";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { OfflineIndicator } from "../src/components/OfflineIndicator";
import { initCrashReporting } from "../src/lib/crash-reporting";
import { theme } from "../src/theme";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Initialize crash reporting on app start
  useEffect(() => {
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
        <OfflineIndicator />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.text,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ title: "Iniciar sesión" }} />
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
          <Stack.Screen name="booking/[bookingId]" options={{ title: "Detalle de reserva" }} />
          <Stack.Screen 
            name="settings/payout" 
            options={{ 
              title: "Cobros",
              headerBackTitle: "Atrás",
            }} 
          />
        </Stack>
      </TRPCProvider>
    </ErrorBoundary>
  );
}
