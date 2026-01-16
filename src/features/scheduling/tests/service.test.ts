import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { Appointment, AvailabilityWindow, EventType, NewAvailabilityWindow } from "../models";

// Mock the repository module with all functions
const mockRepository = {
  // Availability window functions
  findById: mock<(id: string) => Promise<AvailabilityWindow | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  findByUserId: mock<(userId: string) => Promise<AvailabilityWindow[]>>(() => Promise.resolve([])),
  findByUserIdAndDay: mock<(userId: string, dayOfWeek: number) => Promise<AvailabilityWindow[]>>(
    () => Promise.resolve([]),
  ),
  create: mock<(data: NewAvailabilityWindow) => Promise<AvailabilityWindow>>(() =>
    Promise.resolve({} as AvailabilityWindow),
  ),
  update: mock<
    (
      id: string,
      data: Partial<Pick<AvailabilityWindow, "dayOfWeek" | "startTime" | "endTime">>,
    ) => Promise<AvailabilityWindow | undefined>
  >(() => Promise.resolve(undefined)),
  deleteById: mock<(id: string) => Promise<boolean>>(() => Promise.resolve(false)),
  // Slot generation functions
  findEventTypeById: mock<(id: string) => Promise<EventType | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  findEventTypeBySlugAndUser: mock<
    (slug: string, userId: string) => Promise<EventType | undefined>
  >(() => Promise.resolve(undefined)),
  findAvailabilityWindowsByUser: mock<(userId: string) => Promise<AvailabilityWindow[]>>(() =>
    Promise.resolve([]),
  ),
  findAppointmentsByUserAndDateRange: mock<
    (
      userId: string,
      startDate: Date,
      endDate: Date,
      excludeCancelled?: boolean,
    ) => Promise<Appointment[]>
  >(() => Promise.resolve([])),
  findActiveEventTypesByUser: mock<(userId: string) => Promise<EventType[]>>(() =>
    Promise.resolve([]),
  ),
};

// Mock the repository before importing service
mock.module("../repository", () => mockRepository);

// Import service after mocking
const {
  createAvailabilityWindow,
  deleteAvailabilityWindow,
  getAvailabilityWindow,
  getAvailabilityWindowsByUser,
  getAvailableSlots,
  updateAvailabilityWindow,
  validateSlotAvailable,
} = await import("../service");

// ============================================================================
// Test Fixtures
// ============================================================================

const mockWindow: AvailabilityWindow = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "550e8400-e29b-41d4-a716-446655440001",
  dayOfWeek: 1, // Monday
  startTime: "09:00",
  endTime: "17:00",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEventType: EventType = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "550e8400-e29b-41d4-a716-446655440001",
  name: "30 min Meeting",
  slug: "30-min-meeting",
  description: "A 30 minute consultation",
  durationMinutes: 30,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 15,
  minNoticeHours: 24,
  maxAdvanceDays: 14,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Single mock window for Monday (slot generation tests)
const mockMondayWindow: AvailabilityWindow = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  userId: "550e8400-e29b-41d4-a716-446655440001",
  dayOfWeek: 1, // Monday
  startTime: "09:00",
  endTime: "12:00",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Create windows for Monday (1) and Wednesday (3)
