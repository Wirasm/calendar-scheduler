# Feature: Slot Generation Logic (Phase 3)

## Summary
Implement the core slot generation algorithm that computes available booking slots from availability windows. Given an event type and date range, the service returns bookable time slots while respecting existing appointments, buffer times, minimum notice periods, and maximum advance booking constraints. This is pure backend business logic with no UI.

## User Story
As a lead visiting a booking page
I want to see only available time slots that don't conflict with existing bookings
So that I can book a time that actually works for the consultant

## Problem Statement
The system has availability windows (e.g., Mon-Fri 9am-5pm) and appointments stored in the database, but no logic to compute which specific time slots are actually bookable. Phase 4 (Public Booking Page) cannot proceed without this slot generation service.

## Solution Statement
Create `repository.ts` and `service.ts` in the scheduling feature that:
1. Query availability windows for a user
2. Query existing appointments within a date range
3. Generate discrete time slots from availability windows
4. Filter out slots that conflict with existing appointments (including buffer times)
5. Enforce minNoticeHours (24h default) and maxAdvanceDays (14 days default) constraints
6. Return an array of available `TimeSlot` objects with start/end times

## Metadata
| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | scheduling feature, database queries |
| Dependencies | drizzle-orm ^0.45.1, zod ^4.2.1 (already installed) |
| Estimated Tasks | 8 |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────┐                                                         ║
║   │  Availability   │   (stored in DB)                                        ║
║   │  Mon-Fri 9-5    │                                                         ║
║   └─────────────────┘                                                         ║
║           +                                                                   ║
║   ┌─────────────────┐                                                         ║
║   │  Appointments   │   (stored in DB)                                        ║
║   │  Mon 10am booked│                                                         ║
║   └─────────────────┘                                                         ║
║           =                                                                   ║
║   ┌─────────────────┐                                                         ║
║   │  ???????????????│   (No way to compute available slots)                   ║
║   └─────────────────┘                                                         ║
║                                                                               ║
║   DATA_FLOW: availability_windows → ??? → booking_page                        ║
║   PAIN_POINT: No algorithm to compute actual bookable times                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐ ║
║   │  EventType      │ ──────► │  getAvailable   │ ──────► │  TimeSlot[]     │ ║
║   │  + Date Range   │         │  Slots()        │         │  [{start, end}] │ ║
║   └─────────────────┘         └─────────────────┘         └─────────────────┘ ║
║                                       │                                       ║
║                          ┌────────────┼────────────┐                          ║
║                          ▼            ▼            ▼                          ║
║                  ┌───────────┐ ┌───────────┐ ┌───────────┐                    ║
║                  │Availability│ │Appointments│ │Constraints│                  ║
║                  │ Windows   │ │ (conflicts)│ │ (notice,  │                   ║
║                  │ query     │ │ query      │ │  buffers) │                   ║
║                  └───────────┘ └───────────┘ └───────────┘                    ║
║                                                                               ║
║   DATA_FLOW:                                                                  ║
║   eventTypeId + dateRange                                                     ║
║       → repository.findEventType(eventTypeId)                                 ║
║       → repository.findAvailabilityByUser(userId)                             ║
║       → repository.findAppointmentsByDateRange(userId, start, end)            ║
║       → generateSlotsFromAvailability(windows, eventType, dateRange)          ║
║       → filterConflictingSlots(slots, appointments, buffers)                  ║
║       → filterByConstraints(slots, minNotice, maxAdvance)                     ║
║       → return TimeSlot[]                                                     ║
║                                                                               ║
║   VALUE_ADD: Booking page can now display actual available slots              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `scheduling/service.ts` | Does not exist | Has `getAvailableSlots()` function | Phase 4 can call to get slots |
| `scheduling/repository.ts` | Does not exist | Has DB query functions | Service has data access layer |
| `scheduling/index.ts` | Exports types/errors only | Exports service functions | Public API available |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/features/scheduling/models.ts` | 1-15 | Types to use: `EventType`, `AvailabilityWindow`, `Appointment` |
| P0 | `src/features/scheduling/errors.ts` | 1-118 | Errors to throw: `AppointmentSlotUnavailableError`, etc. |
| P0 | `src/features/scheduling/schemas.ts` | 1-158 | Validation schemas and input types |
| P0 | `src/core/database/schema.ts` | 74-134 | Table definitions for scheduling tables |
| P1 | `src/features/projects/repository.ts` | 1-64 | Repository pattern to MIRROR |
| P1 | `src/features/projects/service.ts` | 1-200 | Service pattern to MIRROR |
| P1 | `src/features/projects/tests/service.test.ts` | 1-329 | Test pattern to FOLLOW |
| P2 | `src/shared/utils/dates.ts` | 1-26 | Date utilities available |
| P2 | `src/core/logging/index.ts` | all | Logger usage pattern |

**External Documentation:**
| Source | Section | Why Needed |
|--------|---------|------------|
| [Drizzle ORM Docs](https://orm.drizzle.team/docs/select#filtering) | Filtering | Date range queries with `between`, `gte`, `lte` |
| [MDN Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | getDay(), getUTCHours() | JavaScript Date handling for day-of-week |

---

## Patterns to Mirror

**NAMING_CONVENTION:**
```typescript
// SOURCE: src/features/projects/service.ts:47-62
// COPY THIS PATTERN:
export async function createProject(input: CreateProjectInput, ownerId: string): Promise<Project> {
  logger.info({ ownerId, name: input.name }, "project.create_started");
  // ... business logic ...
  logger.info({ projectId: project.id, slug }, "project.create_completed");
  return project;
}
```

**ERROR_HANDLING:**
```typescript
// SOURCE: src/features/scheduling/errors.ts:73-80
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

