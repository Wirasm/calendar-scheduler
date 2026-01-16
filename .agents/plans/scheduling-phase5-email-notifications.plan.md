# Feature: Email Notifications (Phase 5)

## Summary
Add Resend email integration to send booking confirmation emails to both the consultant and the attendee when an appointment is booked. This phase establishes the email infrastructure that will also be used for reminder emails (Phase 7) and cancellation notifications (Phase 6).

## User Story
As a **lead booking an appointment**
I want to **receive an email confirmation with meeting details**
So that **I have a record of the booking and know when/how to join**

As a **consultant receiving bookings**
I want to **be notified via email when someone books with me**
So that **I'm aware of new appointments without checking the dashboard**

## Problem Statement
When a lead books an appointment, there's no automated communication - neither party receives confirmation of the booking details, leading to uncertainty and potential no-shows.

## Solution Statement
Integrate Resend email API to send confirmation emails on appointment creation. Emails include booking details (date, time, attendee info, any message). The implementation creates a reusable notifications infrastructure for future reminder and cancellation emails.

## Metadata
| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | scheduling feature, core/config, core/notifications (new) |
| Dependencies | resend (npm package, new), existing scheduling types/schemas |
| Estimated Tasks | 10 |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │  Lead fills │ ──────► │  Appointment│ ──────► │ Confirmation│            ║
║   │ booking form│         │  created in │         │ page shown  │            ║
║   └─────────────┘         │   database  │         └─────────────┘            ║
║                           └─────────────┘                                     ║
║                                                                               ║
║   USER_FLOW: Lead submits form → DB insert → Success page displayed           ║
║   PAIN_POINT: No email confirmation - lead has no record, consultant unaware  ║
║   DATA_FLOW: Form → API → Database → UI Response                              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │  Lead fills │ ──────► │  Appointment│ ──────► │ Confirmation│            ║
║   │ booking form│         │  created in │         │ page shown  │            ║
║   └─────────────┘         │   database  │         └─────────────┘            ║
║                           └─────────────┘                                     ║
║                                   │                                           ║
║                                   ▼                                           ║
║                          ┌─────────────────────────────────────┐              ║
║                          │      NOTIFICATION SERVICE           │              ║
║                          │                                     │              ║
║                          │  ┌─────────┐      ┌─────────┐      │              ║
║                          │  │ Email to│      │ Email to│      │              ║
║                          │  │ Attendee│      │Consultant│     │              ║
║                          │  └─────────┘      └─────────┘      │              ║
║                          └─────────────────────────────────────┘              ║
║                                                                               ║
║   USER_FLOW: Lead submits → DB insert → Emails sent → Success page            ║
║   VALUE_ADD: Both parties have email record with all booking details          ║
║   DATA_FLOW: Form → API → Database → Notifications → Resend API → Inboxes     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Booking completion | DB insert only | DB insert + 2 emails | Lead receives confirmation with details |
| Consultant experience | Must check dashboard | Gets email notification | Aware of bookings immediately |
| Booking record | Only in database | Database + email copies | Both parties have documentation |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/features/projects/service.ts` | 1-62 | Service layer pattern with logging to MIRROR |
| P0 | `src/features/scheduling/models.ts` | 1-15 | Types to IMPORT (Appointment, EventType) |
| P0 | `src/features/scheduling/schemas.ts` | 88-97 | CreateAppointmentSchema for email data shape |
| P0 | `src/core/database/schema.ts` | 116-133 | Appointment table structure (attendee fields, timestamps) |
| P0 | `src/core/config/env.ts` | 1-45 | Env var pattern for RESEND_API_KEY |
| P1 | `src/features/projects/errors.ts` | 1-40 | Error class pattern to FOLLOW |
| P1 | `src/features/projects/tests/service.test.ts` | 1-50 | Test mocking pattern to FOLLOW |
| P2 | `src/core/logging/index.ts` | 30-46 | getLogger pattern for notifications.service |

**External Documentation:**
| Source | Section | Why Needed |
|--------|---------|------------|
| [Resend Next.js Docs](https://resend.com/docs/send-with-nextjs) | Full guide | Core integration pattern |
| [Resend SDK Repo](https://github.com/resend/resend-node) | TypeScript types | Response/error types |

---

## Patterns to Mirror

**NAMING_CONVENTION:**
```typescript
// SOURCE: src/features/projects/service.ts:8
// COPY THIS PATTERN:
const logger = getLogger("projects.service");
// For notifications:
const logger = getLogger("notifications.service");
```

**ERROR_HANDLING:**
```typescript
// SOURCE: src/features/projects/errors.ts:12-28
// COPY THIS PATTERN:
export class ProjectError extends Error {
  readonly code: ProjectErrorCode;
  readonly statusCode: HttpStatusCode;

