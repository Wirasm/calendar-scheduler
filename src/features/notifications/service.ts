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

/** Default sender address. Replace with verified domain in production via env.FROM_EMAIL. */
const DEFAULT_FROM = "Scheduling <onboarding@resend.dev>";

/** Type for Resend email send response. */
type ResendEmailResult = {
  data: { id: string } | null;
  error: { message: string; name: string } | null;
};

/**
 * Send booking confirmation emails to both attendee and consultant.
 *
 * Sends two emails sequentially:
 * 1. Confirmation to the attendee with booking details
 * 2. Notification to the consultant about the new booking
 *
 * @param data - Booking details including attendee and consultant information
 * @returns Email IDs for both sent emails
 * @throws EmailSendFailedError if either email fails to send or network error occurs
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
  let attendeeResult: ResendEmailResult;
  try {
    attendeeResult = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [data.attendeeEmail],
      subject: getAttendeeConfirmationSubject(data),
      html: getAttendeeConfirmationHtml(data),
    });
  } catch (error) {
    logger.error(
      { appointmentId: data.appointmentId, error, recipient: "attendee" },
      "notification.send_exception",
    );
    throw new EmailSendFailedError(
      data.attendeeEmail,
      error instanceof Error ? error.message : "Network error connecting to email service",
    );
  }

  if (attendeeResult.error) {
    logger.error(
      { appointmentId: data.appointmentId, error: attendeeResult.error, recipient: "attendee" },
      "notification.booking_confirmation_failed",
    );
    throw new EmailSendFailedError(data.attendeeEmail, attendeeResult.error.message);
  }

  if (!attendeeResult.data?.id) {
    logger.error(
      { appointmentId: data.appointmentId, response: attendeeResult, recipient: "attendee" },
      "notification.missing_email_id",
    );
    throw new EmailSendFailedError(
      data.attendeeEmail,
      "Email service returned success but no email ID",
    );
  }

  const attendeeEmailId = attendeeResult.data.id;

  logger.info(
    { appointmentId: data.appointmentId, emailId: attendeeEmailId },
    "notification.attendee_email_sent",
  );

  // Send notification to consultant
  let consultantResult: ResendEmailResult;
  try {
    consultantResult = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [data.consultantEmail],
      subject: getConsultantNotificationSubject(data),
      html: getConsultantNotificationHtml(data),
    });
  } catch (error) {
    logger.error(
      {
        appointmentId: data.appointmentId,
        error,
        recipient: "consultant",
        attendeeEmailSucceeded: true,
        attendeeEmailId,
      },
      "notification.send_exception",
    );
    throw new EmailSendFailedError(
      data.consultantEmail,
      error instanceof Error ? error.message : "Network error connecting to email service",
    );
  }

  if (consultantResult.error) {
    logger.error(
      {
        appointmentId: data.appointmentId,
        error: consultantResult.error,
        recipient: "consultant",
        attendeeEmailSucceeded: true,
        attendeeEmailId,
      },
      "notification.booking_confirmation_partial_failure",
    );
    throw new EmailSendFailedError(data.consultantEmail, consultantResult.error.message);
  }

  if (!consultantResult.data?.id) {
    logger.error(
      {
        appointmentId: data.appointmentId,
        response: consultantResult,
        recipient: "consultant",
        attendeeEmailSucceeded: true,
        attendeeEmailId,
      },
      "notification.missing_email_id",
    );
    throw new EmailSendFailedError(
      data.consultantEmail,
      "Email service returned success but no email ID",
    );
  }

  const consultantEmailId = consultantResult.data.id;

  logger.info(
    { appointmentId: data.appointmentId, emailId: consultantEmailId },
    "notification.consultant_email_sent",
  );

  logger.info({ appointmentId: data.appointmentId }, "notification.booking_confirmation_completed");

  return {
    attendeeEmailId,
    consultantEmailId,
  };
}