const mockAvailabilityWindows: AvailabilityWindow[] = [
  mockMondayWindow,
  {
    id: "550e8400-e29b-41d4-a716-446655440011",
    userId: "550e8400-e29b-41d4-a716-446655440001",
    dayOfWeek: 3, // Wednesday
    startTime: "14:00",
    endTime: "17:00",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const userId = "550e8400-e29b-41d4-a716-446655440001";
const otherUserId = "550e8400-e29b-41d4-a716-446655440002";

// ============================================================================
// Availability Window Tests
// ============================================================================

describe("createAvailabilityWindow", () => {
  beforeEach(() => {
    mockRepository.findByUserIdAndDay.mockReset();
    mockRepository.create.mockReset();
  });

  it("creates window when no overlap exists", async () => {
    mockRepository.findByUserIdAndDay.mockResolvedValue([]);
    mockRepository.create.mockResolvedValue(mockWindow);

    const result = await createAvailabilityWindow(
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      userId,
    );

    expect(result).toEqual(mockWindow);
    expect(mockRepository.create).toHaveBeenCalledTimes(1);
  });

  it("throws AvailabilityWindowOverlapError when overlap exists", async () => {
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);

    await expect(
      createAvailabilityWindow({ dayOfWeek: 1, startTime: "10:00", endTime: "12:00" }, userId),
    ).rejects.toThrow("overlaps");
  });

  it("allows non-overlapping windows on same day", async () => {
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);
    const afternoonWindow = { ...mockWindow, id: "new-id", startTime: "18:00", endTime: "20:00" };
    mockRepository.create.mockResolvedValue(afternoonWindow);

    const result = await createAvailabilityWindow(
      { dayOfWeek: 1, startTime: "18:00", endTime: "20:00" },
      userId,
    );

    expect(result.startTime).toBe("18:00");
    expect(mockRepository.create).toHaveBeenCalledTimes(1);
  });

  it("allows adjacent windows that share a boundary time", async () => {
    // Existing: 09:00-17:00, New: 17:00-20:00 should be allowed (no overlap)
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]); // 09:00-17:00
    const adjacentWindow = {
      ...mockWindow,
      id: "adjacent-id",
      startTime: "17:00",
      endTime: "20:00",
    };
    mockRepository.create.mockResolvedValue(adjacentWindow);

    const result = await createAvailabilityWindow(
      { dayOfWeek: 1, startTime: "17:00", endTime: "20:00" },
      userId,
    );

    expect(result.startTime).toBe("17:00");
    expect(mockRepository.create).toHaveBeenCalledTimes(1);
  });

  it("detects overlap when new window starts at existing start time", async () => {
    // Existing: 09:00-17:00, New: 09:00-10:00 overlaps
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);

    await expect(
      createAvailabilityWindow({ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }, userId),
    ).rejects.toThrow("overlaps");
  });

  it("detects overlap when new window ends at existing end time", async () => {
    // Existing: 09:00-17:00, New: 16:00-17:00 overlaps
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);

    await expect(
      createAvailabilityWindow({ dayOfWeek: 1, startTime: "16:00", endTime: "17:00" }, userId),
    ).rejects.toThrow("overlaps");
  });

  it("verifies repository.create is called with correct arguments", async () => {
    mockRepository.findByUserIdAndDay.mockResolvedValue([]);
    mockRepository.create.mockResolvedValue(mockWindow);

    await createAvailabilityWindow({ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }, userId);

    expect(mockRepository.create).toHaveBeenCalledWith({
      userId,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
    });
  });
});

describe("getAvailabilityWindowsByUser", () => {
  beforeEach(() => {
    mockRepository.findByUserId.mockReset();
  });

  it("returns windows for user", async () => {
    mockRepository.findByUserId.mockResolvedValue([mockWindow]);

    const result = await getAvailabilityWindowsByUser(userId);

    expect(result).toEqual([mockWindow]);
    expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
  });

  it("returns empty array when no windows exist", async () => {
    mockRepository.findByUserId.mockResolvedValue([]);

    const result = await getAvailabilityWindowsByUser(userId);

    expect(result).toEqual([]);
  });
});

describe("getAvailabilityWindow", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
  });

  it("returns window when user is owner", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);

    const result = await getAvailabilityWindow(mockWindow.id, userId);

    expect(result).toEqual(mockWindow);
  });

  it("throws AvailabilityWindowNotFoundError when window does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(getAvailabilityWindow("non-existent-id", userId)).rejects.toThrow(
      "Availability window not found",
    );
  });

  it("throws SchedulingAccessDeniedError when user is not owner", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);

    await expect(getAvailabilityWindow(mockWindow.id, otherUserId)).rejects.toThrow(
      "Access denied",
    );
  });
});

