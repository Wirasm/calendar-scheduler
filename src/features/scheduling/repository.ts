import { and, eq } from "drizzle-orm";

import { db } from "@/core/database/client";

import { SchedulingDatabaseError } from "./errors";
import type { AvailabilityWindow, NewAvailabilityWindow } from "./models";
import { availabilityWindows } from "./models";

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
