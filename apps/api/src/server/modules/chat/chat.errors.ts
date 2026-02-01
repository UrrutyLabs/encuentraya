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
