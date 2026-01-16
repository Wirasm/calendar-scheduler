import { describe, expect, it } from "bun:test";

import { BookingConfirmationEmailSchema } from "../schemas";

const validData = {
  appointmentId: "550e8400-e29b-41d4-a716-446655440000",
  eventTypeName: "30 Minute Consultation",
  startTime: new Date("2026-01-20T10:00:00Z"),
  endTime: new Date("2026-01-20T10:30:00Z"),
  attendeeName: "John Doe",
  attendeeEmail: "john@example.com",
  attendeeMessage: "Looking forward to our meeting!",
  consultantName: "Jane Smith",
  consultantEmail: "jane@consultant.com",
};

describe("BookingConfirmationEmailSchema", () => {
  it("accepts valid data", () => {
    const result = BookingConfirmationEmailSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts null attendeeMessage", () => {
    const data = { ...validData, attendeeMessage: null };
    const result = BookingConfirmationEmailSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects invalid appointmentId (not a UUID)", () => {
    const data = { ...validData, appointmentId: "not-a-uuid" };
    const result = BookingConfirmationEmailSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid attendeeEmail", () => {
    const data = { ...validData, attendeeEmail: "not-an-email" };
    const result = BookingConfirmationEmailSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid consultantEmail", () => {
    const data = { ...validData, consultantEmail: "invalid" };
    const result = BookingConfirmationEmailSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty eventTypeName", () => {
    const data = { ...validData, eventTypeName: "" };
    const result = BookingConfirmationEmailSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty attendeeName", () => {
    const data = { ...validData, attendeeName: "" };
    const result = BookingConfirmationEmailSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty consultantName", () => {
    const data = { ...validData, consultantName: "" };
    const result = BookingConfirmationEmailSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when endTime is before startTime", () => {
    const data = {
      ...validData,
      startTime: new Date("2026-01-20T11:00:00Z"),
      endTime: new Date("2026-01-20T10:00:00Z"),
    };
    const result = BookingConfirmationEmailSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Start time must be before end time");
    }
  });

  it("rejects when startTime equals endTime", () => {
    const sameTime = new Date("2026-01-20T10:00:00Z");
    const data = {
      ...validData,
      startTime: sameTime,
      endTime: sameTime,
    };
    const result = BookingConfirmationEmailSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
