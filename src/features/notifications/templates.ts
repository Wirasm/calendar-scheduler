import type { BookingConfirmationEmailData } from "./schemas";

/**
 * Format a date for display in emails using en-US locale.
 * Includes weekday, full date, time, and timezone abbreviation.
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] ?? char);
}

/**
 * Convert time range to human-readable duration (e.g., "30 minutes", "1 hour 15 minutes").
 * Rounds to the nearest minute.
 */
function getDurationText(start: Date, end: Date): string {
  const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} minutes`;
}

/**
 * Generate subject line for booking confirmation to attendee.
 */
export function getAttendeeConfirmationSubject(data: BookingConfirmationEmailData): string {
  return `Booking Confirmed: ${data.eventTypeName} with ${data.consultantName}`;
}

/**
 * Generate HTML body for booking confirmation to attendee.
 */
export function getAttendeeConfirmationHtml(data: BookingConfirmationEmailData): string {
  const messageSection = data.attendeeMessage
    ? `<p><strong>Your message:</strong><br>${escapeHtml(data.attendeeMessage)}</p>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #111; font-size: 24px; margin-bottom: 24px;">Booking Confirmed</h1>

  <p>Hi ${escapeHtml(data.attendeeName)},</p>

  <p>Your appointment has been confirmed with the following details:</p>

  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0 0 8px 0;"><strong>Meeting:</strong> ${escapeHtml(data.eventTypeName)}</p>
    <p style="margin: 0 0 8px 0;"><strong>When:</strong> ${formatDateTime(data.startTime)}</p>
    <p style="margin: 0 0 8px 0;"><strong>Duration:</strong> ${getDurationText(data.startTime, data.endTime)}</p>
    <p style="margin: 0;"><strong>With:</strong> ${escapeHtml(data.consultantName)}</p>
  </div>

  ${messageSection}

  <p>You'll receive any meeting link or additional instructions from ${escapeHtml(data.consultantName)} separately.</p>

  <p style="color: #666; font-size: 14px; margin-top: 32px;">
    If you need to cancel or reschedule, please contact ${escapeHtml(data.consultantName)} at ${escapeHtml(data.consultantEmail)}.
  </p>
</body>
</html>
  `.trim();
}

/**
 * Generate subject line for booking notification to consultant.
 */
export function getConsultantNotificationSubject(data: BookingConfirmationEmailData): string {
  return `New Booking: ${data.attendeeName} - ${data.eventTypeName}`;
}

/**
 * Generate HTML body for booking notification to consultant.
 */
export function getConsultantNotificationHtml(data: BookingConfirmationEmailData): string {
  const messageSection = data.attendeeMessage
    ? `<p><strong>Message from attendee:</strong><br>${escapeHtml(data.attendeeMessage)}</p>`
    : "<p><em>No message provided.</em></p>";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Booking</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #111; font-size: 24px; margin-bottom: 24px;">New Booking Received</h1>

  <p>You have a new appointment booked:</p>

  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0 0 8px 0;"><strong>Meeting:</strong> ${escapeHtml(data.eventTypeName)}</p>
    <p style="margin: 0 0 8px 0;"><strong>When:</strong> ${formatDateTime(data.startTime)}</p>
    <p style="margin: 0 0 8px 0;"><strong>Duration:</strong> ${getDurationText(data.startTime, data.endTime)}</p>
    <p style="margin: 0 0 8px 0;"><strong>Attendee:</strong> ${escapeHtml(data.attendeeName)}</p>
    <p style="margin: 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(data.attendeeEmail)}">${escapeHtml(data.attendeeEmail)}</a></p>
  </div>

  ${messageSection}

  <p style="color: #666; font-size: 14px; margin-top: 32px;">
    Remember to send meeting details (video link, location, etc.) to your attendee.
  </p>
</body>
</html>
  `.trim();
}
