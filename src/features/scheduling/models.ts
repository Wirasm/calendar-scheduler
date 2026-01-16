import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { appointments, availabilityWindows, eventTypes } from "@/core/database/schema";

// Re-export tables for use in repository
export { appointments, availabilityWindows, eventTypes };

// Event Types
export type EventType = InferSelectModel<typeof eventTypes>;
export type NewEventType = InferInsertModel<typeof eventTypes>;

// Availability Windows
export type AvailabilityWindow = InferSelectModel<typeof availabilityWindows>;
export type NewAvailabilityWindow = InferInsertModel<typeof availabilityWindows>;

// Appointments
export type Appointment = InferSelectModel<typeof appointments>;
export type NewAppointment = InferInsertModel<typeof appointments>;
