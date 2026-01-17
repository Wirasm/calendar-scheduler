import { beforeEach, describe, expect, it, mock } from "bun:test";

// ============================================================================
// Mocks
// ============================================================================

// Mock logger
const mockLogger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
};

mock.module("@/core/logging", () => ({
  getLogger: () => mockLogger,
}));

const mockCreateAppointment = mock(() =>
  Promise.resolve({
    id: "appointment-123",
    eventTypeId: "event-type-123",
    userId: "user-123",
    startTime: new Date("2025-02-01T10:00:00Z"),
    endTime: new Date("2025-02-01T10:30:00Z"),
    attendeeName: "John Doe",
    attendeeEmail: "john@example.com",
    attendeeMessage: null,
    status: "confirmed",
    cancelledAt: null,
    reminderSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
);

const mockGetAvailableSlots = mock(() =>
  Promise.resolve([
    {
      startTime: new Date("2025-02-01T10:00:00Z"),
      endTime: new Date("2025-02-01T10:30:00Z"),
    },
    {
      startTime: new Date("2025-02-01T10:30:00Z"),
      endTime: new Date("2025-02-01T11:00:00Z"),
    },
  ]),
);

const mockGetBookingEmailData = mock<
  () => Promise<
    | {
        eventType: { id: string; name: string };
        consultant: { id: string; email: string; displayName: string };
      }
    | undefined
  >
>(() =>
  Promise.resolve({
    eventType: {
      id: "event-type-123",
      name: "30 min Meeting",
    },
    consultant: {
      id: "user-123",
      email: "consultant@example.com",
      displayName: "Dr. Consultant",
    },
  }),
);

class MockSchedulingError extends Error {
  code = "SCHEDULING_ERROR";
  statusCode = 400;
}

const mockSendBookingConfirmation = mock(() => Promise.resolve({ id: "email-123" }));

// Mock modules
mock.module("@/features/scheduling", () => ({
  CreateAppointmentSchema: {
    safeParse: (data: unknown) => {
      const d = data as {
        eventTypeId?: string;
        startTime?: Date;
        attendeeName?: string;
        attendeeEmail?: string;
      };
      if (!d.eventTypeId) {
        return { success: false, error: { issues: [{ message: "Event type is required" }] } };
      }
      if (!d.attendeeName || d.attendeeName.length < 2) {
        return {
          success: false,
          error: { issues: [{ message: "Name must be at least 2 characters" }] },
        };
      }
      if (!d.attendeeEmail || !d.attendeeEmail.includes("@")) {
        return { success: false, error: { issues: [{ message: "Invalid email" }] } };
      }
      return { success: true, data: d };
    },
  },
  createAppointment: mockCreateAppointment,
  getAvailableSlots: mockGetAvailableSlots,
  getBookingEmailData: mockGetBookingEmailData,
  SchedulingError: MockSchedulingError,
}));

mock.module("@/features/notifications", () => ({
  sendBookingConfirmation: mockSendBookingConfirmation,
}));

// Import after mocking
const { createBookingAction, getAvailableSlotsAction, initialBookingState } = await import(
  "../actions"
);

// ============================================================================
// Test Helpers
// ============================================================================

function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value);
  }
  return formData;
}

// ============================================================================
// createBookingAction Tests
// ============================================================================

