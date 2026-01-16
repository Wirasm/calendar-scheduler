import { describe, expect, it } from "bun:test";

import {
  CreateAppointmentSchema,
  CreateAvailabilityWindowSchema,
  CreateEventTypeSchema,
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
});
