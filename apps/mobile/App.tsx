import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { TRPCProvider } from "./components/TRPCProvider";
import { LoginScreen } from "./screens/LoginScreen";
import { trpc } from "./utils/trpc";
import { supabase } from "./lib/supabase/client";

function ProtectedContent({ onLogout }: { onLogout: () => void }) {
  const { data: healthData, isLoading: healthLoading, error: healthError } =
    trpc.health.ping.useQuery();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <View style={styles.content}>
      <Text style={styles.title}>ArreglaTodo - Mobile</Text>
      <Text style={styles.subtitle}>Protected Content</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Check (Public)</Text>
        {healthLoading && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.statusText}>Loading...</Text>
          </View>
        )}
        {healthError && (
          <View style={styles.statusContainer}>
            <Text style={styles.errorText}>Error: {healthError.message}</Text>
          </View>
        )}
        {healthData && (
          <View style={styles.statusContainer}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, healthData.ok && styles.success]}>
              {healthData.ok ? "✓ OK" : "✗ Error"}
            </Text>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>{healthData.time.toLocaleString()}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsCheckingAuth(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading state until fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.statusText}>Loading fonts...</Text>
      </View>
    );
  }

  if (isCheckingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.statusText}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <TRPCProvider>
      <View style={styles.container}>
        {isAuthenticated ? (
          <ProtectedContent onLogout={() => setIsAuthenticated(false)} />
        ) : (
          <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
        )}
        <StatusBar style="auto" />
      </View>
    </TRPCProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
    color: "#666",
  },
  section: {
    width: "100%",
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#000",
  },
  statusContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  statusText: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    color: "#333",
  },
  value: {
    fontSize: 16,
    marginTop: 4,
    color: "#000",
  },
  success: {
    color: "#34C759",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
  },
  logoutButton: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
