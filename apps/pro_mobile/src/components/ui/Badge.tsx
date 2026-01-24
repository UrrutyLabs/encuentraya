import { View, Text, StyleSheet, ViewProps } from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../theme";

interface BadgeProps extends ViewProps {
  children: string;
  variant?: "success" | "warning" | "danger" | "info" | "new";
  showIcon?: boolean;
}

const variantIcons = {
  success: "check-circle",
  warning: "alert-circle",
  danger: "x-circle",
  info: "info",
  new: "star",
} as const;

export function Badge({
  children,
  variant = "info",
  showIcon = false,
  style,
  ...props
}: BadgeProps) {
  const variantStyles = {
    success: {
      backgroundColor: `${theme.colors.success}1A`,
      borderColor: `${theme.colors.success}33`,
      color: theme.colors.success,
    },
    warning: {
      backgroundColor: `${theme.colors.warning}1A`,
      borderColor: `${theme.colors.warning}33`,
      color: theme.colors.warning,
    },
    danger: {
      backgroundColor: `${theme.colors.danger}1A`,
      borderColor: `${theme.colors.danger}33`,
      color: theme.colors.danger,
    },
    info: {
      backgroundColor: `${theme.colors.info}1A`,
      borderColor: `${theme.colors.info}33`,
      color: theme.colors.info,
    },
    new: {
      backgroundColor: `${theme.colors.accent}1A`,
      borderColor: `${theme.colors.accent}33`,
      color: theme.colors.accent,
    },
  };

  const variantStyle = variantStyles[variant];
  const iconName = variantIcons[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
        },
        style,
      ]}
      {...props}
    >
      {showIcon && (
        <Feather
          name={iconName}
          size={12}
          color={variantStyle.color}
          style={styles.icon}
        />
      )}
      <Text style={[styles.badgeText, { color: variantStyle.color }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  icon: {
    marginRight: theme.spacing[1],
  },
  badgeText: {
    fontSize: theme.typography.sizes.xs.fontSize,
    fontWeight: theme.typography.weights.medium,
  },
});
