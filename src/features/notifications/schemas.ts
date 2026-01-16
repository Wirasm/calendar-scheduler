import { z } from "zod/v4";

/**
 * Schema for booking confirmation email data.
 * Validates that startTime is before endTime.
 */
export const BookingConfirmationEmailSchema = z
  .object({
    appointmentId: z.string().uuid(),
    eventTypeName: z.string().min(1, "Event type name is required"),
    startTime: z.date(),
    endTime: z.date(),
    attendeeName: z.string().min(1, "Attendee name is required"),
    attendeeEmail: z.string().email(),
    attendeeMessage: z.string().nullable(),
    consultantName: z.string().min(1, "Consultant name is required"),
    consultantEmail: z.string().email(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Start time must be before end time",
    path: ["endTime"],
  });

export type BookingConfirmationEmailData = z.infer<typeof BookingConfirmationEmailSchema>;
