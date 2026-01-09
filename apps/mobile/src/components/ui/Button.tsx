import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from "react-native";
import { theme } from "../../theme";

interface ButtonProps extends TouchableOpacityProps {
  children: string;
  variant?: "primary" | "secondary" | "accent";
}

export function Button({
  children,
  variant = "primary",
  style,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: { backgroundColor: theme.colors.primary },
    secondary: { backgroundColor: theme.colors.secondary },
    accent: { backgroundColor: theme.colors.accent },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles[variant],
        style,
      ]}
      {...props}
    >
      <Text style={styles.buttonText}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.body.fontSize,
    fontWeight: theme.typography.weights.medium,
  },
});
