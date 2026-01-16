import type { HttpStatusCode } from "@/core/api/errors";

/** Error codes for notification operations. */
export type NotificationErrorCode = "EMAIL_SEND_FAILED";

/**
 * Base error for notification-related errors.
 */
export class NotificationError extends Error {
  readonly code: NotificationErrorCode;
  readonly statusCode: HttpStatusCode;

  constructor(message: string, code: NotificationErrorCode, statusCode: HttpStatusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

/** Thrown when email sending fails via Resend API or network error occurs. */
export class EmailSendFailedError extends NotificationError {
  constructor(recipient: string, reason?: string) {
    const message = reason
      ? `Failed to send email to ${recipient}: ${reason}`
      : `Failed to send email to ${recipient}`;
    super(message, "EMAIL_SEND_FAILED", 500);
  }
}