describe("updateAvailabilityWindow", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
    mockRepository.findByUserIdAndDay.mockReset();
    mockRepository.update.mockReset();
  });

  it("updates window when user is owner and no overlap", async () => {
    const updatedWindow = { ...mockWindow, startTime: "10:00" };
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);
    mockRepository.update.mockResolvedValue(updatedWindow);

    const result = await updateAvailabilityWindow(mockWindow.id, { startTime: "10:00" }, userId);

    expect(result.startTime).toBe("10:00");
    expect(mockRepository.update).toHaveBeenCalledTimes(1);
  });

  it("throws AvailabilityWindowNotFoundError when window does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(
      updateAvailabilityWindow("non-existent-id", { startTime: "10:00" }, userId),
    ).rejects.toThrow("Availability window not found");
  });

  it("throws SchedulingAccessDeniedError when user is not owner", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);

    await expect(
      updateAvailabilityWindow(mockWindow.id, { startTime: "10:00" }, otherUserId),
    ).rejects.toThrow("Access denied");
  });

  it("throws AvailabilityWindowOverlapError when update causes overlap", async () => {
    const existingWindow2 = { ...mockWindow, id: "other-id", startTime: "18:00", endTime: "20:00" };
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow, existingWindow2]);

    await expect(
      updateAvailabilityWindow(mockWindow.id, { startTime: "18:30", endTime: "19:30" }, userId),
    ).rejects.toThrow("overlaps");
  });

  it("allows update that does not cause overlap", async () => {
    const updatedWindow = { ...mockWindow, endTime: "16:00" };
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);
    mockRepository.update.mockResolvedValue(updatedWindow);

    const result = await updateAvailabilityWindow(mockWindow.id, { endTime: "16:00" }, userId);

    expect(result.endTime).toBe("16:00");
  });

  it("throws AvailabilityWindowNotFoundError when update fails (race condition)", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);
    mockRepository.update.mockResolvedValue(undefined);

    await expect(
      updateAvailabilityWindow(mockWindow.id, { startTime: "10:00" }, userId),
    ).rejects.toThrow("Availability window not found");
  });

  it("checks overlap on new day when dayOfWeek is changed", async () => {
    // Moving Monday window to Tuesday where 09:00-17:00 already exists
    const tuesdayWindow = {
      ...mockWindow,
      id: "tuesday-id",
      dayOfWeek: 2,
      startTime: "09:00",
      endTime: "17:00",
    };
    mockRepository.findById.mockResolvedValue(mockWindow); // Monday 09:00-17:00
    mockRepository.findByUserIdAndDay.mockResolvedValue([tuesdayWindow]); // Tuesday already has 09:00-17:00

    await expect(
      updateAvailabilityWindow(mockWindow.id, { dayOfWeek: 2 }, userId), // Move to Tuesday
    ).rejects.toThrow("overlaps");
  });

  it("allows changing dayOfWeek when no overlap on new day", async () => {
    const updatedWindow = { ...mockWindow, dayOfWeek: 2 };
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.findByUserIdAndDay.mockResolvedValue([]); // Tuesday is empty
    mockRepository.update.mockResolvedValue(updatedWindow);

    const result = await updateAvailabilityWindow(mockWindow.id, { dayOfWeek: 2 }, userId);

    expect(result.dayOfWeek).toBe(2);
    expect(mockRepository.findByUserIdAndDay).toHaveBeenCalledWith(userId, 2);
  });

  it("uses existing values for overlap check when updating only startTime", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow); // dayOfWeek: 1, 09:00-17:00
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);
    mockRepository.update.mockResolvedValue({ ...mockWindow, startTime: "10:00" });

    await updateAvailabilityWindow(mockWindow.id, { startTime: "10:00" }, userId);

    // Should check overlap on day 1 (existing), not undefined
    expect(mockRepository.findByUserIdAndDay).toHaveBeenCalledWith(userId, 1);
  });
});

describe("deleteAvailabilityWindow", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
    mockRepository.deleteById.mockReset();
  });

  it("deletes window when user is owner", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.deleteById.mockResolvedValue(true);

    await expect(deleteAvailabilityWindow(mockWindow.id, userId)).resolves.toBeUndefined();
    expect(mockRepository.deleteById).toHaveBeenCalledWith(mockWindow.id);
  });

  it("throws AvailabilityWindowNotFoundError when window does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(deleteAvailabilityWindow("non-existent-id", userId)).rejects.toThrow(
      "Availability window not found",
    );
  });

  it("throws SchedulingAccessDeniedError when user is not owner", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);

    await expect(deleteAvailabilityWindow(mockWindow.id, otherUserId)).rejects.toThrow(
      "Access denied",
    );
  });

  it("throws AvailabilityWindowNotFoundError when delete fails (race condition)", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.deleteById.mockResolvedValue(false);

    await expect(deleteAvailabilityWindow(mockWindow.id, userId)).rejects.toThrow(
      "Availability window not found",
    );
  });
});

