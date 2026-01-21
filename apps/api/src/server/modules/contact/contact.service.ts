import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/server/container/tokens";
import type { NotificationService } from "../notification/notification.service";
import type { ContactFormInput } from "@repo/domain";

/**
 * Contact service
 * Handles business logic for contact form submissions
 */
@injectable()
export class ContactService {
  constructor(
    @inject(TOKENS.NotificationService)
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Submit a contact form
   * Sends an email notification to the support/admin team
   */
  async submitContactForm(input: ContactFormInput): Promise<{
    success: boolean;
    messageId?: string;
  }> {
    // Prepare email content
    const subject = `Contacto: ${input.subject}`;
    const text = `
Nuevo mensaje de contacto recibido:

Nombre: ${input.name}
Email: ${input.email}
Asunto: ${input.subject}

Mensaje:
${input.message}

---
Este mensaje fue enviado desde el formulario de contacto.
    `.trim();

    const html = `
      <h2>Nuevo mensaje de contacto recibido</h2>
      <p><strong>Nombre:</strong> ${this.escapeHtml(input.name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${this.escapeHtml(input.email)}">${this.escapeHtml(input.email)}</a></p>
      <p><strong>Asunto:</strong> ${this.escapeHtml(input.subject)}</p>
      <hr>
      <p><strong>Mensaje:</strong></p>
      <p>${this.escapeHtml(input.message).replace(/\n/g, "<br>")}</p>
      <hr>
      <p><em>Este mensaje fue enviado desde el formulario de contacto.</em></p>
    `.trim();

    // Get admin email from environment (fallback to a default)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || "support@arreglatodo.com";

    // Send notification via NotificationService
    const idempotencyKey = `contact:${input.email}:${Date.now()}`;
    const result = await this.notificationService.deliverNow({
      channel: "EMAIL",
      recipientRef: adminEmail,
      templateId: "contact.form",
      payload: {
        subject,
        text,
        html,
        name: input.name,
        email: input.email,
        message: input.message,
      },
      idempotencyKey,
    });

    return {
      success: result.status === "SENT",
      messageId: result.id,
    };
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
  }
}
