import { useState, useMemo, useEffect } from "react";
import { View, StyleSheet, ScrollView, Switch, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { AvailabilitySkeleton } from "@components/presentational/AvailabilitySkeleton";
import { useAvailabilitySlots } from "@hooks/pro/useAvailabilitySlots";
import type { AvailabilitySlotInput } from "@repo/domain";
import { theme } from "../../theme";

const DAYS_OF_WEEK = [
  { day: 0, label: "Domingo" },
  { day: 1, label: "Lunes" },
  { day: 2, label: "Martes" },
  { day: 3, label: "Miércoles" },
  { day: 4, label: "Jueves" },
  { day: 5, label: "Viernes" },
  { day: 6, label: "Sábado" },
];

export function AvailabilityScreen() {
  const { slots, isLoading, error, updateSlots, isSaving } =
    useAvailabilitySlots();

  // Create a map of dayOfWeek -> slot for easy lookup
  const slotsByDay = useMemo(() => {
    const map = new Map<
      number,
      { id: string; startTime: string; endTime: string }
    >();
    slots.forEach((slot) => {
      map.set(slot.dayOfWeek, {
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    });
    return map;
  }, [slots]);

  // Local state for editing
  const [editingSlots, setEditingSlots] = useState<
    Map<number, { enabled: boolean; startTime: string; endTime: string }>
  >(() => {
    const map = new Map();
    DAYS_OF_WEEK.forEach(({ day }) => {
      const existing = slotsByDay.get(day);
      map.set(day, {
        enabled: !!existing,
        startTime: existing?.startTime || "09:00",
        endTime: existing?.endTime || "17:00",
      });
    });
    return map;
  });

  // Update local state when slots change
  useEffect(() => {
    const newMap = new Map();
    DAYS_OF_WEEK.forEach(({ day }) => {
      const existing = slotsByDay.get(day);
      newMap.set(day, {
        enabled: !!existing,
        startTime: existing?.startTime || "09:00",
        endTime: existing?.endTime || "17:00",
      });
    });
    setEditingSlots(newMap);
  }, [slotsByDay]);

  const handleDayToggle = (day: number) => {
    const current = editingSlots.get(day);
    if (current) {
      const newMap = new Map(editingSlots);
      newMap.set(day, {
        ...current,
        enabled: !current.enabled,
      });
      setEditingSlots(newMap);
    }
  };

  const handleTimeChange = (
    day: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const current = editingSlots.get(day);
    if (current) {
      const newMap = new Map(editingSlots);
      newMap.set(day, {
        ...current,
        [field]: value,
      });
      setEditingSlots(newMap);
    }
  };

  const handleSave = async () => {
    const slotsToSave: AvailabilitySlotInput[] = [];
    editingSlots.forEach((slot, day) => {
      if (slot.enabled) {
        slotsToSave.push({
          dayOfWeek: day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      }
    });

    try {
      await updateSlots(slotsToSave);
    } catch {
      // Error handled by hook
    }
  };

  const hasChanges = useMemo(() => {
    // Check if any day's enabled state changed
    for (const { day } of DAYS_OF_WEEK) {
      const editing = editingSlots.get(day);
      const existing = slotsByDay.get(day);
      if (!!editing?.enabled !== !!existing) {
        return true;
      }
      if (editing?.enabled && existing) {
        if (
          editing.startTime !== existing.startTime ||
          editing.endTime !== existing.endTime
        ) {
          return true;
        }
      }
    }
    return false;
  }, [editingSlots, slotsByDay]);

  if (isLoading) {
    return <AvailabilitySkeleton />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.titleRow}>
        <Feather name="calendar" size={24} color={theme.colors.primary} />
        <Text variant="h1" style={styles.title}>
          Disponibilidad
        </Text>
      </View>

      <Text variant="small" style={styles.helperText}>
        Configurá tus horarios de disponibilidad. Los clientes podrán solicitar
        servicios durante estos horarios.
      </Text>

      <Card style={styles.card}>
        {DAYS_OF_WEEK.map(({ day, label }, index) => {
          const slot = editingSlots.get(day);
          if (!slot) return null;

          return (
            <View
              key={day}
              style={[
                styles.dayRow,
                index === DAYS_OF_WEEK.length - 1 && styles.lastDayRow,
              ]}
            >
              <View style={styles.dayHeader}>
                <View style={styles.dayToggleRow}>
                  <Switch
                    value={slot.enabled}
                    onValueChange={() => handleDayToggle(day)}
                    disabled={isSaving}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                    thumbColor={theme.colors.surface}
                  />
                  <Text variant="body" style={styles.dayLabel}>
                    {label}
                  </Text>
                </View>
              </View>

              {slot.enabled && (
                <View style={styles.timeInputsRow}>
                  <View style={styles.timeInputContainer}>
                    <Text variant="small" style={styles.timeLabel}>
                      Desde
                    </Text>
                    <TextInput
                      style={styles.timeInput}
                      value={slot.startTime}
                      onChangeText={(value) =>
                        handleTimeChange(day, "startTime", value)
                      }
                      placeholder="09:00"
                      placeholderTextColor={theme.colors.muted}
                      editable={!isSaving}
                    />
                  </View>

                  <View style={styles.timeInputContainer}>
                    <Text variant="small" style={styles.timeLabel}>
                      Hasta
                    </Text>
                    <TextInput
                      style={styles.timeInput}
                      value={slot.endTime}
                      onChangeText={(value) =>
                        handleTimeChange(day, "endTime", value)
                      }
                      placeholder="17:00"
                      placeholderTextColor={theme.colors.muted}
                      editable={!isSaving}
                    />
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </Card>

      {error && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={16} color={theme.colors.danger} />
          <Text variant="small" style={styles.error}>
            {error}
          </Text>
        </View>
      )}

      <Button
        onPress={handleSave}
        disabled={isSaving || !hasChanges}
        style={styles.saveButton}
      >
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  contentContainer: {
    padding: theme.spacing[4],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  title: {
    marginLeft: theme.spacing[2],
  },
  helperText: {
    color: theme.colors.muted,
    marginBottom: theme.spacing[4],
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  dayRow: {
    marginBottom: theme.spacing[4],
    paddingBottom: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastDayRow: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  dayHeader: {
    marginBottom: theme.spacing[2],
  },
  dayToggleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayLabel: {
    marginLeft: theme.spacing[2],
  },
  timeInputsRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
    marginTop: theme.spacing[2],
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: theme.spacing[1],
    color: theme.colors.muted,
  },
  timeInput: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.body.fontSize,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[4],
    padding: theme.spacing[2],
    backgroundColor: `${theme.colors.danger}1A`,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: `${theme.colors.danger}33`,
  },
  error: {
    marginLeft: theme.spacing[1],
    color: theme.colors.danger,
  },
  saveButton: {
    marginTop: theme.spacing[2],
  },
});
