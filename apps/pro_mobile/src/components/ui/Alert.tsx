import { View, StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "./Text";
import { theme } from "../../theme";

export interface AlertProps {
  variant?: "info" | "warning" | "error" | "success";
  icon?: React.ReactNode; // Optional custom icon
  title?: string; // Optional title (if provided, shows detailed layout)
  message: string; // Required message
  showBorder?: boolean; // Optional left border accent
  style?: ViewStyle; // Optional custom styles
}

const variantIcons = {
  info: "info",
  warning: "alert-circle",
  error: "x-circle",
  success: "check-circle",
} as const;

const variantColors = {
  info: theme.colors.info || theme.colors.primary,
  warning: theme.colors.warning || theme.colors.primary,
  error: theme.colors.danger,
  success: theme.colors.success,
} as const;

export function Alert({
  variant = "info",
  icon,
  title,
  message,
  showBorder = false,
  style,
}: AlertProps) {
  const variantColor = variantColors[variant];
  const iconName = variantIcons[variant];
  const backgroundColor = `${variantColor}1A`;
  const borderColor = variantColor;
  const iconSize = title ? 16 : 14;

  const defaultIcon = (
    <Feather name={iconName} size={iconSize} color={variantColor} />
  );

  return (
    <View
      style={[
        styles.alert,
        {
          backgroundColor,
          ...(showBorder && {
            borderLeftWidth: 3,
            borderLeftColor: borderColor,
          }),
        },
        style,
      ]}
    >
      {icon || defaultIcon}
      <View style={styles.content}>
        {title && (
          <Text variant="small" style={styles.title}>
            {title}
          </Text>
        )}
        <Text variant="small" style={styles.message}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: theme.spacing[2],
    borderRadius: theme.radius.md,
    gap: theme.spacing[1],
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing[1],
  },
  message: {
    color: theme.colors.text,
  },
});
