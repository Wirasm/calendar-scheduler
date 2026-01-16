import { z } from "zod/v4";

// ============================================================================
// Event Type Schemas
// ============================================================================

export const CreateEventTypeSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be at most 100 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  bufferBeforeMinutes: z.number().int().min(0).max(60).default(0),
  bufferAfterMinutes: z.number().int().min(0).max(60).default(15),
  minNoticeHours: z.number().int().min(0).max(168).default(24), // max 1 week
  maxAdvanceDays: z.number().int().min(1).max(90).default(14), // max 3 months
  isActive: z.boolean().default(true),
});

export type CreateEventTypeInput = z.infer<typeof CreateEventTypeSchema>;

export const UpdateEventTypeSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  bufferBeforeMinutes: z.number().int().min(0).max(60).optional(),
  bufferAfterMinutes: z.number().int().min(0).max(60).optional(),
  minNoticeHours: z.number().int().min(0).max(168).optional(),
  maxAdvanceDays: z.number().int().min(1).max(90).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateEventTypeInput = z.infer<typeof UpdateEventTypeSchema>;

// ============================================================================
// Availability Window Schemas
// ============================================================================

export const CreateAvailabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
});

export type CreateAvailabilityWindowInput = z.infer<typeof CreateAvailabilityWindowSchema>;

export const UpdateAvailabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
    .optional(),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
    .optional(),
});

export type UpdateAvailabilityWindowInput = z.infer<typeof UpdateAvailabilityWindowSchema>;

// ============================================================================
// Appointment Schemas
// ============================================================================

export const CreateAppointmentSchema = z.object({
  eventTypeId: z.string().uuid(),
  startTime: z.coerce.date(),
  attendeeName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  attendeeEmail: z.string().email("Invalid email address"),
  attendeeMessage: z.string().max(1000, "Message must be at most 1000 characters").optional(),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

export const CancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
});

export type CancelAppointmentInput = z.infer<typeof CancelAppointmentSchema>;

// ============================================================================
// Response Schemas (for API responses)
// ============================================================================

export const EventTypeResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.number(),
  bufferBeforeMinutes: z.number(),
  bufferAfterMinutes: z.number(),
  minNoticeHours: z.number(),
  maxAdvanceDays: z.number(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EventTypeResponse = z.infer<typeof EventTypeResponseSchema>;

export const AvailabilityWindowResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  dayOfWeek: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AvailabilityWindowResponse = z.infer<typeof AvailabilityWindowResponseSchema>;

export const AppointmentResponseSchema = z.object({
  id: z.string().uuid(),
  eventTypeId: z.string().uuid(),
  userId: z.string().uuid(),
  startTime: z.date(),
  endTime: z.date(),
  attendeeName: z.string(),
  attendeeEmail: z.string(),
  attendeeMessage: z.string().nullable(),
  status: z.string(),
  cancelledAt: z.date().nullable(),
  reminderSentAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;