describe("createBookingAction", () => {
  beforeEach(() => {
    mockCreateAppointment.mockReset();
    mockGetBookingEmailData.mockReset();
    mockSendBookingConfirmation.mockReset();

    // Reset to default implementations
    mockCreateAppointment.mockResolvedValue({
      id: "appointment-123",
      eventTypeId: "event-type-123",
      userId: "user-123",
      startTime: new Date("2025-02-01T10:00:00Z"),
      endTime: new Date("2025-02-01T10:30:00Z"),
      attendeeName: "John Doe",
      attendeeEmail: "john@example.com",
      attendeeMessage: null,
      status: "confirmed",
      cancelledAt: null,
      reminderSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockGetBookingEmailData.mockResolvedValue({
      eventType: {
        id: "event-type-123",
        name: "30 min Meeting",
      },
      consultant: {
        id: "user-123",
        email: "consultant@example.com",
        displayName: "Dr. Consultant",
      },
    });

    mockSendBookingConfirmation.mockResolvedValue({ id: "email-123" });
  });

  describe("form validation", () => {
    it("returns error when eventTypeId is missing", async () => {
      const formData = createFormData({
        startTime: "2025-02-01T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
      });

      const result = await createBookingAction(initialBookingState, formData);

      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error).toBe("Event type is required");
      }
    });

    it("returns error when startTime is missing", async () => {
      const formData = createFormData({
        eventTypeId: "event-type-123",
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
      });

      const result = await createBookingAction(initialBookingState, formData);

      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error).toBe("Time slot is required");
      }
    });

    it("returns error when attendeeName is missing", async () => {
      const formData = createFormData({
        eventTypeId: "event-type-123",
        startTime: "2025-02-01T10:00:00Z",
        attendeeEmail: "john@example.com",
      });

      const result = await createBookingAction(initialBookingState, formData);

      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error).toBe("Name is required");
      }
    });

    it("returns error when attendeeEmail is missing", async () => {
      const formData = createFormData({
        eventTypeId: "event-type-123",
        startTime: "2025-02-01T10:00:00Z",
        attendeeName: "John Doe",
      });

      const result = await createBookingAction(initialBookingState, formData);

      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error).toBe("Email is required");
      }
    });
  });

  describe("successful booking", () => {
    it("creates appointment and sends email on success", async () => {
      const formData = createFormData({
        eventTypeId: "event-type-123",
        startTime: "2025-02-01T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
      });

      const result = await createBookingAction(initialBookingState, formData);

      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.appointmentId).toBe("appointment-123");
        expect(result.emailSent).toBe(true);
        expect(result.emailWarning).toBeUndefined();
      }
      expect(mockCreateAppointment).toHaveBeenCalledTimes(1);
      expect(mockSendBookingConfirmation).toHaveBeenCalledTimes(1);
    });

    it("includes optional message in appointment", async () => {
      const formData = createFormData({
        eventTypeId: "event-type-123",
        startTime: "2025-02-01T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
        attendeeMessage: "Looking forward to our meeting!",
      });

      await createBookingAction(initialBookingState, formData);

      expect(mockCreateAppointment).toHaveBeenCalledTimes(1);
    });
  });

  describe("email handling", () => {
    it("returns emailSent=false with warning when email data is missing", async () => {
      mockGetBookingEmailData.mockResolvedValue(undefined);

      const formData = createFormData({
        eventTypeId: "event-type-123",
        startTime: "2025-02-01T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
      });

      const result = await createBookingAction(initialBookingState, formData);

      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.emailSent).toBe(false);
        expect(result.emailWarning).toContain("could not be sent");
      }
      expect(mockSendBookingConfirmation).not.toHaveBeenCalled();
    });

    it("returns emailSent=false with warning when email fails", async () => {
      mockSendBookingConfirmation.mockRejectedValue(new Error("Email service down"));

      const formData = createFormData({
        eventTypeId: "event-type-123",
        startTime: "2025-02-01T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
      });

      const result = await createBookingAction(initialBookingState, formData);

      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.appointmentId).toBe("appointment-123");
        expect(result.emailSent).toBe(false);
        expect(result.emailWarning).toContain("could not be sent");
      }
    });
  });

  describe("error handling", () => {
    it("returns scheduling error message for SchedulingError", async () => {
      const schedulingError = new MockSchedulingError("Time slot is no longer available");
      mockCreateAppointment.mockRejectedValue(schedulingError);

      const formData = createFormData({
        eventTypeId: "event-type-123",
        startTime: "2025-02-01T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
      });

      const result = await createBookingAction(initialBookingState, formData);

      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error).toBe("Time slot is no longer available");
      }
    });

    it("returns generic error message for unexpected errors", async () => {
      mockCreateAppointment.mockRejectedValue(new Error("Database connection failed"));

      const formData = createFormData({
        eventTypeId: "event-type-123",
        startTime: "2025-02-01T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
      });

      const result = await createBookingAction(initialBookingState, formData);

      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error).toBe("Failed to create booking. Please try again.");
      }
    });
  });
});

// ============================================================================
// getAvailableSlotsAction Tests
// ============================================================================

describe("getAvailableSlotsAction", () => {
  beforeEach(() => {
    mockGetAvailableSlots.mockReset();
    mockGetAvailableSlots.mockResolvedValue([
      {
        startTime: new Date("2025-02-01T10:00:00Z"),
        endTime: new Date("2025-02-01T10:30:00Z"),
      },
      {
        startTime: new Date("2025-02-01T10:30:00Z"),
        endTime: new Date("2025-02-01T11:00:00Z"),
      },
    ]);
  });

  it("returns serialized slots for valid event type", async () => {
    const result = await getAvailableSlotsAction("event-type-123");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.slots).toHaveLength(2);
      expect(result.slots[0]?.startTime).toBe("2025-02-01T10:00:00.000Z");
      expect(result.slots[0]?.endTime).toBe("2025-02-01T10:30:00.000Z");
    }
  });

  it("returns empty slots when no availability", async () => {
    mockGetAvailableSlots.mockResolvedValue([]);

    const result = await getAvailableSlotsAction("event-type-123");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.slots).toHaveLength(0);
    }
  });

  it("returns error for SchedulingError", async () => {
    const schedulingError = new MockSchedulingError("Event type not found");
    mockGetAvailableSlots.mockRejectedValue(schedulingError);

    const result = await getAvailableSlotsAction("non-existent");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Event type not found");
    }
  });

  it("returns generic error for unexpected errors", async () => {
    mockGetAvailableSlots.mockRejectedValue(new Error("Database connection failed"));

    const result = await getAvailableSlotsAction("event-type-123");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Failed to load available slots");
    }
  });
});
