import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "../ui/Card";
import { Text } from "../ui/Text";
import type { FAQItem } from "@repo/content";
import { theme } from "../../theme";

interface FAQAccordionProps {
  items: FAQItem[];
  defaultExpandedCount?: number;
}

export function FAQAccordion({
  items,
  defaultExpandedCount = 4,
}: FAQAccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(
    new Set(
      Array.from(
        { length: Math.min(defaultExpandedCount, items.length) },
        (_, i) => i
      )
    )
  );

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const isOpen = openItems.has(index);
        return (
          <Card key={index} style={styles.faqCard}>
            <TouchableOpacity
              onPress={() => toggleItem(index)}
              style={styles.questionRow}
              activeOpacity={0.7}
            >
              <Text
                variant="h2"
                style={styles.question}
                numberOfLines={isOpen ? undefined : 2}
              >
                {item.question}
              </Text>
              <Feather
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.muted}
              />
            </TouchableOpacity>
            {isOpen && (
              <View style={styles.answerContainer}>
                <Text variant="body" style={styles.answer}>
                  {item.answer}
                </Text>
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing[3],
  },
  faqCard: {
    padding: theme.spacing[4],
  },
  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing[2],
  },
  question: {
    flex: 1,
    color: theme.colors.text,
  },
  answerContainer: {
    marginTop: theme.spacing[3],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  answer: {
    color: theme.colors.muted,
    lineHeight: theme.typography.sizes.body.fontSize * 1.5,
  },
});
