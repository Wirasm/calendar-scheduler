import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { BookingConfirmationEmailData } from "../schemas";

// Mock Resend client
const mockSend = mock<
  (payload: unknown) => Promise<{ data: { id: string } | null; error: { message: string } | null }>
>(() => Promise.resolve({ data: { id: "email_123" }, error: null }));

const mockResendClient = {
  emails: {
    send: mockSend,
  },
};

// Mock the notifications client module
mock.module("@/core/notifications", () => ({
  getResendClient: () => mockResendClient,
}));

// Import service after mocking
const { sendBookingConfirmation } = await import("../service");

const mockEmailData: BookingConfirmationEmailData = {
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

describe("sendBookingConfirmation", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "email_123" }, error: null });
  });

  it("sends confirmation email to attendee and consultant", async () => {
    const result = await sendBookingConfirmation(mockEmailData);

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(result.attendeeEmailId).toBe("email_123");
    expect(result.consultantEmailId).toBe("email_123");
  });

  it("sends to correct recipients", async () => {
    await sendBookingConfirmation(mockEmailData);

    const calls = mockSend.mock.calls;
    expect(calls[0]?.[0]).toMatchObject({
      to: ["john@example.com"],
    });
    expect(calls[1]?.[0]).toMatchObject({
      to: ["jane@consultant.com"],
    });
  });

  it("includes appointment details in email subjects", async () => {
    await sendBookingConfirmation(mockEmailData);

    const calls = mockSend.mock.calls;
    const attendeePayload = calls[0]?.[0] as { subject: string };
    const consultantPayload = calls[1]?.[0] as { subject: string };

    expect(attendeePayload.subject).toContain("30 Minute Consultation");
    expect(attendeePayload.subject).toContain("Jane Smith");
    expect(consultantPayload.subject).toContain("John Doe");
  });

  it("throws EmailSendFailedError when attendee email fails", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid recipient" },
    });

    await expect(sendBookingConfirmation(mockEmailData)).rejects.toThrow(
      "Failed to send email to john@example.com",
    );
  });

  it("throws EmailSendFailedError when consultant email fails", async () => {
    mockSend
      .mockResolvedValueOnce({ data: { id: "email_123" }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: "Rate limited" },
      });

    await expect(sendBookingConfirmation(mockEmailData)).rejects.toThrow(
      "Failed to send email to jane@consultant.com",
    );
  });

  it("handles null message gracefully", async () => {
    const dataWithoutMessage = { ...mockEmailData, attendeeMessage: null };

    await expect(sendBookingConfirmation(dataWithoutMessage)).resolves.toBeDefined();
  });
});

describe("sendBookingConfirmation - email content", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "email_123" }, error: null });
  });

  it("escapes HTML in attendee name", async () => {
    const dataWithHtml = { ...mockEmailData, attendeeName: "<script>alert('xss')</script>" };

    await sendBookingConfirmation(dataWithHtml);

    const calls = mockSend.mock.calls;
    const consultantPayload = calls[1]?.[0] as { html: string };

    expect(consultantPayload.html).not.toContain("<script>");
    expect(consultantPayload.html).toContain("&lt;script&gt;");
  });

  it("escapes HTML in attendee message", async () => {
    const dataWithHtml = { ...mockEmailData, attendeeMessage: "<img src=x onerror=alert(1)>" };

    await sendBookingConfirmation(dataWithHtml);

    const calls = mockSend.mock.calls;
    const attendeePayload = calls[0]?.[0] as { html: string };

    expect(attendeePayload.html).not.toContain("<img");
    expect(attendeePayload.html).toContain("&lt;img");
  });

  it("escapes HTML in eventTypeName", async () => {
    const dataWithHtml = { ...mockEmailData, eventTypeName: "<script>alert('xss')</script>" };

    await sendBookingConfirmation(dataWithHtml);

    const calls = mockSend.mock.calls;
    const attendeePayload = calls[0]?.[0] as { html: string };

    expect(attendeePayload.html).not.toContain("<script>");
    expect(attendeePayload.html).toContain("&lt;script&gt;");
  });

  it("omits message section in attendee email when message is null", async () => {
    const dataWithoutMessage = { ...mockEmailData, attendeeMessage: null };

    await sendBookingConfirmation(dataWithoutMessage);

    const calls = mockSend.mock.calls;
    const attendeePayload = calls[0]?.[0] as { html: string };

    expect(attendeePayload.html).not.toContain("Your message:");
  });

  it("shows 'No message provided' in consultant email when message is null", async () => {
    const dataWithoutMessage = { ...mockEmailData, attendeeMessage: null };

    await sendBookingConfirmation(dataWithoutMessage);

    const calls = mockSend.mock.calls;
    const consultantPayload = calls[1]?.[0] as { html: string };

    expect(consultantPayload.html).toContain("No message provided.");
  });
});

describe("sendBookingConfirmation - error handling", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("throws when attendee email returns success but no ID", async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: null });

    await expect(sendBookingConfirmation(mockEmailData)).rejects.toThrow(
      "Email service returned success but no email ID",
    );
  });

  it("throws when consultant email returns success but no ID", async () => {
    mockSend
      .mockResolvedValueOnce({ data: { id: "email_123" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await expect(sendBookingConfirmation(mockEmailData)).rejects.toThrow(
      "Email service returned success but no email ID",
    );
  });

  it("throws EmailSendFailedError when network error occurs", async () => {
    mockSend.mockRejectedValueOnce(new Error("Network timeout"));

    await expect(sendBookingConfirmation(mockEmailData)).rejects.toThrow("Network timeout");
  });
});
