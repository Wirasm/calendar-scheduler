import { getLogger } from "@/core/logging";

import {
  AppointmentInsufficientNoticeError,
  AppointmentOutsideAvailabilityError,
  AppointmentSlotUnavailableError,
  AppointmentTooFarAdvanceError,
  AvailabilityWindowNotFoundError,
  AvailabilityWindowOverlapError,
  EventTypeNotFoundError,
  NoAvailabilityConfiguredError,
  SchedulingAccessDeniedError,
} from "./errors";
import type { Appointment, AvailabilityWindow, EventType } from "./models";
import * as repository from "./repository";
import type {
  CreateAvailabilityWindowInput,
  GetAvailableSlotsInput,
  TimeSlot,
  UpdateAvailabilityWindowInput,
} from "./schemas";

const logger = getLogger("scheduling.service");

// ============================================================================
// Helper Functions
// ============================================================================

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
 * Parse HH:MM time string to minutes since midnight.
 * Throws if the time format is invalid (indicates data corruption).
 */
function parseTimeToMinutes(time: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  const hoursStr = match?.[1];
  const minutesStr = match?.[2];
  if (!hoursStr || !minutesStr) {
    throw new Error(
      `Invalid time format in availability window: "${time}". Expected HH:MM format.`,
    );
  }
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap.
 * Range A: [aStart, aEnd)
 * Range B: [bStart, bEnd)
 */
function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Generate all possible slots for a single day based on availability window.
 */
function generateSlotsForDay(
  date: Date,
  window: AvailabilityWindow,
  durationMinutes: number,
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startMinutes = parseTimeToMinutes(window.startTime);
  const endMinutes = parseTimeToMinutes(window.endTime);

  let currentMinutes = startMinutes;
  while (currentMinutes + durationMinutes <= endMinutes) {
    const startTime = new Date(date);
    startTime.setUTCHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);

    const endTime = new Date(startTime);
    endTime.setUTCMinutes(endTime.getUTCMinutes() + durationMinutes);

    slots.push({ startTime, endTime });
    currentMinutes += durationMinutes; // Non-overlapping slots
  }

  return slots;
}

/**
 * Check if a slot conflicts with any appointment (including buffers).
 */
