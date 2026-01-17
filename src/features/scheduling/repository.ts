import type { InferSelectModel } from "drizzle-orm";
import { and, eq, gte, lte, ne } from "drizzle-orm";
import { db } from "@/core/database/client";
import { users } from "@/core/database/schema";

import { SchedulingDatabaseError } from "./errors";
import type {
  Appointment,
  AvailabilityWindow,
  EventType,
  NewAppointment,
  NewAvailabilityWindow,
} from "./models";
import { appointments, availabilityWindows, eventTypes } from "./models";

export type User = InferSelectModel<typeof users>;

// ============================================================================
// Availability Window Repository
// ============================================================================

export async function findById(id: string): Promise<AvailabilityWindow | undefined> {
  const results = await db
    .select()
    .from(availabilityWindows)
    .where(eq(availabilityWindows.id, id))
    .limit(1);
  return results[0];
}

export async function findByUserId(userId: string): Promise<AvailabilityWindow[]> {
  return db.select().from(availabilityWindows).where(eq(availabilityWindows.userId, userId));
}

export async function findByUserIdAndDay(
  userId: string,
  dayOfWeek: number,
): Promise<AvailabilityWindow[]> {
  return db
    .select()
    .from(availabilityWindows)
    .where(
      and(eq(availabilityWindows.userId, userId), eq(availabilityWindows.dayOfWeek, dayOfWeek)),
    );
}

export async function create(data: NewAvailabilityWindow): Promise<AvailabilityWindow> {
  const results = await db.insert(availabilityWindows).values(data).returning();
  const window = results[0];
  if (!window) {
    throw new SchedulingDatabaseError("create availability window");
  }
  return window;
}

export async function update(
  id: string,
  data: Partial<Pick<AvailabilityWindow, "dayOfWeek" | "startTime" | "endTime">>,
): Promise<AvailabilityWindow | undefined> {
  const results = await db
    .update(availabilityWindows)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(availabilityWindows.id, id))
    .returning();
  return results[0];
}

export async function deleteById(id: string): Promise<boolean> {
  const results = await db
    .delete(availabilityWindows)
    .where(eq(availabilityWindows.id, id))
    .returning();
  return results.length > 0;
}

// ============================================================================
// Event Type Repository
// ============================================================================

export async function findEventTypeById(id: string): Promise<EventType | undefined> {
  const results = await db.select().from(eventTypes).where(eq(eventTypes.id, id)).limit(1);
  return results[0];
}

export async function findEventTypeBySlugAndUser(
  slug: string,
  userId: string,
): Promise<EventType | undefined> {
  const results = await db
    .select()
    .from(eventTypes)
    .where(and(eq(eventTypes.slug, slug), eq(eventTypes.userId, userId)))
    .limit(1);
  return results[0];
}

export async function findActiveEventTypesByUser(userId: string): Promise<EventType[]> {
  return db
    .select()
    .from(eventTypes)
    .where(and(eq(eventTypes.userId, userId), eq(eventTypes.isActive, true)));
}

// ============================================================================
// Availability Window Repository (for slot generation)
// ============================================================================

export async function findAvailabilityWindowsByUser(userId: string): Promise<AvailabilityWindow[]> {
  return db.select().from(availabilityWindows).where(eq(availabilityWindows.userId, userId));
}

// ============================================================================
// Appointment Repository
// ============================================================================

export async function findAppointmentsByUserAndDateRange(
  userId: string,
  startDate: Date,
  endDate: Date,
  excludeCancelled?: boolean,
): Promise<Appointment[]> {
  // Query for appointments that overlap with the date range
  // An appointment overlaps if: appointmentStart < rangeEnd AND appointmentEnd > rangeStart
  const conditions = [
    eq(appointments.userId, userId),
    lte(appointments.startTime, endDate),
    gte(appointments.endTime, startDate),
  ];

  if (excludeCancelled) {
    conditions.push(ne(appointments.status, "cancelled"));
  }

  return db
    .select()
    .from(appointments)
    .where(and(...conditions));
}

export async function createAppointment(data: NewAppointment): Promise<Appointment> {
  const results = await db.insert(appointments).values(data).returning();
  const appointment = results[0];
  if (!appointment) {
    throw new SchedulingDatabaseError("create appointment");
  }
  return appointment;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return results[0];
}
