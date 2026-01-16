// Export errors
export type { NotificationErrorCode } from "./errors";
export { EmailSendFailedError, NotificationError } from "./errors";

// Export types and schemas
export type { BookingConfirmationEmailData } from "./schemas";
export { BookingConfirmationEmailSchema } from "./schemas";

// Export service functions
export { sendBookingConfirmation } from "./service";