**LOGGING_PATTERN:**
```typescript
// SOURCE: src/features/projects/service.ts:8,48,60
// COPY THIS PATTERN:
const logger = getLogger("scheduling.service");
logger.info({ eventTypeId, userId }, "slots.get_started");
logger.info({ eventTypeId, slotCount: slots.length }, "slots.get_completed");
logger.warn({ eventTypeId }, "slots.get_failed");
```

**REPOSITORY_PATTERN:**
```typescript
// SOURCE: src/features/projects/repository.ts:8-11
// COPY THIS PATTERN:
export async function findById(id: string): Promise<Project | undefined> {
  const results = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return results[0];
}
```

**SERVICE_PATTERN:**
```typescript
// SOURCE: src/features/projects/service.ts:68-85
// COPY THIS PATTERN:
export async function getProject(id: string, userId: string | null): Promise<Project> {
  logger.info({ projectId: id, userId }, "project.get_started");
  const project = await repository.findById(id);
  if (!project) {
    logger.warn({ projectId: id }, "project.get_failed");
    throw new ProjectNotFoundError(id);
  }
  // ... access control ...
  logger.info({ projectId: id }, "project.get_completed");
  return project;
}
```

**TEST_STRUCTURE:**
```typescript
// SOURCE: src/features/projects/tests/service.test.ts:1-36
// COPY THIS PATTERN:
import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mock repository BEFORE importing service
const mockRepository = {
  findById: mock<(id: string) => Promise<Type | undefined>>(() => Promise.resolve(undefined)),
  // ...
};

mock.module("../repository", () => mockRepository);

// Import service AFTER mocking
const { functionToTest } = await import("../service");

describe("functionToTest", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
  });

  it("does something", async () => {
    mockRepository.findById.mockResolvedValue(mockData);
    const result = await functionToTest(id);
    expect(result).toEqual(expected);
  });
});
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/features/scheduling/repository.ts` | CREATE | Database query functions for event types, availability, appointments |
| `src/features/scheduling/service.ts` | CREATE | Slot generation business logic |
| `src/features/scheduling/schemas.ts` | UPDATE | Add `GetAvailableSlotsSchema` input validation |
| `src/features/scheduling/index.ts` | UPDATE | Export new service functions and types |
| `src/features/scheduling/tests/service.test.ts` | CREATE | Unit tests for slot generation logic |
| `src/features/scheduling/tests/repository.test.ts` | CREATE | Unit tests for repository functions |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:
- **UI components** - This is pure backend logic. Phase 4 handles the booking page UI.
- **API routes** - Service functions will be called from Phase 4's routes.
- **Email notifications** - Phase 5 handles email integration.
- **Timezone conversion** - Store/compute in UTC; client-side display handled by Phase 4.
- **Event type CRUD** - Phase 2 handles availability management.
- **Appointment creation** - Phase 4 handles booking form submission.

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `src/features/scheduling/repository.ts`

