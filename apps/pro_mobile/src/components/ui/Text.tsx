import { Text as RNText, TextProps as RNTextProps } from "react-native";
import { theme } from "../../theme";

interface TextProps extends RNTextProps {
  children: React.ReactNode;
  variant?: "body" | "small" | "xs" | "h1" | "h2" | "h3";
}

export function Text({
  children,
  variant = "body",
  style,
  ...props
}: TextProps) {
  const variantStyles = {
    h1: {
      fontSize: theme.typography.sizes.h1.fontSize,
      lineHeight: theme.typography.sizes.h1.lineHeight,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
    },
    h2: {
      fontSize: theme.typography.sizes.h2.fontSize,
      lineHeight: theme.typography.sizes.h2.lineHeight,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    h3: {
      fontSize: theme.typography.sizes.h3.fontSize,
      lineHeight: theme.typography.sizes.h3.lineHeight,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    body: {
      fontSize: theme.typography.sizes.body.fontSize,
      lineHeight: theme.typography.sizes.body.lineHeight,
      fontWeight: theme.typography.weights.regular,
      color: theme.colors.text,
    },
    small: {
      fontSize: theme.typography.sizes.small.fontSize,
      lineHeight: theme.typography.sizes.small.lineHeight,
      fontWeight: theme.typography.weights.regular,
      color: theme.colors.text,
    },
    xs: {
      fontSize: theme.typography.sizes.xs.fontSize,
      lineHeight: theme.typography.sizes.xs.lineHeight,
      fontWeight: theme.typography.weights.regular,
      color: theme.colors.text,
    },
  };

  return (
    <RNText style={[variantStyles[variant], style]} {...props}>
      {children}
    </RNText>
  );
}
