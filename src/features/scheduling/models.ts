import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { appointments, availabilityWindows, eventTypes } from "@/core/database/schema";

export { appointments, availabilityWindows, eventTypes };

export type EventType = InferSelectModel<typeof eventTypes>;
export type NewEventType = InferInsertModel<typeof eventTypes>;

export type AvailabilityWindow = InferSelectModel<typeof availabilityWindows>;
export type NewAvailabilityWindow = InferInsertModel<typeof availabilityWindows>;

export type Appointment = InferSelectModel<typeof appointments>;
export type NewAppointment = InferInsertModel<typeof appointments>;