- **ACTION**: CREATE database query layer for scheduling
- **IMPLEMENT**:
  ```typescript
  // Functions needed:
  findEventTypeById(id: string): Promise<EventType | undefined>
  findEventTypeBySlugAndUser(slug: string, userId: string): Promise<EventType | undefined>
  findAvailabilityWindowsByUser(userId: string): Promise<AvailabilityWindow[]>
  findAppointmentsByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    excludeCancelled?: boolean
  ): Promise<Appointment[]>
  findActiveEventTypesByUser(userId: string): Promise<EventType[]>
  ```
- **MIRROR**: `src/features/projects/repository.ts:1-64`
- **IMPORTS**:
  ```typescript
  import { and, eq, gte, lte } from "drizzle-orm";
  import { db } from "@/core/database/client";
  import type { Appointment, AvailabilityWindow, EventType } from "./models";
  import { appointments, availabilityWindows, eventTypes } from "./models";
  ```
- **GOTCHA**:
  - Use `results[0]` pattern with undefined check (noUncheckedIndexedAccess)
  - For date range: `and(gte(appointments.startTime, startDate), lte(appointments.startTime, endDate))`
  - Filter cancelled appointments: `eq(appointments.status, "confirmed")`
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: UPDATE `src/features/scheduling/schemas.ts`

- **ACTION**: ADD input/output types for slot generation
- **IMPLEMENT**:
  ```typescript
  // Add after existing schemas:

  // Input for getting available slots
  export const GetAvailableSlotsSchema = z.object({
    eventTypeId: z.string().uuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }).refine((data) => data.startDate < data.endDate, {
    message: "Start date must be before end date",
    path: ["endDate"],
  });

  export type GetAvailableSlotsInput = z.infer<typeof GetAvailableSlotsSchema>;

  // Output: a single time slot
  export const TimeSlotSchema = z.object({
    startTime: z.date(),
    endTime: z.date(),
  });

  export type TimeSlot = z.infer<typeof TimeSlotSchema>;
  ```
- **MIRROR**: `src/features/scheduling/schemas.ts:44-53` (CreateAvailabilityWindowSchema refine pattern)
- **IMPORTS**: Already has `import { z } from "zod/v4";`
- **GOTCHA**: Use `z.coerce.date()` to handle ISO string inputs
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: CREATE `src/features/scheduling/service.ts`

