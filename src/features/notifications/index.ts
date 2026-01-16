// Export types and schemas

export type { NotificationErrorCode } from "./errors";
// Export errors
export { EmailSendFailedError, EmailTemplateError, InvalidRecipientEmailError } from "./errors";
export type { BookingConfirmationEmailData, EmailSendResult } from "./schemas";
export { BookingConfirmationEmailSchema } from "./schemas";

// Export service functions
export { sendBookingConfirmation } from "./service";
