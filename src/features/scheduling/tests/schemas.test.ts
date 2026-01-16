import { describe, expect, it } from "bun:test";

import {
  CancelAppointmentSchema,
  CreateAppointmentSchema,
  CreateAvailabilityWindowSchema,
  CreateEventTypeSchema,
  UpdateAvailabilityWindowSchema,
  UpdateEventTypeSchema,
} from "../schemas";

describe("CreateEventTypeSchema", () => {
  it("validates valid input", () => {
    const result = CreateEventTypeSchema.parse({
      name: "30 Minute Consultation",
      description: "A quick intro call",
      durationMinutes: 30,
    });
    expect(result.name).toBe("30 Minute Consultation");
    expect(result.durationMinutes).toBe(30);
  });

  it("uses default values", () => {
    const result = CreateEventTypeSchema.parse({
      name: "Quick Call",
    });
    expect(result.durationMinutes).toBe(30);
    expect(result.bufferBeforeMinutes).toBe(0);
    expect(result.bufferAfterMinutes).toBe(15);
    expect(result.minNoticeHours).toBe(24);
    expect(result.maxAdvanceDays).toBe(14);
    expect(result.isActive).toBe(true);
  });

  it("rejects name shorter than 3 characters", () => {
    expect(() => CreateEventTypeSchema.parse({ name: "ab" })).toThrow();
  });

  it("rejects duration less than 5 minutes", () => {
    expect(() => CreateEventTypeSchema.parse({ name: "Too Short", durationMinutes: 3 })).toThrow();
  });

  it("rejects duration more than 480 minutes", () => {
    expect(() => CreateEventTypeSchema.parse({ name: "Too Long", durationMinutes: 500 })).toThrow();
  });

  it("rejects name longer than 100 characters", () => {
    expect(() => CreateEventTypeSchema.parse({ name: "a".repeat(101) })).toThrow();
  });

  it("accepts name at max length (100 characters)", () => {
    const result = CreateEventTypeSchema.parse({ name: "a".repeat(100) });
    expect(result.name.length).toBe(100);
  });

  it("rejects description longer than 500 characters", () => {
    expect(() =>
      CreateEventTypeSchema.parse({ name: "Valid Name", description: "a".repeat(501) }),
    ).toThrow();
  });

  it("rejects maxAdvanceDays less than 1", () => {
    expect(() => CreateEventTypeSchema.parse({ name: "Valid", maxAdvanceDays: 0 })).toThrow();
  });

  it("rejects maxAdvanceDays more than 90", () => {
    expect(() => CreateEventTypeSchema.parse({ name: "Valid", maxAdvanceDays: 91 })).toThrow();
  });

  it("accepts maxAdvanceDays at bounds (1 and 90)", () => {
    const result1 = CreateEventTypeSchema.parse({ name: "Valid", maxAdvanceDays: 1 });
    expect(result1.maxAdvanceDays).toBe(1);
    const result90 = CreateEventTypeSchema.parse({ name: "Valid", maxAdvanceDays: 90 });
    expect(result90.maxAdvanceDays).toBe(90);
  });

  it("rejects minNoticeHours more than 168", () => {
    expect(() => CreateEventTypeSchema.parse({ name: "Valid", minNoticeHours: 169 })).toThrow();
  });

  it("rejects bufferBeforeMinutes more than 60", () => {
    expect(() => CreateEventTypeSchema.parse({ name: "Valid", bufferBeforeMinutes: 61 })).toThrow();
  });

  it("rejects bufferAfterMinutes more than 60", () => {
    expect(() => CreateEventTypeSchema.parse({ name: "Valid", bufferAfterMinutes: 61 })).toThrow();
  });
});

describe("UpdateEventTypeSchema", () => {
  it("validates partial updates", () => {
    const result = UpdateEventTypeSchema.parse({
      name: "Updated Name",
    });
    expect(result.name).toBe("Updated Name");
    expect(result.durationMinutes).toBeUndefined();
  });

  it("validates empty object", () => {
    const result = UpdateEventTypeSchema.parse({});
    expect(result).toEqual({});
  });
});