- **ACTION**: CREATE slot generation business logic
- **IMPLEMENT**:
  ```typescript
  import { getLogger } from "@/core/logging";
  import {
    AppointmentInsufficientNoticeError,
    AppointmentTooFarAdvanceError,
    EventTypeNotFoundError,
  } from "./errors";
  import type { Appointment, AvailabilityWindow, EventType } from "./models";
  import * as repository from "./repository";
  import type { GetAvailableSlotsInput, TimeSlot } from "./schemas";

  const logger = getLogger("scheduling.service");

  /**
   * Parse HH:MM time string to minutes since midnight.
   */
  function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  }

  /**
   * Check if two time ranges overlap.
   * Range A: [aStart, aEnd)
   * Range B: [bStart, bEnd)
   */
  function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  /**
   * Generate all possible slots for a single day based on availability window.
   */
  function generateSlotsForDay(
    date: Date,
    window: AvailabilityWindow,
    durationMinutes: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startMinutes = parseTimeToMinutes(window.startTime);
    const endMinutes = parseTimeToMinutes(window.endTime);

    let currentMinutes = startMinutes;
    while (currentMinutes + durationMinutes <= endMinutes) {
      const startTime = new Date(date);
      startTime.setUTCHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);

      const endTime = new Date(startTime);
      endTime.setUTCMinutes(endTime.getUTCMinutes() + durationMinutes);

      slots.push({ startTime, endTime });
      currentMinutes += durationMinutes; // Non-overlapping slots
    }

    return slots;
  }

  /**
   * Check if a slot conflicts with any appointment (including buffers).
   */
  function slotConflictsWithAppointments(
    slot: TimeSlot,
    appointments: Appointment[],
    bufferBefore: number,
    bufferAfter: number
  ): boolean {
    for (const apt of appointments) {
      // Expand appointment time by buffers
      const aptStartWithBuffer = new Date(apt.startTime);
      aptStartWithBuffer.setUTCMinutes(aptStartWithBuffer.getUTCMinutes() - bufferBefore);

      const aptEndWithBuffer = new Date(apt.endTime);
      aptEndWithBuffer.setUTCMinutes(aptEndWithBuffer.getUTCMinutes() + bufferAfter);

      if (rangesOverlap(slot.startTime, slot.endTime, aptStartWithBuffer, aptEndWithBuffer)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get available time slots for an event type within a date range.
   */
  export async function getAvailableSlots(input: GetAvailableSlotsInput): Promise<TimeSlot[]> {
    logger.info(
      { eventTypeId: input.eventTypeId, startDate: input.startDate, endDate: input.endDate },
      "slots.get_started"
    );

    // 1. Get event type
    const eventType = await repository.findEventTypeById(input.eventTypeId);
    if (!eventType) {
      logger.warn({ eventTypeId: input.eventTypeId }, "slots.event_type_not_found");
      throw new EventTypeNotFoundError(input.eventTypeId);
    }

    // 2. Enforce constraints
    const now = new Date();
    const minBookingTime = new Date(now);
    minBookingTime.setUTCHours(minBookingTime.getUTCHours() + eventType.minNoticeHours);

    const maxBookingTime = new Date(now);
    maxBookingTime.setUTCDate(maxBookingTime.getUTCDate() + eventType.maxAdvanceDays);

    // Adjust date range to respect constraints
    const effectiveStart = input.startDate < minBookingTime ? minBookingTime : input.startDate;
    const effectiveEnd = input.endDate > maxBookingTime ? maxBookingTime : input.endDate;

    if (effectiveStart >= effectiveEnd) {
      logger.info({ eventTypeId: input.eventTypeId }, "slots.no_valid_range");
      return [];
    }

    // 3. Get availability windows
    const windows = await repository.findAvailabilityWindowsByUser(eventType.userId);
    if (windows.length === 0) {
      logger.info({ userId: eventType.userId }, "slots.no_availability");
      return [];
    }

    // 4. Get existing appointments in the range
    const existingAppointments = await repository.findAppointmentsByUserAndDateRange(
      eventType.userId,
      effectiveStart,
      effectiveEnd,
      true // exclude cancelled
    );

    // 5. Generate slots for each day in range
    const allSlots: TimeSlot[] = [];
    const currentDate = new Date(effectiveStart);
    currentDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(effectiveEnd);
    endDate.setUTCHours(23, 59, 59, 999);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getUTCDay();

      // Find availability windows for this day
      const dayWindows = windows.filter(w => w.dayOfWeek === dayOfWeek);

      for (const window of dayWindows) {
        const daySlots = generateSlotsForDay(
          currentDate,
          window,
          eventType.durationMinutes
        );
        allSlots.push(...daySlots);
      }

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // 6. Filter out conflicting slots and past slots
    const availableSlots = allSlots.filter(slot => {
      // Must be after minimum notice time
      if (slot.startTime < minBookingTime) {
        return false;
      }

      // Must not conflict with existing appointments
      if (slotConflictsWithAppointments(
        slot,
        existingAppointments,
        eventType.bufferBeforeMinutes,
        eventType.bufferAfterMinutes
      )) {
        return false;
      }

      return true;
    });

    // 7. Sort by start time
    availableSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    logger.info(
      { eventTypeId: input.eventTypeId, totalSlots: allSlots.length, availableSlots: availableSlots.length },
      "slots.get_completed"
    );

    return availableSlots;
  }

  /**
   * Validate that a specific slot is still available for booking.
   * Used when actually creating an appointment to prevent race conditions.
   */
  export async function validateSlotAvailable(
    eventTypeId: string,
    startTime: Date
  ): Promise<{ eventType: EventType; endTime: Date }> {
    logger.info({ eventTypeId, startTime }, "slot.validate_started");

    const eventType = await repository.findEventTypeById(eventTypeId);
    if (!eventType) {
      throw new EventTypeNotFoundError(eventTypeId);
    }

    const endTime = new Date(startTime);
    endTime.setUTCMinutes(endTime.getUTCMinutes() + eventType.durationMinutes);

    // Check constraints
    const now = new Date();
    const minBookingTime = new Date(now);
    minBookingTime.setUTCHours(minBookingTime.getUTCHours() + eventType.minNoticeHours);

    if (startTime < minBookingTime) {
      throw new AppointmentInsufficientNoticeError(eventType.minNoticeHours);
    }

    const maxBookingTime = new Date(now);
    maxBookingTime.setUTCDate(maxBookingTime.getUTCDate() + eventType.maxAdvanceDays);

    if (startTime > maxBookingTime) {
      throw new AppointmentTooFarAdvanceError(eventType.maxAdvanceDays);
    }

    // Check for conflicts
    const conflictingAppointments = await repository.findAppointmentsByUserAndDateRange(
      eventType.userId,
      startTime,
      endTime,
      true
    );

    // Check if any appointment overlaps (with buffers)
    const expandedStart = new Date(startTime);
    expandedStart.setUTCMinutes(expandedStart.getUTCMinutes() - eventType.bufferBeforeMinutes);

    const expandedEnd = new Date(endTime);
    expandedEnd.setUTCMinutes(expandedEnd.getUTCMinutes() + eventType.bufferAfterMinutes);

    for (const apt of conflictingAppointments) {
      if (rangesOverlap(expandedStart, expandedEnd, apt.startTime, apt.endTime)) {
        throw new AppointmentSlotUnavailableError(startTime);
      }
    }

    logger.info({ eventTypeId, startTime }, "slot.validate_completed");
    return { eventType, endTime };
  }
  ```
