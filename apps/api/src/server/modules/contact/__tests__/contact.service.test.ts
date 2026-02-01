import { describe, it, expect, beforeEach, vi } from "vitest";
import { ContactService } from "../contact.service";
import type { NotificationService } from "../../notification/notification.service";
import type { ContactFormInput } from "@repo/domain";
import { $Enums } from "@infra/db/prisma";

// Use enum values directly to avoid issues with mocked $Enums
const NotificationDeliveryStatus = {
  QUEUED: "QUEUED" as const,
  SENT: "SENT" as const,
  FAILED: "FAILED" as const,
};

describe("ContactService", () => {
  let service: ContactService;
  let mockNotificationService: ReturnType<typeof createMockNotificationService>;

  function createMockNotificationService(): {
    deliverNow: ReturnType<typeof vi.fn>;
  } {
    return {
      deliverNow: vi.fn(),
    };
  }

  function createContactFormInput(
    overrides?: Partial<ContactFormInput>
  ): ContactFormInput {
    return {
      name: "John Doe",
      email: "john@example.com",
      subject: "Test Subject",
      message:
        "This is a test message with enough characters to pass validation.",
      ...overrides,
    };
  }

  beforeEach(() => {
    mockNotificationService = createMockNotificationService();
    service = new ContactService(
      mockNotificationService as unknown as NotificationService
    );
    vi.clearAllMocks();
  });

  describe("submitContactForm", () => {
    it("should successfully submit contact form and send email", async () => {
      // Arrange
      const input = createContactFormInput();
      const mockDeliveryResult = {
        id: "delivery-123",
        status:
          NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
        provider: "sendgrid",
        providerMessageId: "msg-123",
      };

      mockNotificationService.deliverNow.mockResolvedValue(mockDeliveryResult);

      // Act
      const result = await service.submitContactForm(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.messageId).toBe("delivery-123");
      expect(mockNotificationService.deliverNow).toHaveBeenCalledTimes(1);

      const callArgs = mockNotificationService.deliverNow.mock.calls[0][0];
      expect(callArgs.channel).toBe("EMAIL");
      expect(callArgs.recipientRef).toBeDefined();
      expect(callArgs.templateId).toBe("contact.form");
      expect(callArgs.payload.subject).toContain("Contacto: Test Subject");
      expect(callArgs.payload.text).toContain("John Doe");
      expect(callArgs.payload.text).toContain("john@example.com");
      expect(callArgs.payload.text).toContain("Test Subject");
      expect(callArgs.payload.text).toContain("This is a test message");
      expect(callArgs.payload.html).toBeDefined();
      expect(callArgs.idempotencyKey).toContain("contact:john@example.com");
    });

    it("should use ADMIN_EMAIL from environment if available", async () => {
      // Arrange
      const originalAdminEmail = process.env.ADMIN_EMAIL;
      process.env.ADMIN_EMAIL = "admin@example.com";

      const input = createContactFormInput();
      mockNotificationService.deliverNow.mockResolvedValue({
        id: "delivery-123",
        status:
          NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
      });

      // Act
      await service.submitContactForm(input);

      // Assert
      const callArgs = mockNotificationService.deliverNow.mock.calls[0][0];
      expect(callArgs.recipientRef).toBe("admin@example.com");

      // Cleanup
      if (originalAdminEmail) {
        process.env.ADMIN_EMAIL = originalAdminEmail;
      } else {
        delete process.env.ADMIN_EMAIL;
      }
    });

    it("should use SUPPORT_EMAIL if ADMIN_EMAIL is not set", async () => {
      // Arrange
      const originalAdminEmail = process.env.ADMIN_EMAIL;
      const originalSupportEmail = process.env.SUPPORT_EMAIL;
      delete process.env.ADMIN_EMAIL;
      process.env.SUPPORT_EMAIL = "support@example.com";

      const input = createContactFormInput();
      mockNotificationService.deliverNow.mockResolvedValue({
        id: "delivery-123",
        status:
          NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
      });

      // Act
      await service.submitContactForm(input);

      // Assert
      const callArgs = mockNotificationService.deliverNow.mock.calls[0][0];
      expect(callArgs.recipientRef).toBe("support@example.com");

      // Cleanup
      if (originalAdminEmail) {
        process.env.ADMIN_EMAIL = originalAdminEmail;
      }
      if (originalSupportEmail) {
        process.env.SUPPORT_EMAIL = originalSupportEmail;
      } else {
        delete process.env.SUPPORT_EMAIL;
      }
    });

    it("should use default email if neither ADMIN_EMAIL nor SUPPORT_EMAIL is set", async () => {
      // Arrange
      const originalAdminEmail = process.env.ADMIN_EMAIL;
      const originalSupportEmail = process.env.SUPPORT_EMAIL;
      delete process.env.ADMIN_EMAIL;
      delete process.env.SUPPORT_EMAIL;

      const input = createContactFormInput();
      mockNotificationService.deliverNow.mockResolvedValue({
        id: "delivery-123",
        status:
          NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
      });

      // Act
      await service.submitContactForm(input);

      // Assert
      const callArgs = mockNotificationService.deliverNow.mock.calls[0][0];
      expect(callArgs.recipientRef).toBe("support@encuentraya.com");

      // Cleanup
      if (originalAdminEmail) {
        process.env.ADMIN_EMAIL = originalAdminEmail;
      }
      if (originalSupportEmail) {
        process.env.SUPPORT_EMAIL = originalSupportEmail;
      }
    });

    it("should escape HTML in email content to prevent XSS", async () => {
      // Arrange
      const input = createContactFormInput({
        name: "<script>alert('xss')</script>",
        email: "test@example.com",
        subject: "Test <b>Subject</b>",
        message:
          "Message with <script>alert('xss')</script> and & special chars",
      });

      mockNotificationService.deliverNow.mockResolvedValue({
        id: "delivery-123",
        status:
          NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
      });

      // Act
      await service.submitContactForm(input);

      // Assert
      const callArgs = mockNotificationService.deliverNow.mock.calls[0][0];
      const html = callArgs.payload.html as string;

      // Check that HTML is escaped
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("&amp;");
      expect(html).not.toContain("<b>Subject</b>");
      expect(html).toContain("&lt;b&gt;Subject&lt;/b&gt;");
    });

    it("should format email text correctly with all fields", async () => {
      // Arrange
      const input = createContactFormInput({
        name: "Jane Smith",
        email: "jane@example.com",
        subject: "Help Request",
        message: "I need help with my booking.\n\nPlease contact me.",
      });

      mockNotificationService.deliverNow.mockResolvedValue({
        id: "delivery-123",
        status:
          NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
      });

      // Act
      await service.submitContactForm(input);

      // Assert
      const callArgs = mockNotificationService.deliverNow.mock.calls[0][0];
      const text = callArgs.payload.text as string;

      expect(text).toContain("Jane Smith");
      expect(text).toContain("jane@example.com");
      expect(text).toContain("Help Request");
      expect(text).toContain("I need help with my booking");
      expect(text).toContain("Please contact me");
    });

    it("should convert newlines to <br> in HTML content", async () => {
      // Arrange
      const input = createContactFormInput({
        message: "Line 1\nLine 2\n\nLine 3",
      });

      mockNotificationService.deliverNow.mockResolvedValue({
        id: "delivery-123",
        status:
          NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
      });

      // Act
      await service.submitContactForm(input);

      // Assert
      const callArgs = mockNotificationService.deliverNow.mock.calls[0][0];
      const html = callArgs.payload.html as string;

      // Check that the message content has newlines converted to <br>
      expect(html).toContain("Line 1<br>Line 2<br><br>Line 3");
      // The message part should not contain raw newlines (only template formatting)
      const messagePart = html.match(
        /<p><strong>Mensaje:<\/strong><\/p>\s*<p>(.*?)<\/p>/
      )?.[1];
      expect(messagePart).toBeDefined();
      if (messagePart) {
        expect(messagePart).toContain("<br>");
        // The message content itself should not have raw newlines
        expect(messagePart).not.toMatch(/Line 1\nLine 2/);
      }
    });

    it("should return success false if notification delivery fails", async () => {
      // Arrange
      const input = createContactFormInput();
      mockNotificationService.deliverNow.mockResolvedValue({
        id: "delivery-123",
        status:
          NotificationDeliveryStatus.FAILED as $Enums.NotificationDeliveryStatus,
        error: "Failed to send email",
      });

      // Act
      const result = await service.submitContactForm(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.messageId).toBe("delivery-123");
    });

    it("should return success false if notification is queued but not sent", async () => {
      // Arrange
      const input = createContactFormInput();
      mockNotificationService.deliverNow.mockResolvedValue({
        id: "delivery-123",
        status:
          NotificationDeliveryStatus.QUEUED as $Enums.NotificationDeliveryStatus,
      });

      // Act
      const result = await service.submitContactForm(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.messageId).toBe("delivery-123");
    });

    it("should generate unique idempotency key based on email and timestamp", async () => {
      // Arrange
      const input = createContactFormInput({
        email: "unique@example.com",
      });

      mockNotificationService.deliverNow.mockResolvedValue({
        id: "delivery-123",
        status:
          NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
      });

      // Act
      await service.submitContactForm(input);

      // Assert
      const callArgs = mockNotificationService.deliverNow.mock.calls[0][0];
      expect(callArgs.idempotencyKey).toContain("contact:unique@example.com");
      expect(callArgs.idempotencyKey).toMatch(
        /^contact:unique@example\.com:\d+$/
      );
    });

    it("should include all input fields in notification payload", async () => {
      // Arrange
      const input = createContactFormInput({
        name: "Test User",
        email: "test@example.com",
        subject: "Test Subject",
        message: "Test message content",
      });

      mockNotificationService.deliverNow.mockResolvedValue({
        id: "delivery-123",
        status:
          NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
      });

      // Act
      await service.submitContactForm(input);

      // Assert
      const callArgs = mockNotificationService.deliverNow.mock.calls[0][0];
      const payload = callArgs.payload;

      expect(payload.name).toBe("Test User");
      expect(payload.email).toBe("test@example.com");
      expect(payload.message).toBe("Test message content");
      expect(payload.subject).toBeDefined();
      expect(payload.text).toBeDefined();
      expect(payload.html).toBeDefined();
    });
  });
});