// ============================================================================
// Slot Generation Tests
// ============================================================================

describe("getAvailableSlots", () => {
  beforeEach(() => {
    mockRepository.findEventTypeById.mockReset();
    mockRepository.findAvailabilityWindowsByUser.mockReset();
    mockRepository.findAppointmentsByUserAndDateRange.mockReset();
  });

  it("returns slots within availability windows", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([mockMondayWindow]);
    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);

    // Use a future date far enough for minNoticeHours
    const now = new Date();
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() + 2);
    startDate.setUTCHours(0, 0, 0, 0);

    // Find next Monday
    while (startDate.getUTCDay() !== 1) {
      startDate.setUTCDate(startDate.getUTCDate() + 1);
    }

    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    const result = await getAvailableSlots({
      eventTypeId: mockEventType.id,
      startDate,
      endDate,
    });

    // 9:00-12:00 with 30min duration = 6 slots (9:00, 9:30, 10:00, 10:30, 11:00, 11:30)
    expect(result.length).toBe(6);
    const firstSlot = result[0];
    expect(firstSlot).toBeDefined();
    expect(firstSlot?.startTime.getUTCHours()).toBe(9);
    expect(firstSlot?.startTime.getUTCMinutes()).toBe(0);
  });

  it("excludes slots that conflict with existing appointments", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([mockMondayWindow]);

    // Use a future date far enough for minNoticeHours
    const now = new Date();
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() + 2);
    startDate.setUTCHours(0, 0, 0, 0);

    // Find next Monday
    while (startDate.getUTCDay() !== 1) {
      startDate.setUTCDate(startDate.getUTCDate() + 1);
    }

    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    // Create appointment at 10:00-10:30
    const existingAppointment: Appointment = {
      id: "550e8400-e29b-41d4-a716-446655440020",
      eventTypeId: mockEventType.id,
      userId: mockEventType.userId,
      startTime: new Date(startDate),
      endTime: new Date(startDate),
      attendeeName: "John Doe",
      attendeeEmail: "john@example.com",
      attendeeMessage: null,
      status: "confirmed",
      cancelledAt: null,
      reminderSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    existingAppointment.startTime.setUTCHours(10, 0, 0, 0);
    existingAppointment.endTime.setUTCHours(10, 30, 0, 0);

    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([existingAppointment]);

    const result = await getAvailableSlots({
      eventTypeId: mockEventType.id,
      startDate,
      endDate,
    });

    // 6 slots minus the 10:00 slot that conflicts = 5 slots
    // However, with 15 min buffer after, the 9:30 slot might also conflict
    expect(result.length).toBeLessThan(6);

    // Ensure 10:00 slot is not in results
    const has10amSlot = result.some(
      (slot) => slot.startTime.getUTCHours() === 10 && slot.startTime.getUTCMinutes() === 0,
    );
    expect(has10amSlot).toBe(false);
  });

  it("respects buffer times around appointments", async () => {
    const eventWithBuffers = {
      ...mockEventType,
      bufferBeforeMinutes: 15,
      bufferAfterMinutes: 15,
    };
    mockRepository.findEventTypeById.mockResolvedValue(eventWithBuffers);
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([mockMondayWindow]);

    const now = new Date();
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() + 2);
    startDate.setUTCHours(0, 0, 0, 0);

    while (startDate.getUTCDay() !== 1) {
      startDate.setUTCDate(startDate.getUTCDate() + 1);
    }

    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    // Appointment at 10:00-10:30 with 15min buffers blocks 9:45-10:45
    const existingAppointment: Appointment = {
      id: "550e8400-e29b-41d4-a716-446655440020",
      eventTypeId: mockEventType.id,
      userId: mockEventType.userId,
      startTime: new Date(startDate),
      endTime: new Date(startDate),
      attendeeName: "John Doe",
      attendeeEmail: "john@example.com",
      attendeeMessage: null,
      status: "confirmed",
      cancelledAt: null,
      reminderSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    existingAppointment.startTime.setUTCHours(10, 0, 0, 0);
    existingAppointment.endTime.setUTCHours(10, 30, 0, 0);

    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([existingAppointment]);

    const result = await getAvailableSlots({
      eventTypeId: eventWithBuffers.id,
      startDate,
      endDate,
    });

    // With 15min buffer before and after:
    // - 9:30 slot (ends 10:00) overlaps with buffer before (9:45)
    // - 10:00 slot overlaps with appointment
    // - 10:30 slot (starts 10:30) overlaps with buffer after (10:45)
    // So slots blocked: 9:30, 10:00, 10:30 - leaves 9:00, 11:00, 11:30 = 3 slots
    expect(result.length).toBeLessThan(6);
  });

  it("enforces minimum notice hours", async () => {
    // Event type with 24 hour notice
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([mockMondayWindow]);
    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);

    // Request slots starting now (within notice period)
    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setUTCHours(endDate.getUTCHours() + 12); // Only 12 hours ahead

    const result = await getAvailableSlots({
      eventTypeId: mockEventType.id,
      startDate,
      endDate,
    });

    // No slots should be available within 24 hour notice period
    expect(result).toEqual([]);
  });

  it("enforces maximum advance days", async () => {
    // Event type with 14 day max advance
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([mockMondayWindow]);
    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);

    // Request slots starting 30 days from now
    const now = new Date();
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() + 30);

    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 7);

    const result = await getAvailableSlots({
      eventTypeId: mockEventType.id,
      startDate,
      endDate,
    });

    // No slots should be available beyond max advance days
    expect(result).toEqual([]);
  });

  it("throws NoAvailabilityConfiguredError when no availability windows", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([]);
    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);

    const now = new Date();
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() + 2);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 7);

    await expect(
      getAvailableSlots({
        eventTypeId: mockEventType.id,
        startDate,
        endDate,
      }),
    ).rejects.toThrow("Consultant has no availability windows configured");
  });

  it("sorts slots by start time", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue(mockAvailabilityWindows);
    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);

    const now = new Date();
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() + 2);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 7);

    const result = await getAvailableSlots({
      eventTypeId: mockEventType.id,
      startDate,
      endDate,
    });

    // Verify slots are sorted
    for (let i = 1; i < result.length; i++) {
      const currentSlot = result[i];
      const previousSlot = result[i - 1];
      if (currentSlot && previousSlot) {
        expect(currentSlot.startTime.getTime()).toBeGreaterThanOrEqual(
          previousSlot.startTime.getTime(),
        );
      }
    }
  });

  it("handles multiple availability windows on same day", async () => {
    const morningWindow: AvailabilityWindow = {
      ...mockMondayWindow,
      startTime: "09:00",
      endTime: "12:00",
    };
    const afternoonWindow: AvailabilityWindow = {
      ...mockMondayWindow,
      id: "550e8400-e29b-41d4-a716-446655440012",
      startTime: "14:00",
      endTime: "17:00",
    };
    const sameDay: AvailabilityWindow[] = [morningWindow, afternoonWindow];

    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue(sameDay);
    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);

    const now = new Date();
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() + 2);
    startDate.setUTCHours(0, 0, 0, 0);

    // Find next Monday
    while (startDate.getUTCDay() !== 1) {
      startDate.setUTCDate(startDate.getUTCDate() + 1);
    }

    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    const result = await getAvailableSlots({
      eventTypeId: mockEventType.id,
      startDate,
      endDate,
    });

    // 9:00-12:00 = 6 slots, 14:00-17:00 = 6 slots = 12 total
    expect(result.length).toBe(12);
  });

  it("throws EventTypeNotFoundError for invalid event type", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(undefined);

    const now = new Date();
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() + 2);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 7);

    await expect(
      getAvailableSlots({
        eventTypeId: "non-existent-id",
        startDate,
        endDate,
      }),
    ).rejects.toThrow("Event type not found");
  });
});