- **MIRROR**: `src/features/projects/service.ts:1-200`
- **GOTCHA**:
  - Use `getUTCDay()` not `getDay()` for consistent day-of-week in UTC
  - Use `setUTCHours`, `setUTCMinutes` for UTC date manipulation
  - Buffer times expand the "blocked" range around appointments
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 4: UPDATE `src/features/scheduling/index.ts`

- **ACTION**: EXPORT new service functions and types
- **IMPLEMENT**:
  ```typescript
  // Add to existing exports:

  // Types for slot generation
  export type { GetAvailableSlotsInput, TimeSlot } from "./schemas";
  export { GetAvailableSlotsSchema, TimeSlotSchema } from "./schemas";

  // Service functions
  export { getAvailableSlots, validateSlotAvailable } from "./service";
  ```
- **MIRROR**: `src/features/projects/index.ts` export pattern
- **VALIDATE**: `npx tsc --noEmit`

### Task 5: CREATE `src/features/scheduling/tests/repository.test.ts`

- **ACTION**: CREATE unit tests for repository functions
- **IMPLEMENT**: Test database query functions with mocked db client
- **MIRROR**: `src/features/projects/tests/service.test.ts:1-50` (mock setup pattern)
- **TEST_CASES**:
  - `findEventTypeById` returns event type when exists
  - `findEventTypeById` returns undefined when not found
  - `findAvailabilityWindowsByUser` returns windows for user
  - `findAvailabilityWindowsByUser` returns empty array when no windows
  - `findAppointmentsByUserAndDateRange` filters by date range
  - `findAppointmentsByUserAndDateRange` excludes cancelled when flag is true
- **VALIDATE**: `bun test src/features/scheduling/tests/repository.test.ts`

### Task 6: CREATE `src/features/scheduling/tests/service.test.ts`

- **ACTION**: CREATE comprehensive unit tests for slot generation
- **IMPLEMENT**: Test slot generation logic with mocked repository
- **MIRROR**: `src/features/projects/tests/service.test.ts:1-329`
- **TEST_CASES**:
  ```typescript
  describe("getAvailableSlots", () => {
    // Happy path
    it("returns slots within availability windows")
    it("excludes slots that conflict with existing appointments")
    it("respects buffer times around appointments")
    it("enforces minimum notice hours")
    it("enforces maximum advance days")
    it("returns empty array when no availability windows")
    it("sorts slots by start time")

    // Edge cases
    it("handles multiple availability windows on same day")
    it("handles appointments spanning multiple days")
    it("throws EventTypeNotFoundError for invalid event type")
  });

  describe("validateSlotAvailable", () => {
    it("returns event type and end time for valid slot")
    it("throws AppointmentSlotUnavailableError when slot is taken")
    it("throws AppointmentInsufficientNoticeError when too soon")
    it("throws AppointmentTooFarAdvanceError when too far ahead")
    it("throws EventTypeNotFoundError for invalid event type")
  });

  describe("helper functions", () => {
    it("parseTimeToMinutes converts HH:MM correctly")
    it("rangesOverlap detects overlapping ranges")
    it("rangesOverlap returns false for non-overlapping ranges")
    it("generateSlotsForDay creates correct number of slots")
  });
  ```
- **VALIDATE**: `bun test src/features/scheduling/tests/service.test.ts`

### Task 7: ADD missing error import to service.ts

- **ACTION**: Ensure `AppointmentSlotUnavailableError` is imported
- **IMPLEMENT**: Already in errors.ts, just ensure import statement includes it
- **VALIDATE**: `npx tsc --noEmit`

### Task 8: RUN full validation suite

