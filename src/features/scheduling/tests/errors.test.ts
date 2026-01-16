import { describe, expect, it } from "bun:test";

import {
  AppointmentInsufficientNoticeError,
  AppointmentNotFoundError,
  AppointmentOutsideAvailabilityError,
  AppointmentSlotUnavailableError,
  AppointmentTooFarAdvanceError,
  AvailabilityWindowNotFoundError,
  AvailabilityWindowOverlapError,
  EventTypeNotFoundError,
  EventTypeSlugExistsError,
  SchedulingAccessDeniedError,
  SchedulingError,
} from "../errors";

describe("SchedulingError", () => {
  it("creates error with message, code, and status", () => {
    const error = new SchedulingError("Test error", "EVENT_TYPE_NOT_FOUND", 404);
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("EVENT_TYPE_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("SchedulingError");
  });

  it("is instanceof Error", () => {
    const error = new SchedulingError("Test", "EVENT_TYPE_NOT_FOUND", 404);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("EventTypeNotFoundError", () => {
  it("creates error with identifier in message", () => {
    const error = new EventTypeNotFoundError("et-123");
    expect(error.message).toBe("Event type not found: et-123");
    expect(error.code).toBe("EVENT_TYPE_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("EventTypeNotFoundError");
  });

  it("is instanceof SchedulingError", () => {
    const error = new EventTypeNotFoundError("id");
    expect(error).toBeInstanceOf(SchedulingError);
  });
});

describe("EventTypeSlugExistsError", () => {
  it("creates error with slug in message", () => {
    const error = new EventTypeSlugExistsError("my-event");
    expect(error.message).toBe("Event type slug already exists: my-event");
    expect(error.code).toBe("EVENT_TYPE_SLUG_EXISTS");
    expect(error.statusCode).toBe(409);
  });
});

describe("AvailabilityWindowNotFoundError", () => {
  it("creates error with identifier in message", () => {
    const error = new AvailabilityWindowNotFoundError("aw-123");
    expect(error.message).toBe("Availability window not found: aw-123");
    expect(error.code).toBe("AVAILABILITY_WINDOW_NOT_FOUND");
    expect(error.statusCode).toBe(404);
  });
});

describe("AvailabilityWindowOverlapError", () => {
  it("creates error with day name in message", () => {
    const error = new AvailabilityWindowOverlapError(1);
    expect(error.message).toBe("Availability window overlaps with existing window on Monday");
    expect(error.code).toBe("AVAILABILITY_WINDOW_OVERLAP");
    expect(error.statusCode).toBe(409);
  });

  it("handles Sunday (day 0)", () => {
    const error = new AvailabilityWindowOverlapError(0);
    expect(error.message).toContain("Sunday");
  });

  it("handles Saturday (day 6)", () => {
    const error = new AvailabilityWindowOverlapError(6);
    expect(error.message).toContain("Saturday");
  });

  it("handles out-of-range day index gracefully (7)", () => {
    const error = new AvailabilityWindowOverlapError(7);
    expect(error.message).toContain("Day 7");
  });

  it("handles negative day index gracefully (-1)", () => {
    const error = new AvailabilityWindowOverlapError(-1);
    expect(error.message).toContain("Day -1");
  });
});

describe("AppointmentNotFoundError", () => {
  it("creates error with identifier in message", () => {
    const error = new AppointmentNotFoundError("apt-123");
    expect(error.message).toBe("Appointment not found: apt-123");
    expect(error.code).toBe("APPOINTMENT_NOT_FOUND");
    expect(error.statusCode).toBe(404);
  });
});

describe("AppointmentSlotUnavailableError", () => {
  it("creates error with time in message", () => {
    const startTime = new Date("2026-01-20T10:00:00Z");
    const error = new AppointmentSlotUnavailableError(startTime);
    expect(error.message).toContain("2026-01-20");
    expect(error.code).toBe("APPOINTMENT_SLOT_UNAVAILABLE");
    expect(error.statusCode).toBe(409);
  });
});

describe("AppointmentOutsideAvailabilityError", () => {
  it("creates error with correct message", () => {
    const error = new AppointmentOutsideAvailabilityError();
    expect(error.message).toBe("Requested time is outside available hours");
    expect(error.code).toBe("APPOINTMENT_OUTSIDE_AVAILABILITY");
    expect(error.statusCode).toBe(400);
  });
});

describe("AppointmentInsufficientNoticeError", () => {
  it("creates error with hours in message", () => {
    const error = new AppointmentInsufficientNoticeError(24);
    expect(error.message).toBe("Appointments require at least 24 hours notice");
    expect(error.code).toBe("APPOINTMENT_INSUFFICIENT_NOTICE");
    expect(error.statusCode).toBe(400);
  });
});

describe("AppointmentTooFarAdvanceError", () => {
  it("creates error with days in message", () => {
    const error = new AppointmentTooFarAdvanceError(14);
    expect(error.message).toBe("Appointments can only be booked up to 14 days in advance");
    expect(error.code).toBe("APPOINTMENT_TOO_FAR_ADVANCE");
    expect(error.statusCode).toBe(400);
  });
});

describe("SchedulingAccessDeniedError", () => {
  it("creates error with resource in message", () => {
    const error = new SchedulingAccessDeniedError("event-type-123");
    expect(error.message).toBe("Access denied to scheduling resource: event-type-123");
    expect(error.code).toBe("SCHEDULING_ACCESS_DENIED");
    expect(error.statusCode).toBe(403);
  });
});
