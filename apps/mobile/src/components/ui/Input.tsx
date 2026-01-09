import { TextInput, TextInputProps, Text, View, StyleSheet } from "react-native";
import { theme } from "../../theme";

interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, style, ...props }: InputProps) {
  const input = (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={theme.colors.muted}
      {...props}
    />
  );

  if (label) {
    return (
      <View>
        <Text style={styles.label}>{label}</Text>
        {input}
      </View>
    );
  }

  return input;
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.body.fontSize,
  },
  label: {
    fontSize: theme.typography.sizes.small.fontSize,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing[1],
  },
});