  constructor(message: string, code: ProjectErrorCode, statusCode: HttpStatusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ProjectNotFoundError extends ProjectError {
  constructor(identifier: string) {
    super(`Project not found: ${identifier}`, "PROJECT_NOT_FOUND", 404);
  }
}
```

**LOGGING_PATTERN:**
```typescript
// SOURCE: src/features/projects/service.ts:47-61
// COPY THIS PATTERN:
export async function createProject(input: CreateProjectInput, ownerId: string): Promise<Project> {
  logger.info({ ownerId, name: input.name }, "project.create_started");
  // ... logic ...
  logger.info({ projectId: project.id, slug }, "project.create_completed");
  return project;
}

// For notifications:
export async function sendBookingConfirmation(appointment: Appointment, eventType: EventType, consultantEmail: string): Promise<void> {
  logger.info({ appointmentId: appointment.id }, "notification.booking_confirmation_started");
  // ... send emails ...
  logger.info({ appointmentId: appointment.id }, "notification.booking_confirmation_completed");
}
```

**ENV_VAR_PATTERN:**
```typescript
// SOURCE: src/core/config/env.ts:1-10
// COPY THIS PATTERN:
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Add to env object:
export const env = {
  // ... existing ...
  RESEND_API_KEY: getRequiredEnv("RESEND_API_KEY"),
} as const;
```

**TEST_STRUCTURE:**
```typescript
// SOURCE: src/features/projects/tests/service.test.ts:1-35
// COPY THIS PATTERN:
import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockResend = {
  emails: {
    send: mock<(payload: unknown) => Promise<{ data: { id: string } | null; error: Error | null }>>(() =>
      Promise.resolve({ data: { id: "email_123" }, error: null })
    ),
  },
};

// Mock resend before importing service
mock.module("resend", () => ({ Resend: () => mockResend }));

const { sendBookingConfirmation } = await import("../service");
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/core/config/env.ts` | UPDATE | Add RESEND_API_KEY env var |
| `.env.example` | UPDATE | Document RESEND_API_KEY |
| `src/core/notifications/client.ts` | CREATE | Resend client singleton |
| `src/core/notifications/index.ts` | CREATE | Public exports |
| `src/features/notifications/errors.ts` | CREATE | Email-specific errors |
| `src/features/notifications/schemas.ts` | CREATE | Email payload validation schemas |
| `src/features/notifications/templates.ts` | CREATE | Email content generators |
| `src/features/notifications/service.ts` | CREATE | Email sending business logic |
| `src/features/notifications/index.ts` | CREATE | Public API exports |
| `src/features/notifications/tests/service.test.ts` | CREATE | Unit tests for email service |
| `package.json` | UPDATE | Add resend dependency (via bun add) |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:
- **React Email templates** - Use plain HTML strings; React Email adds complexity without MVP value
- **Email webhooks** - Not tracking delivery/opens/bounces in Phase 5 (can add later)
- **Email queue/retry** - Resend handles delivery; failures logged but not retried in-app
- **HTML email styling** - Basic inline CSS only; no email CSS framework
- **Unsubscribe handling** - Not applicable for transactional booking confirmations
- **Reminder emails** - Deferred to Phase 7 (different trigger mechanism)
- **Cancellation emails** - Deferred to Phase 6 (cancel flow not built yet)

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: ADD resend dependency

- **ACTION**: Install resend npm package
- **IMPLEMENT**: Run `bun add resend`
- **GOTCHA**: Resend has TypeScript types built-in, no @types needed
- **VALIDATE**: `bun run lint && npx tsc --noEmit` - should compile

### Task 2: UPDATE `src/core/config/env.ts`

- **ACTION**: Add RESEND_API_KEY to environment configuration
- **IMPLEMENT**:
  ```typescript
  export const env = {
    // ... existing entries ...

    // Email config (required for notifications)
    RESEND_API_KEY: getRequiredEnv("RESEND_API_KEY"),
  } as const;
  ```
- **MIRROR**: `src/core/config/env.ts:30-42` - follow existing pattern
- **GOTCHA**: No NEXT_PUBLIC prefix - this is server-side only
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: UPDATE `.env.example`

- **ACTION**: Document RESEND_API_KEY environment variable
- **IMPLEMENT**: Add section after Database Configuration:
  ```
  # =============================================================================
  # Email Configuration (Resend)
  # =============================================================================
  # Get your API key from https://resend.com/api-keys

  RESEND_API_KEY=re_xxxxxxxxxxxx
  ```
- **MIRROR**: `.env.example:21-33` - follow existing section format
- **VALIDATE**: File syntax (manual check)

### Task 4: CREATE `src/core/notifications/client.ts`

- **ACTION**: Create Resend client singleton
- **IMPLEMENT**:
  ```typescript
  import { Resend } from "resend";
  import { env } from "@/core/config/env";

  /**
   * Singleton Resend client instance.
   * Initialized lazily on first use.
   */
  let resendClient: Resend | null = null;

  export function getResendClient(): Resend {
    if (!resendClient) {
      resendClient = new Resend(env.RESEND_API_KEY);
    }
    return resendClient;
  }
  ```
- **MIRROR**: Singleton pattern similar to how db client works in `src/core/database/client.ts`
- **IMPORTS**: `import { Resend } from "resend"`, `import { env } from "@/core/config/env"`
- **GOTCHA**: Lazy initialization allows app to start without key in dev (fails at send time, not import time)
- **VALIDATE**: `npx tsc --noEmit`

### Task 5: CREATE `src/core/notifications/index.ts`

- **ACTION**: Create public exports for core notifications module
- **IMPLEMENT**:
  ```typescript
  export { getResendClient } from "./client";
  ```
- **MIRROR**: `src/core/logging/index.ts` - minimal public exports
- **VALIDATE**: `npx tsc --noEmit`

### Task 6: CREATE `src/features/notifications/errors.ts`

- **ACTION**: Create notification-specific error classes
- **IMPLEMENT**:
  ```typescript
  import type { HttpStatusCode } from "@/core/api/errors";

  /** Known error codes for notification operations. */
  export type NotificationErrorCode =
    | "EMAIL_SEND_FAILED"
    | "INVALID_RECIPIENT_EMAIL"
    | "EMAIL_TEMPLATE_ERROR";

  /**
   * Base error for notification-related errors.
   */
  export class NotificationError extends Error {
    readonly code: NotificationErrorCode;
    readonly statusCode: HttpStatusCode;

    constructor(message: string, code: NotificationErrorCode, statusCode: HttpStatusCode) {
      super(message);
      this.name = this.constructor.name;
      this.code = code;
      this.statusCode = statusCode;
    }
  }

  /** Thrown when email sending fails via Resend API. */
  export class EmailSendFailedError extends NotificationError {
    constructor(recipient: string, reason?: string) {
      const message = reason
        ? `Failed to send email to ${recipient}: ${reason}`
        : `Failed to send email to ${recipient}`;
      super(message, "EMAIL_SEND_FAILED", 500);
    }
  }

  /** Thrown when recipient email is invalid. */
  export class InvalidRecipientEmailError extends NotificationError {
    constructor(email: string) {
      super(`Invalid recipient email: ${email}`, "INVALID_RECIPIENT_EMAIL", 400);
    }
  }

  /** Thrown when email template generation fails. */
  export class EmailTemplateError extends NotificationError {
    constructor(templateName: string, reason?: string) {
      const message = reason
        ? `Failed to generate email template '${templateName}': ${reason}`
        : `Failed to generate email template '${templateName}'`;
      super(message, "EMAIL_TEMPLATE_ERROR", 500);
    }
  }
  ```
- **MIRROR**: `src/features/scheduling/errors.ts:1-36` - exact pattern
- **IMPORTS**: `import type { HttpStatusCode } from "@/core/api/errors"`
- **VALIDATE**: `npx tsc --noEmit`

### Task 7: CREATE `src/features/notifications/schemas.ts`

- **ACTION**: Create Zod schemas for email payloads
- **IMPLEMENT**:
  ```typescript
  import { z } from "zod/v4";

  /**
   * Schema for booking confirmation email data.
   */
  export const BookingConfirmationEmailSchema = z.object({
    appointmentId: z.string().uuid(),
    eventTypeName: z.string(),
    startTime: z.date(),
    endTime: z.date(),
    attendeeName: z.string(),
    attendeeEmail: z.string().email(),
    attendeeMessage: z.string().nullable(),
    consultantName: z.string(),
    consultantEmail: z.string().email(),
  });

  export type BookingConfirmationEmailData = z.infer<typeof BookingConfirmationEmailSchema>;

  /**
   * Schema for Resend email send response.
   */
  export const EmailSendResultSchema = z.object({
    id: z.string(),
  });

  export type EmailSendResult = z.infer<typeof EmailSendResultSchema>;
  ```
- **MIRROR**: `src/features/scheduling/schemas.ts:1-10` - Zod v4 import pattern
- **IMPORTS**: `import { z } from "zod/v4"` (NOT from "zod")
- **GOTCHA**: Use `zod/v4` import path per CLAUDE.md
- **VALIDATE**: `npx tsc --noEmit`

### Task 8: CREATE `src/features/notifications/templates.ts`

- **ACTION**: Create email content generation functions
- **IMPLEMENT**:
  ```typescript
  import type { BookingConfirmationEmailData } from "./schemas";

  /**
   * Format a date for display in emails.
   * Uses locale-aware formatting with timezone.
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
   * Get human-readable duration text.
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
  ```
- **GOTCHA**: HTML escaping is critical - attendee name/message are user input
- **GOTCHA**: No React Email - plain HTML is simpler and sufficient for MVP
- **VALIDATE**: `npx tsc --noEmit`

### Task 9: CREATE `src/features/notifications/service.ts`

- **ACTION**: Create email sending business logic
- **IMPLEMENT**:
  ```typescript
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

    logger.info(
      { appointmentId: data.appointmentId },
      "notification.booking_confirmation_completed",
    );

    return {
      attendeeEmailId: attendeeResult.data?.id ?? "",
      consultantEmailId: consultantResult.data?.id ?? "",
    };
  }
  ```
- **MIRROR**: `src/features/projects/service.ts:47-61` - logging pattern
- **IMPORTS**: See code above
- **GOTCHA**: Use `onboarding@resend.dev` as sender until domain is verified
- **GOTCHA**: Handle both success and error cases from Resend API
- **VALIDATE**: `npx tsc --noEmit`

### Task 10: CREATE `src/features/notifications/index.ts`

- **ACTION**: Create public API exports for notifications feature
- **IMPLEMENT**:
  ```typescript
  // Export types and schemas
  export type { BookingConfirmationEmailData, EmailSendResult } from "./schemas";
  export { BookingConfirmationEmailSchema } from "./schemas";

  // Export errors
  export { EmailSendFailedError, InvalidRecipientEmailError, EmailTemplateError } from "./errors";
  export type { NotificationErrorCode } from "./errors";

  // Export service functions
  export { sendBookingConfirmation } from "./service";
  ```
- **MIRROR**: `src/features/projects/index.ts:1-23` - export pattern
- **GOTCHA**: Hide templates (internal), expose only public API
- **VALIDATE**: `npx tsc --noEmit`

### Task 11: CREATE `src/features/notifications/tests/service.test.ts`

- **ACTION**: Create unit tests for notification service
- **IMPLEMENT**:
  ```typescript
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
  });
  ```
- **MIRROR**: `src/features/projects/tests/service.test.ts:1-50` - mock pattern
- **IMPORTS**: `import { beforeEach, describe, expect, it, mock } from "bun:test"`
- **GOTCHA**: Mock module BEFORE importing service
- **GOTCHA**: Test XSS prevention (HTML escaping)
- **VALIDATE**: `bun test src/features/notifications/tests/`

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `src/features/notifications/tests/service.test.ts` | 8 cases (send success, recipients, subjects, failures, XSS) | Email sending logic |
| `src/features/notifications/tests/errors.test.ts` | Error properties (code, statusCode, message) | Error classes |
| `src/features/notifications/tests/templates.test.ts` | HTML generation, escaping, date formatting | Template functions |

### Edge Cases Checklist

- [x] Empty attendee message (null)
- [x] HTML injection in attendee name
- [x] HTML injection in attendee message
- [x] Resend API error on first email (attendee)
- [x] Resend API error on second email (consultant)
- [ ] Very long attendee message (1000 chars - schema limit)
- [ ] Unicode characters in names
- [ ] Different timezone displays

---

## Validation Commands

### Level 1: STATIC_ANALYSIS
```bash
bun run lint && npx tsc --noEmit
```
**EXPECT**: Exit 0, no errors or warnings

### Level 2: UNIT_TESTS
```bash
bun test src/features/notifications/tests/
```
**EXPECT**: All tests pass

### Level 3: FULL_SUITE
```bash
bun test && bun run build
```
**EXPECT**: All tests pass, build succeeds

### Level 4: MANUAL_VERIFICATION
After adding RESEND_API_KEY to .env:
1. Create a test booking (requires Phase 4 booking page)
2. Verify both emails received
3. Check email content renders correctly

---

## Acceptance Criteria

- [ ] `bun add resend` completes successfully
- [ ] `RESEND_API_KEY` env var documented and validated
- [ ] `sendBookingConfirmation` function exists and is exported
- [ ] Function sends two emails (attendee + consultant)
- [ ] Emails contain booking details (time, duration, names)
- [ ] HTML escaping prevents XSS
- [ ] Errors are thrown with proper codes on API failures
- [ ] All unit tests pass
- [ ] Level 1-3 validation commands pass

---

## Completion Checklist

- [ ] Task 1: `bun add resend` - dependency installed
- [ ] Task 2: `env.ts` updated with RESEND_API_KEY
- [ ] Task 3: `.env.example` updated with documentation
- [ ] Task 4: `core/notifications/client.ts` created
- [ ] Task 5: `core/notifications/index.ts` created
- [ ] Task 6: `notifications/errors.ts` created
- [ ] Task 7: `notifications/schemas.ts` created
- [ ] Task 8: `notifications/templates.ts` created
- [ ] Task 9: `notifications/service.ts` created
- [ ] Task 10: `notifications/index.ts` created
- [ ] Task 11: `notifications/tests/service.test.ts` created
- [ ] Level 1: `bun run lint && npx tsc --noEmit` passes
- [ ] Level 2: `bun test src/features/notifications/tests/` passes
- [ ] Level 3: `bun test && bun run build` succeeds
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Resend API rate limits | LOW | MEDIUM | Use default test domain initially; production domain later |
| Email deliverability | LOW | MEDIUM | Resend handles this; verify domain for production |
| Missing consultant email | MEDIUM | HIGH | Will need user lookup - Phase 4 integration provides this |
| Test emails sent to real addresses | LOW | LOW | Use Resend test mode / mock in tests |

---

## Integration Notes for Phase 4

When Phase 4 (Public Booking Page) implements appointment creation:

```typescript
// In appointment creation flow (Phase 4)
import { sendBookingConfirmation } from "@/features/notifications";
import type { BookingConfirmationEmailData } from "@/features/notifications";

// After creating appointment in database:
const emailData: BookingConfirmationEmailData = {
  appointmentId: appointment.id,
  eventTypeName: eventType.name,
  startTime: appointment.startTime,
  endTime: appointment.endTime,
  attendeeName: appointment.attendeeName,
  attendeeEmail: appointment.attendeeEmail,
  attendeeMessage: appointment.attendeeMessage,
  consultantName: user.displayName ?? user.email, // from users table
  consultantEmail: user.email,
};

// Send emails (fire-and-forget or await based on UX decision)
await sendBookingConfirmation(emailData);
```

This integration happens in Phase 4 when the booking form submission handler is implemented.

---

## Notes

- **Resend test domain**: Using `onboarding@resend.dev` as sender works for testing without domain verification. Production should verify a custom domain.
- **No React Email**: Keeping templates as plain HTML strings reduces complexity. React Email can be added later if needed.
- **Timezone handling**: Currently using `toLocaleString` which uses server timezone. When Phase 4 implements timezone selection, templates will need updating.
- **Email queue**: Not implementing retry/queue logic - Resend handles delivery. If this becomes an issue, consider adding a job queue in future.
