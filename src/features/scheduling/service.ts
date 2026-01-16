import { getLogger } from "@/core/logging";

import {
  AvailabilityWindowNotFoundError,
  AvailabilityWindowOverlapError,
  SchedulingAccessDeniedError,
} from "./errors";
import type { AvailabilityWindow } from "./models";
import * as repository from "./repository";
import type { CreateAvailabilityWindowInput, UpdateAvailabilityWindowInput } from "./schemas";

const logger = getLogger("scheduling.service");

/**
 * Check if a new window overlaps with any existing windows.
 * Overlap exists if: new.start < existing.end AND new.end > existing.start
 */
function checkOverlap(
  existing: AvailabilityWindow[],
  newWindow: { startTime: string; endTime: string },
  excludeId?: string,
): boolean {
  for (const window of existing) {
    if (excludeId && window.id === excludeId) {
      continue;
    }
    if (newWindow.startTime < window.endTime && newWindow.endTime > window.startTime) {
      return true;
    }
  }
  return false;
}

/**
 * Create a new availability window.
 */
export async function createAvailabilityWindow(
  input: CreateAvailabilityWindowInput,
  userId: string,
): Promise<AvailabilityWindow> {
  logger.info({ userId, dayOfWeek: input.dayOfWeek }, "availability_window.create_started");

  // Check for overlapping windows on the same day
  const existingWindows = await repository.findByUserIdAndDay(userId, input.dayOfWeek);
  if (checkOverlap(existingWindows, input)) {
    logger.warn({ userId, dayOfWeek: input.dayOfWeek }, "availability_window.create_overlap");
    throw new AvailabilityWindowOverlapError(input.dayOfWeek);
  }

  const window = await repository.create({
    userId,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
  });

  logger.info({ windowId: window.id }, "availability_window.create_completed");
  return window;
}

/**
 * Get all availability windows for a user.
 */
export async function getAvailabilityWindowsByUser(userId: string): Promise<AvailabilityWindow[]> {
  logger.info({ userId }, "availability_window.list_started");

  const windows = await repository.findByUserId(userId);

  logger.info({ userId, count: windows.length }, "availability_window.list_completed");
  return windows;
}

/**
 * Get a single availability window by ID.
 * Checks access: only the owner can view.
 */
export async function getAvailabilityWindow(
  id: string,
  userId: string,
): Promise<AvailabilityWindow> {
  logger.info({ windowId: id, userId }, "availability_window.get_started");

  const window = await repository.findById(id);

  if (!window) {
    logger.warn({ windowId: id }, "availability_window.get_not_found");
    throw new AvailabilityWindowNotFoundError(id);
  }

  if (window.userId !== userId) {
    logger.warn({ windowId: id, userId }, "availability_window.access_denied");
    throw new SchedulingAccessDeniedError(`availability_window:${id}`);
  }

  logger.info({ windowId: id }, "availability_window.get_completed");
  return window;
}

/**
 * Update an availability window.
 * Only the owner can update. Checks for overlaps if day/time changed.
 */
export async function updateAvailabilityWindow(
  id: string,
  input: UpdateAvailabilityWindowInput,
  userId: string,
): Promise<AvailabilityWindow> {
  logger.info({ windowId: id, userId }, "availability_window.update_started");

  const existing = await repository.findById(id);

  if (!existing) {
    logger.warn({ windowId: id }, "availability_window.update_not_found");
    throw new AvailabilityWindowNotFoundError(id);
  }

  if (existing.userId !== userId) {
    logger.warn({ windowId: id, userId }, "availability_window.access_denied");
    throw new SchedulingAccessDeniedError(`availability_window:${id}`);
  }

  // Build update data and check for overlaps
  const dayOfWeek = input.dayOfWeek ?? existing.dayOfWeek;
  const startTime = input.startTime ?? existing.startTime;
  const endTime = input.endTime ?? existing.endTime;

  // Check for overlaps on the target day
  const existingWindows = await repository.findByUserIdAndDay(userId, dayOfWeek);
  if (checkOverlap(existingWindows, { startTime, endTime }, id)) {
    logger.warn({ windowId: id, dayOfWeek }, "availability_window.update_overlap");
    throw new AvailabilityWindowOverlapError(dayOfWeek);
  }

  // Build update object, only including defined properties
  const updateData: Partial<Pick<AvailabilityWindow, "dayOfWeek" | "startTime" | "endTime">> = {};
  if (input.dayOfWeek !== undefined) {
    updateData.dayOfWeek = input.dayOfWeek;
  }
  if (input.startTime !== undefined) {
    updateData.startTime = input.startTime;
  }
  if (input.endTime !== undefined) {
    updateData.endTime = input.endTime;
  }

  const updated = await repository.update(id, updateData);

  if (!updated) {
    logger.error({ windowId: id }, "availability_window.update_failed");
    throw new AvailabilityWindowNotFoundError(id);
  }

  logger.info({ windowId: id }, "availability_window.update_completed");
  return updated;
}

/**
 * Delete an availability window.
 * Only the owner can delete.
 */
export async function deleteAvailabilityWindow(id: string, userId: string): Promise<void> {
  logger.info({ windowId: id, userId }, "availability_window.delete_started");

  const existing = await repository.findById(id);

  if (!existing) {
    logger.warn({ windowId: id }, "availability_window.delete_not_found");
    throw new AvailabilityWindowNotFoundError(id);
  }

  if (existing.userId !== userId) {
    logger.warn({ windowId: id, userId }, "availability_window.access_denied");
    throw new SchedulingAccessDeniedError(`availability_window:${id}`);
  }

  const deleted = await repository.deleteById(id);
  if (!deleted) {
    logger.error({ windowId: id }, "availability_window.delete_failed");
    throw new AvailabilityWindowNotFoundError(id);
  }

  logger.info({ windowId: id }, "availability_window.delete_completed");
}
