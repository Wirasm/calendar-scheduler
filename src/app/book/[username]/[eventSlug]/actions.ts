"use server";

import { getLogger } from "@/core/logging";
import {
  type BookingConfirmationEmailData,
  sendBookingConfirmation,
} from "@/features/notifications";
import {
  CreateAppointmentSchema,
  createAppointment,
  getAvailableSlots,
  getBookingEmailData,
  SchedulingError,
} from "@/features/scheduling";

const logger = getLogger("booking.actions");

// ============================================================================
// Types
// ============================================================================

export type BookingActionState =
  | { status: "idle" }
  | { status: "success"; appointmentId: string; emailSent: boolean; emailWarning?: string }
  | { status: "error"; error: string };

interface ParsedFormData {
  eventTypeId: string;
  startTimeStr: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeMessage: string | undefined;
}

type ParseResult = { ok: true; data: ParsedFormData } | { ok: false; error: string };

export type SlotsResult =
  | { ok: true; slots: Array<{ startTime: string; endTime: string }> }
  | { ok: false; error: string };

// ============================================================================
// Helpers
// ============================================================================

function parseFormData(formData: FormData): ParseResult {
  const eventTypeId = formData.get("eventTypeId");
  const startTimeStr = formData.get("startTime");
  const attendeeName = formData.get("attendeeName");
  const attendeeEmail = formData.get("attendeeEmail");
  const attendeeMessage = formData.get("attendeeMessage");

  if (!eventTypeId || typeof eventTypeId !== "string") {
    return { ok: false, error: "Event type is required" };
  }
  if (!startTimeStr || typeof startTimeStr !== "string") {
    return { ok: false, error: "Time slot is required" };
  }
  if (!attendeeName || typeof attendeeName !== "string") {
    return { ok: false, error: "Name is required" };
  }
  if (!attendeeEmail || typeof attendeeEmail !== "string") {
    return { ok: false, error: "Email is required" };
  }

  return {
    ok: true,
    data: {
      eventTypeId,
      startTimeStr,
      attendeeName,
      attendeeEmail,
      attendeeMessage: attendeeMessage ? String(attendeeMessage) : undefined,
    },
  };
}

interface EmailResult {
  sent: boolean;
  warning?: string;
}

async function sendConfirmationEmail(
  appointment: Awaited<ReturnType<typeof createAppointment>>,
): Promise<EmailResult> {
  const emailData = await getBookingEmailData(appointment.eventTypeId, appointment.userId);

  if (!emailData) {
    // Already logged by getBookingEmailData
    return {
      sent: false,
      warning:
        "Confirmation email could not be sent. Your booking is confirmed - please save these details.",
    };
  }

  const confirmationData: BookingConfirmationEmailData = {
    appointmentId: appointment.id,
    eventTypeName: emailData.eventType.name,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    attendeeName: appointment.attendeeName,
    attendeeEmail: appointment.attendeeEmail,
    attendeeMessage: appointment.attendeeMessage,
    consultantName: emailData.consultant.displayName ?? emailData.consultant.email,
    consultantEmail: emailData.consultant.email,
  };

  try {
    await sendBookingConfirmation(confirmationData);
    return { sent: true };
  } catch (emailError) {
    logger.error({ appointmentId: appointment.id, error: emailError }, "booking.email_failed");
    return {
      sent: false,
      warning:
        "Confirmation email could not be sent. Your booking is confirmed - please save these details.",
    };
  }
}

// ============================================================================
// Actions
// ============================================================================

export const initialBookingState: BookingActionState = { status: "idle" };

export async function createBookingAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const parsed = parseFormData(formData);
  if (!parsed.ok) {
    logger.debug({ error: parsed.error }, "booking.form_validation_failed");
    return { status: "error", error: parsed.error };
  }

  const result = CreateAppointmentSchema.safeParse({
    eventTypeId: parsed.data.eventTypeId,
    startTime: new Date(parsed.data.startTimeStr),
    attendeeName: parsed.data.attendeeName,
    attendeeEmail: parsed.data.attendeeEmail,
    attendeeMessage: parsed.data.attendeeMessage,
  });

  if (!result.success) {
    const errorMessage = result.error.issues[0]?.message ?? "Invalid input";
    logger.debug({ issues: result.error.issues }, "booking.schema_validation_failed");
    return { status: "error", error: errorMessage };
  }

  try {
    const appointment = await createAppointment(result.data);
    const emailResult = await sendConfirmationEmail(appointment);

    const successState: BookingActionState = {
      status: "success",
      appointmentId: appointment.id,
      emailSent: emailResult.sent,
    };
    if (emailResult.warning) {
      successState.emailWarning = emailResult.warning;
    }
    return successState;
  } catch (error) {
    if (error instanceof SchedulingError) {
      return { status: "error", error: error.message };
    }

    logger.error(
      {
        error,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        eventTypeId: result.data.eventTypeId,
        startTime: result.data.startTime,
      },
      "booking.create_failed",
    );
    return { status: "error", error: "Failed to create booking. Please try again." };
  }
}

export async function getAvailableSlotsAction(eventTypeId: string): Promise<SlotsResult> {
  try {
    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 14); // 2 week window

    const slots = await getAvailableSlots({
      eventTypeId,
      startDate,
      endDate,
    });

    return {
      ok: true,
      slots: slots.map((slot) => ({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof SchedulingError) {
      return { ok: false, error: error.message };
    }

    logger.error(
      {
        eventTypeId,
        error,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      },
      "slots.fetch_failed",
    );
    return { ok: false, error: "Failed to load available slots" };
  }
}
