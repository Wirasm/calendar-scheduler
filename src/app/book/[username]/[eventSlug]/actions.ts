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
  SchedulingError,
} from "@/features/scheduling";
import * as repository from "@/features/scheduling/repository";

const logger = getLogger("booking.actions");

export interface BookingActionState {
  error?: string;
  success?: boolean;
  appointmentId?: string;
}

interface ParsedFormData {
  eventTypeId: string;
  startTimeStr: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeMessage: string | undefined;
}

type ParseResult = { ok: true; data: ParsedFormData } | { ok: false; error: string };

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

async function sendConfirmationEmail(
  appointment: Awaited<ReturnType<typeof createAppointment>>,
): Promise<void> {
  const eventType = await repository.findEventTypeById(appointment.eventTypeId);
  const consultant = await repository.findUserById(appointment.userId);

  if (!eventType || !consultant) {
    return;
  }

  const emailData: BookingConfirmationEmailData = {
    appointmentId: appointment.id,
    eventTypeName: eventType.name,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    attendeeName: appointment.attendeeName,
    attendeeEmail: appointment.attendeeEmail,
    attendeeMessage: appointment.attendeeMessage,
    consultantName: consultant.displayName ?? consultant.email,
    consultantEmail: consultant.email,
  };

  try {
    await sendBookingConfirmation(emailData);
  } catch (emailError) {
    logger.error({ appointmentId: appointment.id, error: emailError }, "booking.email_failed");
  }
}

export async function createBookingAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const parsed = parseFormData(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const result = CreateAppointmentSchema.safeParse({
    eventTypeId: parsed.data.eventTypeId,
    startTime: new Date(parsed.data.startTimeStr),
    attendeeName: parsed.data.attendeeName,
    attendeeEmail: parsed.data.attendeeEmail,
    attendeeMessage: parsed.data.attendeeMessage,
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const appointment = await createAppointment(result.data);
    await sendConfirmationEmail(appointment);
    return { success: true, appointmentId: appointment.id };
  } catch (error) {
    if (error instanceof SchedulingError) {
      return { error: error.message };
    }
    logger.error({ error }, "booking.create_failed");
    return { error: "Failed to create booking. Please try again." };
  }
}

interface SlotsResult {
  slots: Array<{ startTime: string; endTime: string }>;
  error?: string;
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

    // Serialize dates for client transport
    return {
      slots: slots.map((slot) => ({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof SchedulingError) {
      return { slots: [], error: error.message };
    }
    logger.error({ eventTypeId, error }, "slots.fetch_failed");
    return { slots: [], error: "Failed to load available slots" };
  }
}
