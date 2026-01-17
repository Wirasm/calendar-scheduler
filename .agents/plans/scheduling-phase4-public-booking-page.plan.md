# Feature: Public Booking Page (Phase 4)

## Summary

Build a public-facing booking page at `/book/[username]/[eventSlug]` where leads can view available time slots and book appointments without authentication. The page will display a calendar view of available days, time slot picker for selected day, and a booking form. Upon submission, it creates an appointment in the database and sends confirmation emails to both the attendee and consultant.

## User Story

As a **lead (potential client)**
I want to **see available time slots and book a meeting directly**
So that **I can secure a consultation without back-and-forth emails**

## Problem Statement

Currently, there is no public interface for leads to book appointments. The scheduling infrastructure (slot generation, validation, notifications) exists from Phases 1-3 and 5, but there's no user-facing page to expose this functionality. Leads have no way to self-serve book meetings.

## Solution Statement

Create a public Next.js route at `/book/[username]/[eventSlug]` that:
1. Fetches available slots using existing `getAvailableSlots` service
2. Displays slots in a calendar + time picker UI
3. Collects booking details via a form (name, email, optional message)
4. Creates an appointment using new `createAppointment` service function
5. Sends confirmation emails via existing `sendBookingConfirmation`
6. Shows confirmation page with booking details

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | scheduling feature, notifications feature, app router |
| Dependencies | `@/features/scheduling`, `@/features/notifications`, existing UI components |
| Estimated Tasks | 10 |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────┐         ┌─────────────────┐         ┌───────────────┐   ║
║   │  Lead receives  │ ──────► │  Email exchange │ ──────► │  Manual       │   ║
║   │  booking link   │         │  to find time   │         │  calendar add │   ║
║   └─────────────────┘         └─────────────────┘         └───────────────┘   ║
║                                                                               ║
║   USER_FLOW:                                                                  ║
║   1. Lead clicks booking link                                                 ║
║   2. No page exists → 404 error                                               ║
║   3. Falls back to email coordination                                         ║
║                                                                               ║
║   PAIN_POINT: No self-serve booking capability exists                         ║
║                                                                               ║
║   DATA_FLOW:                                                                  ║
║   Lead → (nothing) → No appointment created                                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────┐         ┌─────────────────┐         ┌───────────────┐   ║
║   │  /book/jane/    │ ──────► │  Select date &  │ ──────► │  Fill form &  │   ║
║   │  consultation   │         │  time slot      │         │  submit       │   ║
║   └─────────────────┘         └─────────────────┘         └───────────────┘   ║
║                                       │                           │           ║
║                                       │                           ▼           ║
║                               ┌───────▼───────────────────────────────────┐   ║
║                               │  Confirmation page + email to both parties │  ║
║                               └───────────────────────────────────────────┘   ║
║                                                                               ║
║   USER_FLOW:                                                                  ║
║   1. Lead visits /book/[username]/[eventSlug]                                 ║
║   2. Sees consultant info + event type details                                ║
║   3. Browses calendar showing available days (next 2 weeks)                   ║
║   4. Clicks date → sees available time slots for that day                     ║
║   5. Clicks slot → booking form appears                                       ║
║   6. Enters name, email, optional message                                     ║
║   7. Clicks "Book" → appointment created + emails sent                        ║
║   8. Sees confirmation page with booking details                              ║
║                                                                               ║
║   VALUE_ADD: End-to-end self-serve booking in < 2 minutes                     ║
║                                                                               ║
║   DATA_FLOW:                                                                  ║
║   Lead → getAvailableSlots → Select slot → validateSlotAvailable              ║
║       → createAppointment → sendBookingConfirmation → Confirmation page       ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `/book/[username]/[eventSlug]` | 404 | Public booking page | Leads can browse slots |
| Date picker | N/A | Calendar showing available days | Visual day selection |
| Time picker | N/A | Grid of available slots | One-click slot selection |
| Booking form | N/A | Name, email, message fields | Capture attendee details |
| Confirmation | N/A | Success page + emails | Immediate booking feedback |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/features/scheduling/service.ts` | 311-414 | `getAvailableSlots` implementation |
| P0 | `src/features/scheduling/service.ts` | 420-492 | `validateSlotAvailable` implementation |
| P0 | `src/features/scheduling/schemas.ts` | 88-99 | `CreateAppointmentSchema` definition |
| P0 | `src/features/notifications/service.ts` | 35-161 | `sendBookingConfirmation` usage |
| P1 | `src/features/scheduling/repository.ts` | 71-93 | Event type lookup patterns |
| P1 | `src/features/scheduling/errors.ts` | all | All error classes to catch |
| P1 | `src/app/(dashboard)/dashboard/scheduling/availability/actions.ts` | all | Server action patterns |
| P2 | `src/app/(auth)/login/page.tsx` | all | Client form pattern with useActionState |
| P2 | `src/features/scheduling/tests/service.test.ts` | all | Test patterns to follow |

**External Documentation:**

| Source | Section | Why Needed |
|--------|---------|------------|
| Next.js App Router | Dynamic Routes | `[username]/[eventSlug]` pattern |
| React 19 | useActionState | Form submission pattern |

---

## Patterns to Mirror

### NAMING_CONVENTION

```typescript
// SOURCE: src/features/scheduling/service.ts:156-178
// COPY THIS PATTERN for createAppointment:
export async function createAvailabilityWindow(
  input: CreateAvailabilityWindowInput,
  userId: string,
): Promise<AvailabilityWindow> {
  logger.info({ userId, dayOfWeek: input.dayOfWeek }, "availability_window.create_started");
  // ... validation and creation ...
  logger.info({ windowId: window.id }, "availability_window.create_completed");
  return window;
}
```

### ERROR_HANDLING

```typescript
// SOURCE: src/features/scheduling/errors.ts:85-93
// COPY THIS PATTERN:
export class AppointmentSlotUnavailableError extends SchedulingError {
  constructor(startTime: Date) {
    super(
      `Time slot is no longer available: ${startTime.toISOString()}`,
      "APPOINTMENT_SLOT_UNAVAILABLE",
      409,
    );
  }
}
```

### LOGGING_PATTERN

```typescript
// SOURCE: src/features/scheduling/service.ts:311-315
// COPY THIS PATTERN:
logger.info(
  { eventTypeId: input.eventTypeId, startDate: input.startDate, endDate: input.endDate },
  "slots.get_started",
);
// ... then on completion:
logger.info({ eventTypeId, count: slots.length }, "slots.get_completed");
// ... on error:
logger.warn({ eventTypeId }, "slots.event_type_not_found");
```

### REPOSITORY_PATTERN

```typescript
// SOURCE: src/features/scheduling/repository.ts:107-129
// COPY THIS PATTERN for appointment creation:
export async function findAppointmentsByUserAndDateRange(
  userId: string,
  startDate: Date,
  endDate: Date,
  excludeCancelled?: boolean,
): Promise<Appointment[]> {
  const conditions = [
    eq(appointments.userId, userId),
    lte(appointments.startTime, endDate),
    gte(appointments.endTime, startDate),
  ];
  // ...
  return db.select().from(appointments).where(and(...conditions));
}
```

### SERVER_ACTION_PATTERN

```typescript
// SOURCE: src/app/(dashboard)/dashboard/scheduling/availability/actions.ts:51-104
// COPY THIS PATTERN:
export async function createAvailabilityWindowAction(
  _prevState: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // ... validation with Zod ...
  const result = CreateAvailabilityWindowSchema.safeParse({ ... });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await createAvailabilityWindow(result.data, user.id);
    revalidatePath("/dashboard/scheduling/availability");
    return { success: true };
  } catch (error) {
    if (error instanceof SchedulingError) {
      return { error: error.message };
    }
    logger.error({ error }, "action_failed");
    return { error: "Failed to create" };
  }
}
```

### CLIENT_FORM_PATTERN

```typescript
// SOURCE: src/app/(auth)/login/page.tsx:1-65
// COPY THIS PATTERN:
"use client";

