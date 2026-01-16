import { z } from "zod/v4";

/**
 * Schema for booking confirmation email data.
 */
export const BookingConfirmationEmailSchema = z.object({
  appointmentId: z.string().uuid(),
  eventTypeName: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  attendeeName: z.string(),
  attendeeEmail: z.string().email(),
  attendeeMessage: z.string().nullable(),
  consultantName: z.string(),
  consultantEmail: z.string().email(),
});

export type BookingConfirmationEmailData = z.infer<typeof BookingConfirmationEmailSchema>;

/**
 * Schema for Resend email send response.
 */
export const EmailSendResultSchema = z.object({
  id: z.string(),
});

export type EmailSendResult = z.infer<typeof EmailSendResultSchema>;
