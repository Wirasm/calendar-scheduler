import type { HttpStatusCode } from "@/core/api/errors";

/** Known error codes for scheduling operations. */
export type SchedulingErrorCode =
  | "EVENT_TYPE_NOT_FOUND"
  | "EVENT_TYPE_SLUG_EXISTS"
  | "AVAILABILITY_WINDOW_NOT_FOUND"
  | "AVAILABILITY_WINDOW_OVERLAP"
  | "APPOINTMENT_NOT_FOUND"
  | "APPOINTMENT_SLOT_UNAVAILABLE"
  | "APPOINTMENT_OUTSIDE_AVAILABILITY"
  | "APPOINTMENT_INSUFFICIENT_NOTICE"
  | "APPOINTMENT_TOO_FAR_ADVANCE"
  | "SCHEDULING_ACCESS_DENIED";

/**
 * Base error for scheduling-related errors.
 */
export class SchedulingError extends Error {
  readonly code: SchedulingErrorCode;
  readonly statusCode: HttpStatusCode;

  constructor(message: string, code: SchedulingErrorCode, statusCode: HttpStatusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

/** Thrown when an event type cannot be found by ID or slug. */
export class EventTypeNotFoundError extends SchedulingError {
  constructor(identifier: string) {
    super(`Event type not found: ${identifier}`, "EVENT_TYPE_NOT_FOUND", 404);
  }
}

/** Thrown when creating/updating an event type with a slug that already exists for the user. */
export class EventTypeSlugExistsError extends SchedulingError {
  constructor(slug: string) {
    super(`Event type slug already exists: ${slug}`, "EVENT_TYPE_SLUG_EXISTS", 409);
  }
}

/** Thrown when an availability window cannot be found by ID. */
export class AvailabilityWindowNotFoundError extends SchedulingError {
  constructor(identifier: string) {
    super(`Availability window not found: ${identifier}`, "AVAILABILITY_WINDOW_NOT_FOUND", 404);
  }
}

/** Thrown when creating an availability window that overlaps with an existing one on the same day. */
export class AvailabilityWindowOverlapError extends SchedulingError {
  constructor(dayOfWeek: number) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[dayOfWeek] ?? `Day ${dayOfWeek}`;
    super(
      `Availability window overlaps with existing window on ${dayName}`,
      "AVAILABILITY_WINDOW_OVERLAP",
      409,
    );
  }
}

/** Thrown when an appointment cannot be found by ID. */
export class AppointmentNotFoundError extends SchedulingError {
  constructor(identifier: string) {
    super(`Appointment not found: ${identifier}`, "APPOINTMENT_NOT_FOUND", 404);
  }
}

/** Thrown when the requested time slot conflicts with an existing appointment or buffer time. */
export class AppointmentSlotUnavailableError extends SchedulingError {
  constructor(startTime: Date) {
    super(
      `Time slot is no longer available: ${startTime.toISOString()}`,
      "APPOINTMENT_SLOT_UNAVAILABLE",
      409,
    );
  }
}

/** Thrown when the requested appointment time falls outside the consultant's availability windows. */
export class AppointmentOutsideAvailabilityError extends SchedulingError {
  constructor() {
    super("Requested time is outside available hours", "APPOINTMENT_OUTSIDE_AVAILABILITY", 400);
  }
}

/** Thrown when booking too close to the appointment time (violates minNoticeHours constraint). */
export class AppointmentInsufficientNoticeError extends SchedulingError {
  constructor(minNoticeHours: number) {
    super(
      `Appointments require at least ${minNoticeHours} hours notice`,
      "APPOINTMENT_INSUFFICIENT_NOTICE",
      400,
    );
  }
}

/** Thrown when booking too far in advance (violates maxAdvanceDays constraint). */
export class AppointmentTooFarAdvanceError extends SchedulingError {
  constructor(maxAdvanceDays: number) {
    super(
      `Appointments can only be booked up to ${maxAdvanceDays} days in advance`,
      "APPOINTMENT_TOO_FAR_ADVANCE",
      400,
    );
  }
}

/** Thrown when a user attempts to access or modify a scheduling resource they don't own. */
export class SchedulingAccessDeniedError extends SchedulingError {
  constructor(resource: string) {
    super(`Access denied to scheduling resource: ${resource}`, "SCHEDULING_ACCESS_DENIED", 403);
  }
}
