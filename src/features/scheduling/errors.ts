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

// Event Type Errors
export class EventTypeNotFoundError extends SchedulingError {
  constructor(identifier: string) {
    super(`Event type not found: ${identifier}`, "EVENT_TYPE_NOT_FOUND", 404);
  }
}

export class EventTypeSlugExistsError extends SchedulingError {
  constructor(slug: string) {
    super(`Event type slug already exists: ${slug}`, "EVENT_TYPE_SLUG_EXISTS", 409);
  }
}

// Availability Window Errors
export class AvailabilityWindowNotFoundError extends SchedulingError {
  constructor(identifier: string) {
    super(`Availability window not found: ${identifier}`, "AVAILABILITY_WINDOW_NOT_FOUND", 404);
  }
}

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

// Appointment Errors
export class AppointmentNotFoundError extends SchedulingError {
  constructor(identifier: string) {
    super(`Appointment not found: ${identifier}`, "APPOINTMENT_NOT_FOUND", 404);
  }
}

export class AppointmentSlotUnavailableError extends SchedulingError {
  constructor(startTime: Date) {
    super(
      `Time slot is no longer available: ${startTime.toISOString()}`,
      "APPOINTMENT_SLOT_UNAVAILABLE",
      409,
    );
  }
}

export class AppointmentOutsideAvailabilityError extends SchedulingError {
  constructor() {
    super("Requested time is outside available hours", "APPOINTMENT_OUTSIDE_AVAILABILITY", 400);
  }
}

export class AppointmentInsufficientNoticeError extends SchedulingError {
  constructor(minNoticeHours: number) {
    super(
      `Appointments require at least ${minNoticeHours} hours notice`,
      "APPOINTMENT_INSUFFICIENT_NOTICE",
      400,
    );
  }
}

export class AppointmentTooFarAdvanceError extends SchedulingError {
  constructor(maxAdvanceDays: number) {
    super(
      `Appointments can only be booked up to ${maxAdvanceDays} days in advance`,
      "APPOINTMENT_TOO_FAR_ADVANCE",
      400,
    );
  }
}

// Access Error
export class SchedulingAccessDeniedError extends SchedulingError {
  constructor(resource: string) {
    super(`Access denied to scheduling resource: ${resource}`, "SCHEDULING_ACCESS_DENIED", 403);
  }
}