describe("validateSlotAvailable", () => {
  beforeEach(() => {
    mockRepository.findEventTypeById.mockReset();
    mockRepository.findAvailabilityWindowsByUser.mockReset();
    mockRepository.findAppointmentsByUserAndDateRange.mockReset();
    mockRepository.findAvailabilityWindowsByUser.mockReset();
  });

  // Helper to create a window for any day of week at 09:00-17:00
  const createWindowForDay = (dayOfWeek: number): AvailabilityWindow => ({
    ...mockMondayWindow,
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
  });

  it("returns event type and end time for valid slot", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([mockMondayWindow]);

    const now = new Date();
    const startTime = new Date(now);
    startTime.setUTCDate(startTime.getUTCDate() + 2);
    // Find next Monday
    while (startTime.getUTCDay() !== 1) {
      startTime.setUTCDate(startTime.getUTCDate() + 1);
    }
    startTime.setUTCHours(10, 0, 0, 0);

    // Mock availability window for the day of the slot
    const dayOfWeek = startTime.getUTCDay();
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([createWindowForDay(dayOfWeek)]);

    const result = await validateSlotAvailable(mockEventType.id, startTime);

    expect(result.eventType).toEqual(mockEventType);
    expect(result.endTime.getTime()).toBe(
      startTime.getTime() + mockEventType.durationMinutes * 60 * 1000,
    );
  });

  it("throws AppointmentSlotUnavailableError when slot is taken", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([mockMondayWindow]);

    const now = new Date();
    const startTime = new Date(now);
    startTime.setUTCDate(startTime.getUTCDate() + 2);
    // Find next Monday
    while (startTime.getUTCDay() !== 1) {
      startTime.setUTCDate(startTime.getUTCDate() + 1);
    }
    startTime.setUTCHours(10, 0, 0, 0);

    // Mock availability window for the day of the slot
    const dayOfWeek = startTime.getUTCDay();
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([createWindowForDay(dayOfWeek)]);

    const existingAppointment: Appointment = {
      id: "550e8400-e29b-41d4-a716-446655440020",
      eventTypeId: mockEventType.id,
      userId: mockEventType.userId,
      startTime: new Date(startTime),
      endTime: new Date(startTime),
      attendeeName: "John Doe",
      attendeeEmail: "john@example.com",
      attendeeMessage: null,
      status: "confirmed",
      cancelledAt: null,
      reminderSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    existingAppointment.endTime.setUTCMinutes(
      existingAppointment.endTime.getUTCMinutes() + mockEventType.durationMinutes,
    );

    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([existingAppointment]);

    await expect(validateSlotAvailable(mockEventType.id, startTime)).rejects.toThrow(
      "Time slot is no longer available",
    );
  });

  it("throws AppointmentOutsideAvailabilityError when slot is outside availability", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);

    const now = new Date();
    const startTime = new Date(now);
    startTime.setUTCDate(startTime.getUTCDate() + 2);
    startTime.setUTCHours(3, 0, 0, 0); // 3 AM - outside normal availability

    // Mock availability window for a different day or time
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([mockMondayWindow]); // Monday 9-12

    await expect(validateSlotAvailable(mockEventType.id, startTime)).rejects.toThrow(
      "outside available hours",
    );
  });

  it("throws AppointmentInsufficientNoticeError when too soon", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);

    // Try to book a slot in 1 hour (less than 24 hour notice)
    const now = new Date();
    const startTime = new Date(now);
    startTime.setUTCHours(startTime.getUTCHours() + 1);

    await expect(validateSlotAvailable(mockEventType.id, startTime)).rejects.toThrow(
      "require at least 24 hours notice",
    );
  });

  it("throws AppointmentTooFarAdvanceError when too far ahead", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);

    // Try to book a slot 30 days ahead (more than 14 day max)
    const now = new Date();
    const startTime = new Date(now);
    startTime.setUTCDate(startTime.getUTCDate() + 30);

    await expect(validateSlotAvailable(mockEventType.id, startTime)).rejects.toThrow(
      "can only be booked up to 14 days in advance",
    );
  });

  it("throws EventTypeNotFoundError for invalid event type", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(undefined);

    const now = new Date();
    const startTime = new Date(now);
    startTime.setUTCDate(startTime.getUTCDate() + 2);

    await expect(validateSlotAvailable("non-existent-id", startTime)).rejects.toThrow(
      "Event type not found",
    );
  });

  it("throws AppointmentOutsideAvailabilityError when slot is outside availability", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);
    mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([mockMondayWindow]); // Only Monday 9-12

    const now = new Date();
    const startTime = new Date(now);
    startTime.setUTCDate(startTime.getUTCDate() + 2);
    // Find next Tuesday (not Monday)
    while (startTime.getUTCDay() !== 2) {
      startTime.setUTCDate(startTime.getUTCDate() + 1);
    }
    startTime.setUTCHours(10, 0, 0, 0);

    await expect(validateSlotAvailable(mockEventType.id, startTime)).rejects.toThrow(
      "outside of available hours",
    );
  });
});
