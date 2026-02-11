import { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import {
  useChatMessages,
  useSendMessage,
  useChatMeta,
  useMarkRead,
} from "@hooks/chat";
import { theme } from "../../theme";

/** Message shown when contact info is detected (must match API). */
const CHAT_CONTACT_INFO_MESSAGE =
  "No está permitido compartir teléfono, email u otros datos de contacto. Hacerlo puede resultar en la suspensión de tu cuenta.";

function isContactInfoError(error: { message?: string } | null): boolean {
  const msg = error?.message ?? "";
  return (
    msg.includes("suspensión de tu cuenta") || msg.includes("datos de contacto")
  );
}

type ChatMessage = {
  id: string;
  orderId: string;
  senderUserId: string | null;
  senderRole: "client" | "pro" | "admin" | "system";
  type: "user" | "system";
  text: string;
  attachmentsJson: Record<string, unknown> | null;
  createdAt: Date;
};

export function OrderChatScreen({
  orderId,
  isPro,
}: {
  orderId: string;
  isPro: boolean;
}) {
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const {
    items,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessages(orderId);
  const { sendMessage, isSending, error: sendError } = useSendMessage(orderId);
  const { isChatOpen } = useChatMeta(orderId);
  const { markRead } = useMarkRead(orderId);
  const lastMarkedOrderIdRef = useRef<string | null>(null);

  // Mark as read once when viewing this order's chat (not on every re-render/poll)
  useEffect(() => {
    if (!orderId) return;
    if (lastMarkedOrderIdRef.current === orderId) return;
    lastMarkedOrderIdRef.current = orderId;
    markRead();
  }, [orderId, markRead]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending || !isChatOpen) return;
    try {
      await sendMessage({ orderId, text });
      setInputText("");
    } catch {
      // Error surfaced via sendError
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.senderRole === "pro" && isPro;
    const isSystem = item.type === "system" || item.senderRole === "system";

    if (isSystem) {
      return (
        <View style={styles.systemBubble}>
          <Text variant="small" style={styles.systemText}>
            {item.text}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
      >
        <Text
          variant="body"
          style={isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther}
        >
          {item.text}
        </Text>
        <Text variant="small" style={isOwn ? styles.timeOwn : styles.timeOther}>
          {new Date(item.createdAt).toLocaleTimeString("es-UY", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={48} color={theme.colors.danger} />
        <Text variant="body" style={styles.error}>
          {error.message}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="body" style={styles.emptyText}>
                No hay mensajes aún. Escribe para iniciar la conversación.
              </Text>
            </View>
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
        />
      )}

      {sendError && (
        <View style={styles.sendError}>
          {isContactInfoError(sendError) ? (
            <View style={styles.contactInfoAlert}>
              <Feather
                name="alert-triangle"
                size={20}
                color={theme.colors.danger}
                style={styles.contactInfoIcon}
              />
              <View style={styles.contactInfoContent}>
                <Text variant="small" style={styles.contactInfoTitle}>
                  Mensaje no permitido
                </Text>
                <Text variant="small" style={styles.contactInfoMessage}>
                  {CHAT_CONTACT_INFO_MESSAGE}
                </Text>
              </View>
            </View>
          ) : (
            <Text variant="small" style={styles.sendErrorText}>
              {sendError.message}
            </Text>
          )}
        </View>
      )}

      {isChatOpen ? (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={theme.colors.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={10000}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.closedBar}>
          <Text variant="small" style={styles.closedText}>
            El chat está cerrado. Solo puedes ver el historial.
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: theme.colors.danger,
    marginTop: theme.spacing[2],
  },
  listContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[2],
  },
  empty: {
    paddingVertical: theme.spacing[8],
    alignItems: "center",
  },
  emptyText: {
    color: theme.colors.muted,
  },
  bubble: {
    maxWidth: "80%",
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing[2],
  },
  bubbleOwn: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.primary,
  },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleTextOwn: {
    color: "#fff",
  },
  bubbleTextOther: {
    color: theme.colors.text,
  },
  timeOwn: {
    color: "rgba(255,255,255,0.8)",
    marginTop: theme.spacing[1],
    fontSize: 11,
  },
  timeOther: {
    color: theme.colors.muted,
    marginTop: theme.spacing[1],
    fontSize: 11,
  },
  systemBubble: {
    alignSelf: "center",
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  systemText: {
    color: theme.colors.muted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: theme.spacing[2],
    paddingBottom: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontSize: 16,
    marginRight: theme.spacing[2],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendError: {
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[1],
  },
  sendErrorText: {
    color: theme.colors.danger,
  },
  contactInfoAlert: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.danger + "80",
    backgroundColor: theme.colors.danger + "15",
  },
  contactInfoIcon: {
    marginRight: theme.spacing[2],
    marginTop: 2,
  },
  contactInfoContent: {
    flex: 1,
  },
  contactInfoTitle: {
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.danger,
  },
  contactInfoMessage: {
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
    opacity: 0.9,
  },
  closedBar: {
    padding: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  closedText: {
    color: theme.colors.muted,
    textAlign: "center",
  },
});