function slotConflictsWithAppointments(
  slot: TimeSlot,
  existingAppointments: Appointment[],
  bufferBefore: number,
  bufferAfter: number,
): boolean {
  for (const apt of existingAppointments) {
    // Expand appointment time by buffers
    const aptStartWithBuffer = new Date(apt.startTime);
    aptStartWithBuffer.setUTCMinutes(aptStartWithBuffer.getUTCMinutes() - bufferBefore);

    const aptEndWithBuffer = new Date(apt.endTime);
    aptEndWithBuffer.setUTCMinutes(aptEndWithBuffer.getUTCMinutes() + bufferAfter);

    if (rangesOverlap(slot.startTime, slot.endTime, aptStartWithBuffer, aptEndWithBuffer)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a slot falls within any availability window for its day.
 */
function slotWithinAvailability(slot: TimeSlot, windows: AvailabilityWindow[]): boolean {
  const dayOfWeek = slot.startTime.getUTCDay();
  const slotStartMinutes = slot.startTime.getUTCHours() * 60 + slot.startTime.getUTCMinutes();
  const slotEndMinutes = slot.endTime.getUTCHours() * 60 + slot.endTime.getUTCMinutes();

  for (const window of windows) {
    if (window.dayOfWeek !== dayOfWeek) {
      continue;
    }
    const windowStart = parseTimeToMinutes(window.startTime);
    const windowEnd = parseTimeToMinutes(window.endTime);

    if (slotStartMinutes >= windowStart && slotEndMinutes <= windowEnd) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// Availability Window Service
// ============================================================================

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

// ============================================================================
// Slot Generation Service
// ============================================================================

/**
 * Get available time slots for an event type within a date range.
 */
export async function getAvailableSlots(input: GetAvailableSlotsInput): Promise<TimeSlot[]> {
  logger.info(
    { eventTypeId: input.eventTypeId, startDate: input.startDate, endDate: input.endDate },
    "slots.get_started",
  );

  // 1. Get event type
  const eventType = await repository.findEventTypeById(input.eventTypeId);
  if (!eventType) {
    logger.warn({ eventTypeId: input.eventTypeId }, "slots.event_type_not_found");
    throw new EventTypeNotFoundError(input.eventTypeId);
  }

  // 2. Enforce constraints
  const now = new Date();
  const minBookingTime = new Date(now);
  minBookingTime.setUTCHours(minBookingTime.getUTCHours() + eventType.minNoticeHours);

  const maxBookingTime = new Date(now);
  maxBookingTime.setUTCDate(maxBookingTime.getUTCDate() + eventType.maxAdvanceDays);

  // Adjust date range to respect constraints
  const effectiveStart = input.startDate < minBookingTime ? minBookingTime : input.startDate;
  const effectiveEnd = input.endDate > maxBookingTime ? maxBookingTime : input.endDate;

  if (effectiveStart >= effectiveEnd) {
    logger.info({ eventTypeId: input.eventTypeId }, "slots.no_valid_range");
    return [];
  }

  // 3. Get availability windows
  const windows = await repository.findAvailabilityWindowsByUser(eventType.userId);
  if (windows.length === 0) {
    logger.warn({ userId: eventType.userId }, "slots.no_availability_configured");
    throw new NoAvailabilityConfiguredError(eventType.userId);
  }

  // 4. Get existing appointments in the range
  const existingAppointments = await repository.findAppointmentsByUserAndDateRange(
    eventType.userId,
    effectiveStart,
    effectiveEnd,
    true, // exclude cancelled
  );

  // 5. Generate slots for each day in range
  const allSlots: TimeSlot[] = [];
  const currentDate = new Date(effectiveStart);
  currentDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(effectiveEnd);
  endDate.setUTCHours(23, 59, 59, 999);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getUTCDay();

    // Find availability windows for this day
    const dayWindows = windows.filter((w) => w.dayOfWeek === dayOfWeek);

    for (const window of dayWindows) {
      const daySlots = generateSlotsForDay(currentDate, window, eventType.durationMinutes);
      allSlots.push(...daySlots);
    }

    // Move to next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  // 6. Filter out conflicting slots and past slots
  const availableSlots = allSlots.filter((slot) => {
    // Must be after minimum notice time
    if (slot.startTime < minBookingTime) {
      return false;
    }

    // Must not conflict with existing appointments
    if (
      slotConflictsWithAppointments(
        slot,
        existingAppointments,
        eventType.bufferBeforeMinutes,
        eventType.bufferAfterMinutes,
      )
    ) {
      return false;
    }

    return true;
  });

  // 7. Sort by start time
  availableSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  logger.info(
    {
      eventTypeId: input.eventTypeId,
      totalSlots: allSlots.length,
      availableSlots: availableSlots.length,
    },
    "slots.get_completed",
  );

  return availableSlots;
}

/**
 * Validate that a specific slot is still available for booking.
 * Used when actually creating an appointment to prevent race conditions.
 */
export async function validateSlotAvailable(
  eventTypeId: string,
  startTime: Date,
): Promise<{ eventType: EventType; endTime: Date }> {
  logger.info({ eventTypeId, startTime }, "slot.validate_started");

  const eventType = await repository.findEventTypeById(eventTypeId);
  if (!eventType) {
    throw new EventTypeNotFoundError(eventTypeId);
  }

  const endTime = new Date(startTime);
  endTime.setUTCMinutes(endTime.getUTCMinutes() + eventType.durationMinutes);

  // Check constraints
  const now = new Date();
  const minBookingTime = new Date(now);
  minBookingTime.setUTCHours(minBookingTime.getUTCHours() + eventType.minNoticeHours);

  if (startTime < minBookingTime) {
    logger.warn(
      { eventTypeId, startTime, minBookingTime, minNoticeHours: eventType.minNoticeHours },
      "slot.insufficient_notice",
    );
    throw new AppointmentInsufficientNoticeError(eventType.minNoticeHours);
  }

  const maxBookingTime = new Date(now);
  maxBookingTime.setUTCDate(maxBookingTime.getUTCDate() + eventType.maxAdvanceDays);

  if (startTime > maxBookingTime) {
    logger.warn(
      { eventTypeId, startTime, maxBookingTime, maxAdvanceDays: eventType.maxAdvanceDays },
      "slot.too_far_advance",
    );
    throw new AppointmentTooFarAdvanceError(eventType.maxAdvanceDays);
  }

  // Check if slot is within availability windows
  const windows = await repository.findAvailabilityWindowsByUser(eventType.userId);
  if (!slotWithinAvailability({ startTime, endTime }, windows)) {
    logger.warn({ eventTypeId, startTime }, "slot.outside_availability");
    throw new AppointmentOutsideAvailabilityError(startTime);
  }

  // Check for conflicts
  const conflictingAppointments = await repository.findAppointmentsByUserAndDateRange(
    eventType.userId,
    startTime,
    endTime,
    true,
  );

  // Check if any appointment overlaps (with buffers)
  const expandedStart = new Date(startTime);
  expandedStart.setUTCMinutes(expandedStart.getUTCMinutes() - eventType.bufferBeforeMinutes);

  const expandedEnd = new Date(endTime);
  expandedEnd.setUTCMinutes(expandedEnd.getUTCMinutes() + eventType.bufferAfterMinutes);

  for (const apt of conflictingAppointments) {
    if (rangesOverlap(expandedStart, expandedEnd, apt.startTime, apt.endTime)) {
      logger.warn(
        { eventTypeId, startTime, conflictingAppointmentId: apt.id },
        "slot.conflict_with_appointment",
      );
      throw new AppointmentSlotUnavailableError(startTime);
    }
  }

  logger.info({ eventTypeId, startTime }, "slot.validate_completed");
  return { eventType, endTime };
}