describe("CreateAvailabilityWindowSchema", () => {
  it("validates valid input", () => {
    const result = CreateAvailabilityWindowSchema.parse({
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.dayOfWeek).toBe(1);
    expect(result.startTime).toBe("09:00");
    expect(result.endTime).toBe("17:00");
  });

  it("rejects invalid day of week", () => {
    expect(() =>
      CreateAvailabilityWindowSchema.parse({
        dayOfWeek: 7, // Invalid
        startTime: "09:00",
        endTime: "17:00",
      }),
    ).toThrow();
  });

  it("rejects invalid time format", () => {
    expect(() =>
      CreateAvailabilityWindowSchema.parse({
        dayOfWeek: 1,
        startTime: "9:00", // Missing leading zero
        endTime: "17:00",
      }),
    ).toThrow();
  });

  it("rejects invalid time values", () => {
    expect(() =>
      CreateAvailabilityWindowSchema.parse({
        dayOfWeek: 1,
        startTime: "25:00", // Invalid hour
        endTime: "17:00",
      }),
    ).toThrow();
  });

  it("rejects startTime >= endTime", () => {
    expect(() =>
      CreateAvailabilityWindowSchema.parse({
        dayOfWeek: 1,
        startTime: "17:00",
        endTime: "09:00",
      }),
    ).toThrow();
  });

  it("rejects startTime equal to endTime", () => {
    expect(() =>
      CreateAvailabilityWindowSchema.parse({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "09:00",
      }),
    ).toThrow();
  });
});

describe("UpdateAvailabilityWindowSchema", () => {
  it("validates partial updates", () => {
    const result = UpdateAvailabilityWindowSchema.parse({ startTime: "10:00" });
    expect(result.startTime).toBe("10:00");
    expect(result.dayOfWeek).toBeUndefined();
  });

  it("validates empty object", () => {
    const result = UpdateAvailabilityWindowSchema.parse({});
    expect(result).toEqual({});
  });

  it("rejects invalid time format in updates", () => {
    expect(() => UpdateAvailabilityWindowSchema.parse({ startTime: "9:00" })).toThrow();
  });

  it("rejects invalid day of week in updates", () => {
    expect(() => UpdateAvailabilityWindowSchema.parse({ dayOfWeek: 7 })).toThrow();
  });

  it("rejects startTime >= endTime when both provided", () => {
    expect(() =>
      UpdateAvailabilityWindowSchema.parse({
        startTime: "17:00",
        endTime: "09:00",
      }),
    ).toThrow();
  });

  it("allows startTime without endTime", () => {
    const result = UpdateAvailabilityWindowSchema.parse({ startTime: "10:00" });
    expect(result.startTime).toBe("10:00");
  });

  it("allows endTime without startTime", () => {
    const result = UpdateAvailabilityWindowSchema.parse({ endTime: "17:00" });
    expect(result.endTime).toBe("17:00");
  });
});

describe("CreateAppointmentSchema", () => {
  it("validates valid input", () => {
    const result = CreateAppointmentSchema.parse({
      eventTypeId: "550e8400-e29b-41d4-a716-446655440000",
      startTime: "2026-01-20T10:00:00Z",
      attendeeName: "John Doe",
      attendeeEmail: "john@example.com",
      attendeeMessage: "Looking forward to our call!",
    });
    expect(result.attendeeName).toBe("John Doe");
    expect(result.attendeeEmail).toBe("john@example.com");
    expect(result.startTime).toBeInstanceOf(Date);
  });

  it("coerces date string to Date object", () => {
    const result = CreateAppointmentSchema.parse({
      eventTypeId: "550e8400-e29b-41d4-a716-446655440000",
      startTime: "2026-01-20T10:00:00Z",
      attendeeName: "Jane Doe",
      attendeeEmail: "jane@example.com",
    });
    expect(result.startTime).toBeInstanceOf(Date);
  });

  it("rejects invalid email", () => {
    expect(() =>
      CreateAppointmentSchema.parse({
        eventTypeId: "550e8400-e29b-41d4-a716-446655440000",
        startTime: "2026-01-20T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "not-an-email",
      }),
    ).toThrow();
  });

  it("rejects invalid UUID", () => {
    expect(() =>
      CreateAppointmentSchema.parse({
        eventTypeId: "not-a-uuid",
        startTime: "2026-01-20T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
      }),
    ).toThrow();
  });

  it("rejects name shorter than 2 characters", () => {
    expect(() =>
      CreateAppointmentSchema.parse({
        eventTypeId: "550e8400-e29b-41d4-a716-446655440000",
        startTime: "2026-01-20T10:00:00Z",
        attendeeName: "J",
        attendeeEmail: "j@example.com",
      }),
    ).toThrow();
  });

  it("rejects attendeeName longer than 100 characters", () => {
    expect(() =>
      CreateAppointmentSchema.parse({
        eventTypeId: "550e8400-e29b-41d4-a716-446655440000",
        startTime: "2026-01-20T10:00:00Z",
        attendeeName: "a".repeat(101),
        attendeeEmail: "john@example.com",
      }),
    ).toThrow();
  });

  it("rejects attendeeMessage longer than 1000 characters", () => {
    expect(() =>
      CreateAppointmentSchema.parse({
        eventTypeId: "550e8400-e29b-41d4-a716-446655440000",
        startTime: "2026-01-20T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
        attendeeMessage: "x".repeat(1001),
      }),
    ).toThrow();
  });
});

describe("CancelAppointmentSchema", () => {
  it("validates valid UUID", () => {
    const result = CancelAppointmentSchema.parse({
      appointmentId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.appointmentId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejects invalid UUID", () => {
    expect(() => CancelAppointmentSchema.parse({ appointmentId: "not-a-uuid" })).toThrow();
  });

  it("rejects missing appointmentId", () => {
    expect(() => CancelAppointmentSchema.parse({})).toThrow();
  });
});
