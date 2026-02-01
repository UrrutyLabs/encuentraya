/**
 * Chat module errors
 */

export class ChatForbiddenError extends Error {
  constructor(orderId: string) {
    super(`You are not a participant of order ${orderId}`);
    this.name = "ChatForbiddenError";
  }
}

export class ChatClosedError extends Error {
  constructor(orderId: string) {
    super(`Chat for order ${orderId} is closed`);
    this.name = "ChatClosedError";
  }
}

/** Thrown when a chat message contains phone, email or other contact info (blocked + audit logged). */
export class ChatContactInfoNotAllowedError extends Error {
  constructor() {
    super(
      "No está permitido compartir teléfono, email u otros datos de contacto. Hacerlo puede resultar en la suspensión de tu cuenta."
    );
    this.name = "ChatContactInfoNotAllowedError";
  }
}
