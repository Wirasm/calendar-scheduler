import { getLogger } from "@/core/logging";
import { getResendClient } from "@/core/notifications";

import { EmailSendFailedError } from "./errors";
import type { BookingConfirmationEmailData } from "./schemas";
import {
  getAttendeeConfirmationHtml,
  getAttendeeConfirmationSubject,
  getConsultantNotificationHtml,
  getConsultantNotificationSubject,
} from "./templates";

const logger = getLogger("notifications.service");

/** Default sender address - uses Resend's test domain initially. */
const DEFAULT_FROM = "Scheduling <onboarding@resend.dev>";

/**
 * Send booking confirmation emails to both attendee and consultant.
 *
 * Sends two emails:
 * 1. Confirmation to the attendee with booking details
 * 2. Notification to the consultant about the new booking
 *
 * @throws EmailSendFailedError if either email fails to send
 */
export async function sendBookingConfirmation(
  data: BookingConfirmationEmailData,
): Promise<{ attendeeEmailId: string; consultantEmailId: string }> {
  logger.info(
    { appointmentId: data.appointmentId, attendeeEmail: data.attendeeEmail },
    "notification.booking_confirmation_started",
  );

  const resend = getResendClient();

  // Send confirmation to attendee
  const attendeeResult = await resend.emails.send({
    from: DEFAULT_FROM,
    to: [data.attendeeEmail],
    subject: getAttendeeConfirmationSubject(data),
    html: getAttendeeConfirmationHtml(data),
  });

  if (attendeeResult.error) {
    logger.error(
      { appointmentId: data.appointmentId, error: attendeeResult.error, recipient: "attendee" },
      "notification.booking_confirmation_failed",
    );
    throw new EmailSendFailedError(data.attendeeEmail, attendeeResult.error.message);
  }

  logger.info(
    { appointmentId: data.appointmentId, emailId: attendeeResult.data?.id },
    "notification.attendee_email_sent",
  );

  // Send notification to consultant
  const consultantResult = await resend.emails.send({
    from: DEFAULT_FROM,
    to: [data.consultantEmail],
    subject: getConsultantNotificationSubject(data),
    html: getConsultantNotificationHtml(data),
  });

  if (consultantResult.error) {
    logger.error(
      { appointmentId: data.appointmentId, error: consultantResult.error, recipient: "consultant" },
      "notification.booking_confirmation_failed",
    );
    throw new EmailSendFailedError(data.consultantEmail, consultantResult.error.message);
  }

  logger.info(
    { appointmentId: data.appointmentId, emailId: consultantResult.data?.id },
    "notification.consultant_email_sent",
  );

  logger.info({ appointmentId: data.appointmentId }, "notification.booking_confirmation_completed");

  return {
    attendeeEmailId: attendeeResult.data?.id ?? "",
    consultantEmailId: consultantResult.data?.id ?? "",
  };
}
