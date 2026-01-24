import {
  TextInput,
  TextInputProps,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../theme";

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
}

export function Input({ label, icon, style, ...props }: InputProps) {
  const input = (
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={theme.colors.muted}
        {...props}
      />
    </View>
  );

  if (label) {
    return (
      <View>
        <View style={styles.labelRow}>
          {icon && (
            <Feather
              name={icon}
              size={14}
              color={theme.colors.muted}
              style={styles.labelIcon}
            />
          )}
          <Text style={styles.label}>{label}</Text>
        </View>
        {input}
      </View>
    );
  }

  return input;
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.body.fontSize,
  },
  inputWithIcon: {
    paddingLeft: theme.spacing[10],
  },
  inputIcon: {
    position: "absolute",
    left: theme.spacing[3],
    zIndex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[1],
  },
  labelIcon: {
    marginRight: theme.spacing[1],
  },
  label: {
    fontSize: theme.typography.sizes.small.fontSize,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
  },
});
