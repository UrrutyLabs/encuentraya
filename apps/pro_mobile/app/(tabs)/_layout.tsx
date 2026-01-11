import { Tabs } from "expo-router";
import { theme } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarLabel: "Inicio",
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Trabajos",
          tabBarLabel: "Trabajos",
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: "Disponibilidad",
          tabBarLabel: "Disponibilidad",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarLabel: "Perfil",
        }}
      />
    </Tabs>
  );
}