- **ACTION**: Verify all tests pass and build succeeds
- **VALIDATE**:
  ```bash
  bun run lint && npx tsc --noEmit
  bun test src/features/scheduling/tests/
  bun test
  bun run build
  ```

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `src/features/scheduling/tests/repository.test.ts` | 6+ cases | Database query layer |
| `src/features/scheduling/tests/service.test.ts` | 15+ cases | Slot generation logic |

### Edge Cases Checklist

- [ ] Empty availability windows → returns empty array
- [ ] All slots taken → returns empty array
- [ ] Request starts before minNoticeHours → adjusts start date
- [ ] Request ends after maxAdvanceDays → adjusts end date
- [ ] Request completely outside valid range → returns empty array
- [ ] Appointment with bufferBefore/bufferAfter → blocks adjacent slots
- [ ] Multiple appointments on same day → filters multiple slots
- [ ] Availability window shorter than event duration → no slots generated
- [ ] Event type not found → throws EventTypeNotFoundError
- [ ] Weekend availability only → only generates Saturday/Sunday slots
- [ ] Race condition: slot booked between getSlots and validateSlot → throws error

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
**EXPECT**: All tests pass, coverage >= 80%

### Level 3: FULL_SUITE
```bash
bun test && bun run build
```
**EXPECT**: All tests pass, build succeeds

### Level 4: DATABASE_VALIDATION
Not applicable - no schema changes in this phase (schema from Phase 1).

### Level 5: BROWSER_VALIDATION
Not applicable - no UI in this phase.

### Level 6: MANUAL_VALIDATION
```typescript
// In a test script or REPL:
import { getAvailableSlots } from "@/features/scheduling";

const slots = await getAvailableSlots({
  eventTypeId: "<existing-event-type-id>",
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
});

console.log(slots.length, "available slots");
console.log(slots[0]); // { startTime: Date, endTime: Date }
```

---

## Acceptance Criteria

- [ ] `getAvailableSlots` returns correct slots for a given event type and date range
- [ ] Slots respect availability windows (only during defined hours/days)
- [ ] Slots don't conflict with existing appointments (including buffers)
- [ ] minNoticeHours constraint is enforced (no slots within 24h by default)
- [ ] maxAdvanceDays constraint is enforced (no slots beyond 14 days by default)
- [ ] `validateSlotAvailable` confirms a slot is bookable at booking time
- [ ] All error cases throw appropriate error classes with correct status codes
- [ ] Level 1-3 validation commands pass with exit 0
- [ ] Unit tests cover >= 80% of new code
- [ ] Code mirrors existing patterns exactly (naming, logging, structure)

---

## Completion Checklist

- [ ] All tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: `bun run lint && npx tsc --noEmit` passes
- [ ] Level 2: `bun test src/features/scheduling/tests/` passes
- [ ] Level 3: `bun test && bun run build` succeeds
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Timezone bugs in slot generation | MEDIUM | HIGH | Use UTC throughout; all Date operations use `getUTC*`/`setUTC*` methods |
| Race condition: slot booked between display and book | LOW | MEDIUM | `validateSlotAvailable` re-checks at booking time; Phase 4 will use DB transaction |
| Performance with many appointments | LOW | LOW | Date range query limits scope; add index on `appointments.start_time` if needed |
| Buffer time edge cases | MEDIUM | LOW | Comprehensive unit tests for buffer overlap scenarios |

---

## Notes

**Algorithm Overview:**
1. Load event type configuration (duration, buffers, constraints)
2. Determine effective date range (bounded by minNotice and maxAdvance)
3. Load availability windows for the consultant
4. Load existing appointments in the date range
5. For each day in range, find matching availability windows
6. Generate discrete slots based on duration (no overlap)
7. Filter out slots that conflict with appointments (expanded by buffers)
8. Filter out slots before minimum notice time
9. Return sorted array of available slots

**Key Insight:** The slot generation happens on-demand, not pre-computed. This means:
- No need for a `slots` table
- Always reflects current availability/bookings
- Simpler data model, but slightly more computation per request

**Design Decision:** Slots are non-overlapping within an availability window. If duration is 30 minutes and window is 9am-5pm, slots are 9:00, 9:30, 10:00, etc. This matches Cal.com/Calendly behavior.

**Future Consideration:** If performance becomes an issue with many bookings, consider:
- Caching available slots with short TTL
- Pagination (return first N slots instead of all)
- Background computation of "next available slot"
