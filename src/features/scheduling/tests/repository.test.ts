import { describe, expect, it } from "bun:test";

// Import types to verify they match what the repository functions expect
import type { Appointment, AvailabilityWindow, EventType } from "../models";

// Import the repository to verify the exports exist
import * as repository from "../repository";

// These tests verify that the repository module exports the expected functions
// and that the type signatures are correct. The actual database behavior
// is tested through the service tests which mock the repository.

describe("repository exports", () => {
  it("exports findEventTypeById function", () => {
    expect(typeof repository.findEventTypeById).toBe("function");
  });

  it("exports findEventTypeBySlugAndUser function", () => {
    expect(typeof repository.findEventTypeBySlugAndUser).toBe("function");
  });

  it("exports findAvailabilityWindowsByUser function", () => {
    expect(typeof repository.findAvailabilityWindowsByUser).toBe("function");
  });

  it("exports findAppointmentsByUserAndDateRange function", () => {
    expect(typeof repository.findAppointmentsByUserAndDateRange).toBe("function");
  });

  it("exports findActiveEventTypesByUser function", () => {
    expect(typeof repository.findActiveEventTypesByUser).toBe("function");
  });
});

// Type tests - these compile-time checks ensure the repository functions
// have the correct return types
describe("repository type signatures", () => {
  it("findEventTypeById returns Promise<EventType | undefined>", () => {
    // Type assertion test - this will fail to compile if types are wrong
    const _typeCheck: (id: string) => Promise<EventType | undefined> = repository.findEventTypeById;
    expect(_typeCheck).toBeDefined();
  });

  it("findEventTypeBySlugAndUser returns Promise<EventType | undefined>", () => {
    const _typeCheck: (slug: string, userId: string) => Promise<EventType | undefined> =
      repository.findEventTypeBySlugAndUser;
    expect(_typeCheck).toBeDefined();
  });

  it("findAvailabilityWindowsByUser returns Promise<AvailabilityWindow[]>", () => {
    const _typeCheck: (userId: string) => Promise<AvailabilityWindow[]> =
      repository.findAvailabilityWindowsByUser;
    expect(_typeCheck).toBeDefined();
  });

  it("findAppointmentsByUserAndDateRange returns Promise<Appointment[]>", () => {
    const _typeCheck: (
      userId: string,
      startDate: Date,
      endDate: Date,
      excludeCancelled?: boolean,
    ) => Promise<Appointment[]> = repository.findAppointmentsByUserAndDateRange;
    expect(_typeCheck).toBeDefined();
  });

  it("findActiveEventTypesByUser returns Promise<EventType[]>", () => {
    const _typeCheck: (userId: string) => Promise<EventType[]> =
      repository.findActiveEventTypesByUser;
    expect(_typeCheck).toBeDefined();
  });
});
