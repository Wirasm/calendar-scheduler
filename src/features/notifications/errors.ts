import type { HttpStatusCode } from "@/core/api/errors";

/** Known error codes for notification operations. */
export type NotificationErrorCode =
  | "EMAIL_SEND_FAILED"
  | "INVALID_RECIPIENT_EMAIL"
  | "EMAIL_TEMPLATE_ERROR";

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

/** Thrown when email sending fails via Resend API. */
export class EmailSendFailedError extends NotificationError {
  constructor(recipient: string, reason?: string) {
    const message = reason
      ? `Failed to send email to ${recipient}: ${reason}`
      : `Failed to send email to ${recipient}`;
    super(message, "EMAIL_SEND_FAILED", 500);
  }
}

/** Thrown when recipient email is invalid. */
export class InvalidRecipientEmailError extends NotificationError {
  constructor(email: string) {
    super(`Invalid recipient email: ${email}`, "INVALID_RECIPIENT_EMAIL", 400);
  }
}

/** Thrown when email template generation fails. */
export class EmailTemplateError extends NotificationError {
  constructor(templateName: string, reason?: string) {
    const message = reason
      ? `Failed to generate email template '${templateName}': ${reason}`
      : `Failed to generate email template '${templateName}'`;
    super(message, "EMAIL_TEMPLATE_ERROR", 500);
  }
}
