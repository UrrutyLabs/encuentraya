import { View, Text, StyleSheet, ViewProps } from "react-native";
import { theme } from "../../theme";

interface BadgeProps extends ViewProps {
  children: string;
  variant?: "success" | "warning" | "danger" | "info";
}

export function Badge({
  children,
  variant = "info",
  style,
  ...props
}: BadgeProps) {
  const variantStyles = {
    success: {
      backgroundColor: `${theme.colors.success}1A`, // 10% opacity
      borderColor: `${theme.colors.success}33`, // 20% opacity
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
  };

  const variantStyle = variantStyles[variant];

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
      <Text style={[styles.badgeText, { color: variantStyle.color }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: theme.typography.sizes.xs.fontSize,
    fontWeight: theme.typography.weights.medium,
  },
});