import { useActionState } from "react";
import { type LoginState, login } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction}>
      {state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {/* form fields */}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
```

### TEST_STRUCTURE

```typescript
// SOURCE: src/features/scheduling/tests/service.test.ts:1-60
// COPY THIS PATTERN:
import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockRepository = {
  findEventTypeById: mock<(id: string) => Promise<EventType | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  // ... other mocks
};

mock.module("../repository", () => mockRepository);

const { createAppointment } = await import("../service");

describe("createAppointment", () => {
  beforeEach(() => {
    mockRepository.findEventTypeById.mockReset();
    // ... reset other mocks
  });

  it("creates appointment for valid slot", async () => {
    mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
    // ... setup and assertions
  });
});
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/features/scheduling/repository.ts` | UPDATE | Add `createAppointment`, `findUserByEmail` |
| `src/features/scheduling/service.ts` | UPDATE | Add `createAppointment` service function |
| `src/features/scheduling/index.ts` | UPDATE | Export `createAppointment` and `CreateAppointmentInput` |
| `src/app/book/[username]/[eventSlug]/page.tsx` | CREATE | Public booking page (server component) |
| `src/app/book/[username]/[eventSlug]/booking-page-client.tsx` | CREATE | Client component with slot picker |
| `src/app/book/[username]/[eventSlug]/booking-form.tsx` | CREATE | Booking form component |
| `src/app/book/[username]/[eventSlug]/actions.ts` | CREATE | Server actions for booking |
| `src/app/book/[username]/[eventSlug]/confirmation/page.tsx` | CREATE | Confirmation page |
| `src/features/scheduling/tests/service.test.ts` | UPDATE | Add tests for `createAppointment` |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

1. **User lookup by username** - The current schema has `users.email` but not a unique username/slug. For MVP, we'll use `users.id` in the URL or add a simple username field. Decision: Use user ID initially, username feature deferred.

2. **Calendar widget** - No fancy calendar library. Simple date buttons showing available days.

3. **Timezone selection UI** - All times displayed in UTC initially. Timezone conversion deferred.

4. **Reschedule/cancel from public page** - Out of scope for Phase 4 (that's Phase 6).

5. **Multiple event types listing** - Single event type per URL. Event type selection page deferred.

6. **Loading skeletons** - Basic loading states only, no skeleton UI.

---

## Step-by-Step Tasks

### Task 1: ADD appointment repository functions

- **ACTION**: UPDATE `src/features/scheduling/repository.ts`
- **IMPLEMENT**:
  ```typescript
  export async function createAppointment(data: NewAppointment): Promise<Appointment> {
    const results = await db.insert(appointments).values(data).returning();
    const appointment = results[0];
    if (!appointment) {
      throw new SchedulingDatabaseError("create appointment");
    }
    return appointment;
  }

  export async function findUserById(id: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0];
  }
  ```
- **IMPORTS**: Add `import { users } from "@/core/database/schema"` and types
- **MIRROR**: `src/features/scheduling/repository.ts:38-45` - follow existing create pattern
- **GOTCHA**: Use `results[0]` pattern with undefined check for `noUncheckedIndexedAccess`
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: ADD `createAppointment` service function

- **ACTION**: UPDATE `src/features/scheduling/service.ts`
- **IMPLEMENT**:
  ```typescript
  export async function createAppointment(
    input: CreateAppointmentInput,
  ): Promise<Appointment> {
    logger.info({ eventTypeId: input.eventTypeId, startTime: input.startTime }, "appointment.create_started");

    // 1. Validate slot is still available (race condition protection)
    const { eventType, endTime } = await validateSlotAvailable(input.eventTypeId, input.startTime);

    // 2. Create the appointment
    const appointment = await repository.createAppointment({
      eventTypeId: input.eventTypeId,
      userId: eventType.userId,
      startTime: input.startTime,
      endTime,
      attendeeName: input.attendeeName,
      attendeeEmail: input.attendeeEmail,
      attendeeMessage: input.attendeeMessage ?? null,
      status: "confirmed",
    });

    logger.info({ appointmentId: appointment.id }, "appointment.create_completed");
    return appointment;
  }
  ```
- **MIRROR**: `src/features/scheduling/service.ts:156-178` - follow createAvailabilityWindow pattern
- **IMPORTS**: Add `CreateAppointmentInput` type import
- **GOTCHA**: Call `validateSlotAvailable` FIRST to prevent double-booking race conditions
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: UPDATE scheduling index exports

- **ACTION**: UPDATE `src/features/scheduling/index.ts`
- **IMPLEMENT**: Add exports for `createAppointment`, ensure `CreateAppointmentInput` and `CreateAppointmentSchema` are exported
- **MIRROR**: `src/features/scheduling/index.ts:67-75`
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: CREATE public booking page (server component)

- **ACTION**: CREATE `src/app/book/[username]/[eventSlug]/page.tsx`
- **IMPLEMENT**:
  ```typescript
  import { notFound } from "next/navigation";
  import { db } from "@/core/database/client";
  import { eq, and } from "drizzle-orm";
  import { eventTypes, users } from "@/core/database/schema";
  import { BookingPageClient } from "./booking-page-client";

  interface PageProps {
    params: Promise<{ username: string; eventSlug: string }>;
  }

  export default async function BookingPage({ params }: PageProps) {
    const { username, eventSlug } = await params;

    // Find user by ID (username is actually user ID for now)
    const userResults = await db.select().from(users).where(eq(users.id, username)).limit(1);
    const user = userResults[0];
    if (!user) {
      notFound();
    }

    // Find event type by slug and user
    const eventTypeResults = await db
      .select()
      .from(eventTypes)
      .where(and(eq(eventTypes.userId, user.id), eq(eventTypes.slug, eventSlug), eq(eventTypes.isActive, true)))
      .limit(1);
    const eventType = eventTypeResults[0];
    if (!eventType) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <BookingPageClient eventType={eventType} consultant={user} />
        </div>
      </div>
    );
  }
  ```
- **MIRROR**: `src/app/(dashboard)/dashboard/scheduling/availability/page.tsx` - server data fetching pattern
- **GOTCHA**: Use `await params` for Next.js 16 async params
- **VALIDATE**: `npx tsc --noEmit`

### Task 5: CREATE booking page client component

- **ACTION**: CREATE `src/app/book/[username]/[eventSlug]/booking-page-client.tsx`
- **IMPLEMENT**: Client component that:
  1. Calls `getAvailableSlotsAction` to fetch slots for 2-week window
  2. Displays consultant info (name, email)
  3. Shows event type details (name, duration, description)
  4. Renders date picker buttons grouped by available days
  5. Renders time slot grid for selected day
  6. Shows booking form when slot is selected
- **MIRROR**: `src/app/(dashboard)/dashboard/scheduling/availability/page-client.tsx`
- **IMPORTS**: Use `useActionState`, existing UI components
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 6: CREATE booking form component

- **ACTION**: CREATE `src/app/book/[username]/[eventSlug]/booking-form.tsx`
- **IMPLEMENT**:
  ```typescript
  "use client";

  import { useActionState, useEffect } from "react";
  import { useRouter } from "next/navigation";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Textarea } from "@/components/ui/textarea";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { type BookingActionState, createBookingAction } from "./actions";

  interface BookingFormProps {
    eventTypeId: string;
    selectedSlot: { startTime: Date; endTime: Date };
    consultantName: string;
    onCancel: () => void;
  }

  const initialState: BookingActionState = {};

  export function BookingForm({ eventTypeId, selectedSlot, consultantName, onCancel }: BookingFormProps) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(createBookingAction, initialState);

    useEffect(() => {
      if (state.success && state.appointmentId) {
        router.push(`/book/confirmation?id=${state.appointmentId}`);
      }
    }, [state.success, state.appointmentId, router]);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Book with {consultantName}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedSlot.startTime.toLocaleString()} - {selectedSlot.endTime.toLocaleTimeString()}
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="eventTypeId" value={eventTypeId} />
            <input type="hidden" name="startTime" value={selectedSlot.startTime.toISOString()} />

            {state.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="attendeeName">Your Name</Label>
              <Input id="attendeeName" name="attendeeName" required minLength={2} maxLength={100} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="attendeeEmail">Your Email</Label>
              <Input id="attendeeEmail" name="attendeeEmail" type="email" required />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="attendeeMessage">Message (optional)</Label>
              <Textarea id="attendeeMessage" name="attendeeMessage" maxLength={1000} rows={3} />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }
  ```
- **MIRROR**: `src/app/(auth)/login/page.tsx` - useActionState form pattern
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 7: CREATE server actions for booking

- **ACTION**: CREATE `src/app/book/[username]/[eventSlug]/actions.ts`
- **IMPLEMENT**:
  ```typescript
  "use server";

  import { getLogger } from "@/core/logging";
  import {
    createAppointment,
    CreateAppointmentSchema,
    getAvailableSlots,
    SchedulingError,
    type TimeSlot,
  } from "@/features/scheduling";
  import { sendBookingConfirmation, type BookingConfirmationEmailData } from "@/features/notifications";
  import * as repository from "@/features/scheduling/repository"; // Need to expose findUserById

  const logger = getLogger("booking.actions");

  export interface BookingActionState {
    error?: string;
    success?: boolean;
    appointmentId?: string;
  }

  export async function createBookingAction(
    _prevState: BookingActionState,
    formData: FormData,
  ): Promise<BookingActionState> {
    const eventTypeId = formData.get("eventTypeId");
    const startTimeStr = formData.get("startTime");
    const attendeeName = formData.get("attendeeName");
    const attendeeEmail = formData.get("attendeeEmail");
    const attendeeMessage = formData.get("attendeeMessage");

    // Validate required fields
    if (!eventTypeId || typeof eventTypeId !== "string") {
      return { error: "Event type is required" };
    }
    if (!startTimeStr || typeof startTimeStr !== "string") {
      return { error: "Time slot is required" };
    }
    if (!attendeeName || typeof attendeeName !== "string") {
      return { error: "Name is required" };
    }
    if (!attendeeEmail || typeof attendeeEmail !== "string") {
      return { error: "Email is required" };
    }

    const result = CreateAppointmentSchema.safeParse({
      eventTypeId,
      startTime: new Date(startTimeStr),
      attendeeName,
      attendeeEmail,
      attendeeMessage: attendeeMessage ? String(attendeeMessage) : undefined,
    });

    if (!result.success) {
      return { error: result.error.issues[0]?.message ?? "Invalid input" };
    }

    try {
      // Create appointment (validates slot, prevents double-booking)
      const appointment = await createAppointment(result.data);

      // Fetch event type and consultant for email
      const eventType = await repository.findEventTypeById(appointment.eventTypeId);
      const consultant = await repository.findUserById(appointment.userId);

      if (eventType && consultant) {
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
          // Log but don't fail the booking if email fails
          logger.error({ appointmentId: appointment.id, error: emailError }, "booking.email_failed");
        }
      }

      return { success: true, appointmentId: appointment.id };
    } catch (error) {
      if (error instanceof SchedulingError) {
        return { error: error.message };
      }
      logger.error({ error }, "booking.create_failed");
      return { error: "Failed to create booking. Please try again." };
    }
  }

  export async function getAvailableSlotsAction(
    eventTypeId: string,
  ): Promise<{ slots: TimeSlot[]; error?: string }> {
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

      return { slots };
    } catch (error) {
      if (error instanceof SchedulingError) {
        return { slots: [], error: error.message };
      }
      logger.error({ eventTypeId, error }, "slots.fetch_failed");
      return { slots: [], error: "Failed to load available slots" };
    }
  }
  ```
- **MIRROR**: `src/app/(dashboard)/dashboard/scheduling/availability/actions.ts`
- **GOTCHA**: Email send failure should NOT fail the booking - log and continue
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 8: CREATE confirmation page

- **ACTION**: CREATE `src/app/book/confirmation/page.tsx`
- **IMPLEMENT**:
  ```typescript
  import { notFound } from "next/navigation";
  import { db } from "@/core/database/client";
  import { eq } from "drizzle-orm";
  import { appointments, eventTypes, users } from "@/core/database/schema";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

  interface PageProps {
    searchParams: Promise<{ id?: string }>;
  }

  export default async function ConfirmationPage({ searchParams }: PageProps) {
    const { id } = await searchParams;
    if (!id) {
      notFound();
    }

    // Fetch appointment with joins
    const results = await db
      .select({
        appointment: appointments,
        eventType: eventTypes,
        consultant: users,
      })
      .from(appointments)
      .innerJoin(eventTypes, eq(appointments.eventTypeId, eventTypes.id))
      .innerJoin(users, eq(appointments.userId, users.id))
      .where(eq(appointments.id, id))
      .limit(1);

    const result = results[0];
    if (!result) {
      notFound();
    }

    const { appointment, eventType, consultant } = result;

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-16">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p><strong>Meeting:</strong> {eventType.name}</p>
                <p><strong>With:</strong> {consultant.displayName ?? consultant.email}</p>
                <p><strong>Date:</strong> {appointment.startTime.toLocaleDateString()}</p>
                <p><strong>Time:</strong> {appointment.startTime.toLocaleTimeString()} - {appointment.endTime.toLocaleTimeString()}</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                A confirmation email has been sent to {appointment.attendeeEmail}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  ```
- **MIRROR**: Standard server component page pattern
- **VALIDATE**: `npx tsc --noEmit`

### Task 9: ADD `findUserById` to repository and exports

- **ACTION**: UPDATE `src/features/scheduling/repository.ts`
- **IMPLEMENT**: Add function to find user by ID for email data
- **ALSO UPDATE**: `src/features/scheduling/index.ts` if needed, or access repository directly in actions
- **VALIDATE**: `npx tsc --noEmit`

### Task 10: ADD unit tests for createAppointment

- **ACTION**: UPDATE `src/features/scheduling/tests/service.test.ts`
- **IMPLEMENT**:
  ```typescript
  describe("createAppointment", () => {
    beforeEach(() => {
      mockRepository.findEventTypeById.mockReset();
      mockRepository.findAvailabilityWindowsByUser.mockReset();
      mockRepository.findAppointmentsByUserAndDateRange.mockReset();
      mockRepository.createAppointment.mockReset();
    });

    it("creates appointment for valid slot", async () => {
      // Setup: valid event type, availability window, no conflicts
      mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
      mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([mockMondayWindow]);
      mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([]);
      mockRepository.createAppointment.mockResolvedValue(mockAppointment);

      const result = await createAppointment({
        eventTypeId: mockEventType.id,
        startTime: validStartTime,
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
        attendeeMessage: "Looking forward to meeting",
      });

      expect(result.id).toBe(mockAppointment.id);
      expect(mockRepository.createAppointment).toHaveBeenCalledTimes(1);
    });

    it("throws AppointmentSlotUnavailableError when slot is taken", async () => {
      mockRepository.findEventTypeById.mockResolvedValue(mockEventType);
      mockRepository.findAvailabilityWindowsByUser.mockResolvedValue([mockMondayWindow]);
      mockRepository.findAppointmentsByUserAndDateRange.mockResolvedValue([existingAppointment]);

      await expect(createAppointment({
        eventTypeId: mockEventType.id,
        startTime: existingAppointment.startTime,
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
      })).rejects.toThrow("Time slot is no longer available");
    });

    it("throws EventTypeNotFoundError for invalid event type", async () => {
      mockRepository.findEventTypeById.mockResolvedValue(undefined);

      await expect(createAppointment({
        eventTypeId: "non-existent",
        startTime: new Date(),
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
      })).rejects.toThrow("Event type not found");
    });
  });
  ```
- **MIRROR**: `src/features/scheduling/tests/service.test.ts:731-891` - validateSlotAvailable tests
- **VALIDATE**: `bun test src/features/scheduling/tests/service.test.ts`

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `src/features/scheduling/tests/service.test.ts` | createAppointment: valid slot, slot taken, invalid event type | Appointment creation |
| (E2E in future) | Full booking flow | Integration |

### Edge Cases Checklist

- [ ] Empty attendee name (validation error)
- [ ] Invalid email format (validation error)
- [ ] Past time slot selection (insufficient notice error)
- [ ] Too far future slot (too far advance error)
- [ ] Slot booked by another user while filling form (slot unavailable error)
- [ ] Event type not found (404)
- [ ] User not found (404)
- [ ] Inactive event type (404)
- [ ] No availability configured for consultant (error message)
- [ ] Email send failure (booking succeeds, email logged as failed)

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
bun run lint && npx tsc --noEmit
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: UNIT_TESTS

```bash
bun test src/features/scheduling/tests/
```

**EXPECT**: All tests pass including new createAppointment tests

### Level 3: FULL_SUITE

```bash
bun test && bun run build
```

**EXPECT**: All tests pass, build succeeds

### Level 4: DATABASE_VALIDATION

Verify in Supabase Studio:
- [ ] Can insert appointment record
- [ ] Foreign keys work (eventTypeId, userId)
- [ ] Status defaults to "confirmed"

### Level 5: BROWSER_VALIDATION

Manual testing steps:
1. Navigate to `/book/[userId]/[eventSlug]`
2. Verify consultant info displays
3. Verify slots load for next 2 weeks
4. Click a date → slots for that day appear
5. Click a slot → booking form appears
6. Fill form and submit
7. Verify redirect to confirmation page
8. Check email received (both attendee and consultant)

### Level 6: MANUAL_VALIDATION

1. Create a test user with availability windows (Mon-Fri 9-5)
2. Create an event type for that user
3. Visit public booking page
4. Complete booking flow
5. Verify appointment in database
6. Verify emails sent
7. Try booking same slot again → should show error

---

## Acceptance Criteria

- [ ] Public route `/book/[username]/[eventSlug]` renders without auth
- [ ] Available slots display for 2-week window
- [ ] Slots correctly reflect availability windows and existing bookings
- [ ] Booking form validates input (name, email required)
- [ ] Appointment created in database on submit
- [ ] Confirmation emails sent to both parties
- [ ] Confirmation page shows booking details
- [ ] Error states display user-friendly messages
- [ ] Level 1-3 validation commands pass with exit 0

---

## Completion Checklist

- [ ] Task 1: Repository functions added
- [ ] Task 2: createAppointment service function added
- [ ] Task 3: Index exports updated
- [ ] Task 4: Public booking page created
- [ ] Task 5: Booking page client component created
- [ ] Task 6: Booking form component created
- [ ] Task 7: Server actions created
- [ ] Task 8: Confirmation page created
- [ ] Task 9: findUserById function added
- [ ] Task 10: Unit tests added
- [ ] Level 1: `bun run lint && npx tsc --noEmit` passes
- [ ] Level 2: `bun test src/features/scheduling/tests/` passes
- [ ] Level 3: `bun test && bun run build` succeeds
- [ ] Level 5: Manual browser testing passes

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Race condition: two users book same slot | LOW | HIGH | `validateSlotAvailable` called before insert; DB can add unique constraint on (eventTypeId, startTime, status='confirmed') |
| Email send failures | MEDIUM | LOW | Booking succeeds even if email fails; logged for manual follow-up |
| Timezone confusion | MEDIUM | MEDIUM | Store UTC, display in user locale; document clearly |
| Username not in schema | HIGH | LOW | Use user ID in URL for MVP; add username field in future |

---

## Notes

### Username vs User ID

The current `users` table has `id` and `email` but no unique username/slug. For MVP, the booking URL will use user ID:

```
/book/550e8400-e29b-41d4-a716-446655440001/consultation
```

This is functional but not user-friendly. A follow-up task could add a `username` column to users:

```sql
ALTER TABLE users ADD COLUMN username TEXT UNIQUE;
```

### Event Type Lookup

The booking page needs to look up the event type by both `userId` AND `slug` to ensure:
1. The event type belongs to the specified user
2. The slug is correct
3. The event type is active

This prevents URL manipulation attacks where someone tries `/book/userA/userB-event-slug`.

### Email Failure Handling

Email failures should NOT cause the booking to fail. The appointment is the primary record; emails are notifications. If email fails:
1. Log the error for monitoring
2. Return success to the user
3. Consultant can manually follow up using dashboard

### Slot Validation Timing

`validateSlotAvailable` is called at booking time (not just display time) to handle race conditions. If two users view the same slot simultaneously:
1. Both see the slot as available
2. First submitter's booking succeeds
3. Second submitter gets "slot no longer available" error

This is the expected behavior - no database lock needed if we validate immediately before insert.
