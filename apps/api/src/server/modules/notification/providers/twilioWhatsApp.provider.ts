import twilio from "twilio";
import type {
  NotificationProvider,
  NotificationMessage,
  NotificationSendResult,
} from "../provider";

/**
 * Twilio WhatsApp provider
 * Sends WhatsApp messages via Twilio's Content API
 */
export class TwilioWhatsAppProvider implements NotificationProvider {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM_NUMBER;

    if (!accountSid || !authToken) {
      throw new Error(
        "Missing Twilio configuration: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set"
      );
    }

    if (!fromNumber) {
      throw new Error(
        "Missing Twilio WhatsApp number: TWILIO_WHATSAPP_FROM_NUMBER must be set"
      );
    }

    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber.startsWith("whatsapp:")
      ? fromNumber
      : `whatsapp:${fromNumber}`;
  }

  async send(message: NotificationMessage): Promise<NotificationSendResult> {
    // recipientRef for WhatsApp channel should be a phone number
    // Format recipient phone number for WhatsApp (E.164 format)
    const toNumber = this.formatPhoneNumber(message.recipientRef);

    // Map templateId to Twilio contentSid
    // For now, use templateId directly if it looks like a Twilio content SID
    // Otherwise, you may need a mapping table
    const contentSid = message.templateId;

    // Convert payload to Twilio contentVariables format
    // Twilio expects contentVariables as a JSON string with numbered keys
    const contentVariables = this.formatContentVariables(message.payload);

    try {
      const twilioMessage = await this.client.messages.create({
        from: this.fromNumber,
        to: `whatsapp:${toNumber}`,
        contentSid,
        contentVariables,
      });

      return {
        provider: "twilio-whatsapp",
        providerMessageId: twilioMessage.sid,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to send WhatsApp message via Twilio: ${errorMessage}`
      );
    }
  }

  /**
   * Format phone number to E.164 format (e.g., +59895551208)
   * Assumes recipientRef is already a phone number
   */
  private formatPhoneNumber(recipientRef: string): string {
    // Remove any non-digit characters except +
    let cleaned = recipientRef.replace(/[^\d+]/g, "");

    // If it doesn't start with +, assume it's a local number
    // You may need to adjust this based on your country code
    if (!cleaned.startsWith("+")) {
      // Default to Uruguay country code if no + prefix
      cleaned = `+598${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Format payload to Twilio contentVariables format
   * Twilio expects: '{"1":"value1","2":"value2"}'
   */
  private formatContentVariables(payload: unknown): string {
    if (!payload || typeof payload !== "object") {
      return "{}";
    }

    // Convert object to numbered keys format
    const entries = Object.entries(payload);
    const contentVars: Record<string, string> = {};

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Key not needed, only using index
    entries.forEach(([_key, value], index) => {
      // Use 1-based indexing as Twilio expects
      contentVars[String(index + 1)] = String(value);
    });

    return JSON.stringify(contentVars);
  }
}
