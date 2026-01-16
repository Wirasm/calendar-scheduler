# Feature: Scheduling Database Schema (Phase 1)

## Summary

Define the data model for the appointment scheduling feature. This phase creates three database tables (`event_types`, `availability_windows`, `appointments`) following existing Drizzle ORM patterns, along with the scheduling feature's models, schemas, and error classes. No business logic—just the foundation.

## User Story

As a solo consultant
I want a structured data model for scheduling
So that I can store event types, availability windows, and appointments reliably

## Problem Statement

The scheduling feature needs database tables to store:
- Event types (e.g., "30 min consultation")
- Weekly availability windows (e.g., "Monday 9am-5pm")
- Appointments (booked meetings with attendee info)

Without this foundation, no scheduling logic can be built.

## Solution Statement

Create a new `scheduling` feature following the vertical slice architecture. Add three tables to `schema.ts` with proper foreign keys, timestamps, and constraints. Implement type inference, Zod validation schemas, and custom error classes.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | `src/core/database/schema.ts`, `src/features/scheduling/` |
| Dependencies | drizzle-orm@0.45.1, zod@4.2.1 |
| Estimated Tasks | 8 |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐                                                             ║
║   │   No Data   │  No scheduling tables exist in database                     ║
║   │   Model     │                                                             ║
║   └─────────────┘                                                             ║
║                                                                               ║
║   DATA_FLOW: None - scheduling feature doesn't exist                          ║
║   PAIN_POINT: Cannot store event types, availability, or appointments         ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        ║
║   │  event_types    │     │ availability_   │     │  appointments   │        ║
║   │                 │     │    windows      │     │                 │        ║
║   │ - id (uuid)     │     │ - id (uuid)     │     │ - id (uuid)     │        ║
║   │ - userId (fk)   │◄────│ - userId (fk)   │     │ - eventTypeId   │────►   ║
║   │ - name          │     │ - dayOfWeek     │     │ - userId (fk)   │        ║
║   │ - slug          │     │ - startTime     │     │ - startTime     │        ║
║   │ - duration      │     │ - endTime       │     │ - endTime       │        ║
║   │ - description   │     │ - timestamps    │     │ - attendeeName  │        ║
║   │ - bufferBefore  │     └─────────────────┘     │ - attendeeEmail │        ║
║   │ - bufferAfter   │                             │ - message       │        ║
║   │ - minNotice     │                             │ - status        │        ║
║   │ - maxAdvance    │                             │ - timestamps    │        ║
║   │ - isActive      │                             └─────────────────┘        ║
║   │ - timestamps    │                                                         ║
║   └─────────────────┘                                                         ║
║                                                                               ║
║   DATA_FLOW:                                                                  ║
║   User → creates EventType → sets AvailabilityWindows                         ║
║   Lead → books slot → creates Appointment (references EventType)              ║
║                                                                               ║
║   VALUE_ADD: Structured storage for all scheduling data with referential      ║
║              integrity and type-safe TypeScript access                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Database | No scheduling tables | 3 new tables with FK constraints | Can store scheduling data |
| TypeScript | No scheduling types | Full type inference from schema | Type-safe DB operations |
| Validation | None | Zod schemas for all inputs | Input validation ready |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/core/database/schema.ts` | 1-56 | Pattern to MIRROR for table definitions |
| P0 | `src/features/projects/models.ts` | 1-8 | Type inference pattern to COPY |
| P0 | `src/features/projects/schemas.ts` | 1-37 | Zod schema pattern to COPY |
| P0 | `src/features/projects/errors.ts` | 1-40 | Error class pattern to COPY |
| P1 | `src/features/projects/index.ts` | 1-23 | Export pattern to FOLLOW |
| P2 | `src/features/projects/tests/schemas.test.ts` | 1-119 | Test pattern to FOLLOW |
| P2 | `src/features/projects/tests/errors.test.ts` | 1-68 | Test pattern to FOLLOW |

**External Documentation:**

| Source | Section | Why Needed |
|--------|---------|------------|
| [Drizzle PostgreSQL Columns](https://orm.drizzle.team/docs/column-types/pg) | Column types | Reference for `smallint`, `time`, `timestamp` |
| [Zod v4 Docs](https://zod.dev) | Schema API | Validation patterns |

---

## Patterns to Mirror

**TABLE_DEFINITION:**
```typescript
// SOURCE: src/core/database/schema.ts:45-55
// COPY THIS PATTERN:
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
});
```

**TIMESTAMPS_PATTERN:**
```typescript
// SOURCE: src/core/database/schema.ts:7-10
// COPY THIS PATTERN:
export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
};
```

**TYPE_INFERENCE:**
```typescript
// SOURCE: src/features/projects/models.ts:1-8
// COPY THIS PATTERN:
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { projects } from "@/core/database/schema";

export { projects };

export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;
```

**ZOD_SCHEMA:**
```typescript
// SOURCE: src/features/projects/schemas.ts:1-12
// COPY THIS PATTERN:
import { z } from "zod/v4";

export const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be at most 100 characters"),
  description: z.string().max(1000, "Description must be at most 1000 characters").optional(),
  isPublic: z.boolean().default(false),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
```

**ERROR_CLASS:**
```typescript
// SOURCE: src/features/projects/errors.ts:1-27
// COPY THIS PATTERN:
import type { HttpStatusCode } from "@/core/api/errors";

export type ProjectErrorCode =
  | "PROJECT_NOT_FOUND"
  | "PROJECT_SLUG_EXISTS"
  | "PROJECT_ACCESS_DENIED";

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

**INDEX_EXPORTS:**
```typescript
// SOURCE: src/features/projects/index.ts:1-23
// COPY THIS PATTERN:
// Errors
export type { ProjectErrorCode } from "./errors";
export {
  ProjectAccessDeniedError,
  ProjectError,
  ProjectNotFoundError,
  ProjectSlugExistsError,
} from "./errors";
export type { NewProject, Project } from "./models";
export type { CreateProjectInput, ProjectResponse, UpdateProjectInput } from "./schemas";
// Schemas (for validation)
export { CreateProjectSchema, ProjectResponseSchema, UpdateProjectSchema } from "./schemas";
```

**TEST_SCHEMA:**
```typescript
// SOURCE: src/features/projects/tests/schemas.test.ts:1-15
// COPY THIS PATTERN:
import { describe, expect, it } from "bun:test";

import { CreateProjectSchema } from "../schemas";

describe("CreateProjectSchema", () => {
  it("validates valid input", () => {
    const result = CreateProjectSchema.parse({
      name: "My Project",
      description: "A test project",
      isPublic: true,
    });
    expect(result.name).toBe("My Project");
  });
});
```

**TEST_ERROR:**
```typescript
// SOURCE: src/features/projects/tests/errors.test.ts:10-22
// COPY THIS PATTERN:
describe("ProjectError", () => {
  it("creates error with message, code, and status", () => {
    const error = new ProjectError("Test error", "PROJECT_NOT_FOUND", 404);
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("PROJECT_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("ProjectError");
  });

  it("is instanceof Error", () => {
    const error = new ProjectError("Test", "PROJECT_NOT_FOUND", 404);
    expect(error).toBeInstanceOf(Error);
  });
});
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/core/database/schema.ts` | UPDATE | Add `eventTypes`, `availabilityWindows`, `appointments` tables |
| `src/features/scheduling/models.ts` | CREATE | Re-export tables, define inferred types |
| `src/features/scheduling/schemas.ts` | CREATE | Zod validation schemas for inputs |
| `src/features/scheduling/errors.ts` | CREATE | Custom error classes with HTTP semantics |
| `src/features/scheduling/index.ts` | CREATE | Public API exports |
| `src/features/scheduling/tests/schemas.test.ts` | CREATE | Schema validation tests |
| `src/features/scheduling/tests/errors.test.ts` | CREATE | Error class tests |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **Repository functions** - Deferred to Phase 2/3, this phase is schema only
- **Service layer** - Deferred to Phase 2/3
- **API routes** - Deferred to Phase 4
- **Email integration** - Deferred to Phase 5
- **Google Calendar sync** - Out of scope for MVP
- **Recurring appointments** - Out of scope for MVP
- **Multiple event types per user** - Supported by schema, but UI deferred

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `src/core/database/schema.ts` - Add scheduling tables

- **ACTION**: Add three table definitions after `projects` table
- **IMPLEMENT**:

```typescript
// Add to imports at top:
import { boolean, integer, pgTable, smallint, text, time, timestamp, uuid } from "drizzle-orm/pg-core";

// Add after projects table:

/**
 * Event types - defines bookable meeting types (e.g., "30 min consultation")
 */
export const eventTypes = pgTable("event_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  bufferBeforeMinutes: integer("buffer_before_minutes").notNull().default(0),
  bufferAfterMinutes: integer("buffer_after_minutes").notNull().default(15),
  minNoticeHours: integer("min_notice_hours").notNull().default(24),
  maxAdvanceDays: integer("max_advance_days").notNull().default(14),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

/**
 * Availability windows - recurring weekly time blocks when user is available
 * dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday (ISO standard)
 */
export const availabilityWindows = pgTable("availability_windows", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: smallint("day_of_week").notNull(), // 0-6
  startTime: time("start_time").notNull(), // e.g., "09:00"
  endTime: time("end_time").notNull(), // e.g., "17:00"
  ...timestamps,
});

/**
 * Appointments - booked meetings between consultant and attendee
 */
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventTypeId: uuid("event_type_id")
    .notNull()
    .references(() => eventTypes.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  attendeeName: text("attendee_name").notNull(),
  attendeeEmail: text("attendee_email").notNull(),
  attendeeMessage: text("attendee_message"),
  status: text("status").notNull().default("confirmed"), // confirmed, cancelled
  cancelledAt: timestamp("cancelled_at"),
  reminderSentAt: timestamp("reminder_sent_at"),
  ...timestamps,
});
```

- **MIRROR**: `src/core/database/schema.ts:45-55` - follow existing table pattern
- **IMPORTS**: Add `integer`, `smallint`, `time` to existing import
- **GOTCHA**: Use `time("column")` for time-only (no date), `timestamp("column")` for datetime. Use `integer` for minutes/hours/days, `smallint` for day of week (0-6).
- **VALIDATE**: `bun run lint && bun tsc --noEmit`

### Task 2: CREATE `src/features/scheduling/models.ts`

- **ACTION**: CREATE type definitions file
- **IMPLEMENT**:

```typescript
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { appointments, availabilityWindows, eventTypes } from "@/core/database/schema";

// Re-export tables for use in repository
export { appointments, availabilityWindows, eventTypes };

// Event Types
export type EventType = InferSelectModel<typeof eventTypes>;
export type NewEventType = InferInsertModel<typeof eventTypes>;

// Availability Windows
export type AvailabilityWindow = InferSelectModel<typeof availabilityWindows>;
export type NewAvailabilityWindow = InferInsertModel<typeof availabilityWindows>;

// Appointments
export type Appointment = InferSelectModel<typeof appointments>;
export type NewAppointment = InferInsertModel<typeof appointments>;
```

- **MIRROR**: `src/features/projects/models.ts:1-8`
- **IMPORTS**: `import { appointments, availabilityWindows, eventTypes } from "@/core/database/schema"`
- **GOTCHA**: Use `InferSelectModel` for read types, `InferInsertModel` for write types
- **VALIDATE**: `bun tsc --noEmit`

### Task 3: CREATE `src/features/scheduling/schemas.ts`

- **ACTION**: CREATE Zod validation schemas
- **IMPLEMENT**:

```typescript
import { z } from "zod/v4";

// ============================================================================
// Event Type Schemas
// ============================================================================

export const CreateEventTypeSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be at most 100 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  bufferBeforeMinutes: z.number().int().min(0).max(60).default(0),
  bufferAfterMinutes: z.number().int().min(0).max(60).default(15),
  minNoticeHours: z.number().int().min(0).max(168).default(24), // max 1 week
  maxAdvanceDays: z.number().int().min(1).max(90).default(14), // max 3 months
  isActive: z.boolean().default(true),
});

export type CreateEventTypeInput = z.infer<typeof CreateEventTypeSchema>;

export const UpdateEventTypeSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  bufferBeforeMinutes: z.number().int().min(0).max(60).optional(),
  bufferAfterMinutes: z.number().int().min(0).max(60).optional(),
  minNoticeHours: z.number().int().min(0).max(168).optional(),
  maxAdvanceDays: z.number().int().min(1).max(90).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateEventTypeInput = z.infer<typeof UpdateEventTypeSchema>;

// ============================================================================
// Availability Window Schemas
// ============================================================================

export const CreateAvailabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
});

export type CreateAvailabilityWindowInput = z.infer<typeof CreateAvailabilityWindowSchema>;

export const UpdateAvailabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)").optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)").optional(),
});

export type UpdateAvailabilityWindowInput = z.infer<typeof UpdateAvailabilityWindowSchema>;

// ============================================================================
// Appointment Schemas
// ============================================================================

export const CreateAppointmentSchema = z.object({
  eventTypeId: z.string().uuid(),
  startTime: z.coerce.date(),
  attendeeName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  attendeeEmail: z.string().email("Invalid email address"),
  attendeeMessage: z.string().max(1000, "Message must be at most 1000 characters").optional(),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

export const CancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
});

export type CancelAppointmentInput = z.infer<typeof CancelAppointmentSchema>;

// ============================================================================
// Response Schemas (for API responses)
// ============================================================================

export const EventTypeResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.number(),
  bufferBeforeMinutes: z.number(),
  bufferAfterMinutes: z.number(),
  minNoticeHours: z.number(),
  maxAdvanceDays: z.number(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EventTypeResponse = z.infer<typeof EventTypeResponseSchema>;

export const AvailabilityWindowResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  dayOfWeek: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AvailabilityWindowResponse = z.infer<typeof AvailabilityWindowResponseSchema>;

export const AppointmentResponseSchema = z.object({
  id: z.string().uuid(),
  eventTypeId: z.string().uuid(),
  userId: z.string().uuid(),
  startTime: z.date(),
  endTime: z.date(),
  attendeeName: z.string(),
  attendeeEmail: z.string(),
  attendeeMessage: z.string().nullable(),
  status: z.string(),
  cancelledAt: z.date().nullable(),
  reminderSentAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;
```

- **MIRROR**: `src/features/projects/schemas.ts:1-37`
- **IMPORTS**: `import { z } from "zod/v4"` (note: zod/v4 not zod)
- **GOTCHA**: Time format uses regex for HH:MM validation. Use `z.coerce.date()` for date parsing.
- **VALIDATE**: `bun tsc --noEmit`

### Task 4: CREATE `src/features/scheduling/errors.ts`

- **ACTION**: CREATE feature-specific error classes
- **IMPLEMENT**:

```typescript
import type { HttpStatusCode } from "@/core/api/errors";

/** Known error codes for scheduling operations. */
export type SchedulingErrorCode =
  | "EVENT_TYPE_NOT_FOUND"
  | "EVENT_TYPE_SLUG_EXISTS"
  | "AVAILABILITY_WINDOW_NOT_FOUND"
  | "AVAILABILITY_WINDOW_OVERLAP"
  | "APPOINTMENT_NOT_FOUND"
  | "APPOINTMENT_SLOT_UNAVAILABLE"
  | "APPOINTMENT_OUTSIDE_AVAILABILITY"
  | "APPOINTMENT_INSUFFICIENT_NOTICE"
  | "APPOINTMENT_TOO_FAR_ADVANCE"
  | "SCHEDULING_ACCESS_DENIED";

/**
 * Base error for scheduling-related errors.
 */
export class SchedulingError extends Error {
  readonly code: SchedulingErrorCode;
  readonly statusCode: HttpStatusCode;

  constructor(message: string, code: SchedulingErrorCode, statusCode: HttpStatusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Event Type Errors
export class EventTypeNotFoundError extends SchedulingError {
  constructor(identifier: string) {
    super(`Event type not found: ${identifier}`, "EVENT_TYPE_NOT_FOUND", 404);
  }
}

export class EventTypeSlugExistsError extends SchedulingError {
  constructor(slug: string) {
    super(`Event type slug already exists: ${slug}`, "EVENT_TYPE_SLUG_EXISTS", 409);
  }
}

// Availability Window Errors
export class AvailabilityWindowNotFoundError extends SchedulingError {
  constructor(identifier: string) {
    super(`Availability window not found: ${identifier}`, "AVAILABILITY_WINDOW_NOT_FOUND", 404);
  }
}

export class AvailabilityWindowOverlapError extends SchedulingError {
  constructor(dayOfWeek: number) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[dayOfWeek] ?? `Day ${dayOfWeek}`;
    super(
      `Availability window overlaps with existing window on ${dayName}`,
      "AVAILABILITY_WINDOW_OVERLAP",
      409,
    );
  }
}

// Appointment Errors
export class AppointmentNotFoundError extends SchedulingError {
  constructor(identifier: string) {
    super(`Appointment not found: ${identifier}`, "APPOINTMENT_NOT_FOUND", 404);
  }
}

export class AppointmentSlotUnavailableError extends SchedulingError {
  constructor(startTime: Date) {
    super(
      `Time slot is no longer available: ${startTime.toISOString()}`,
      "APPOINTMENT_SLOT_UNAVAILABLE",
      409,
    );
  }
}

export class AppointmentOutsideAvailabilityError extends SchedulingError {
  constructor() {
    super(
      "Requested time is outside available hours",
      "APPOINTMENT_OUTSIDE_AVAILABILITY",
      400,
    );
  }
}

export class AppointmentInsufficientNoticeError extends SchedulingError {
  constructor(minNoticeHours: number) {
    super(
      `Appointments require at least ${minNoticeHours} hours notice`,
      "APPOINTMENT_INSUFFICIENT_NOTICE",
      400,
    );
  }
}

export class AppointmentTooFarAdvanceError extends SchedulingError {
  constructor(maxAdvanceDays: number) {
    super(
      `Appointments can only be booked up to ${maxAdvanceDays} days in advance`,
      "APPOINTMENT_TOO_FAR_ADVANCE",
      400,
    );
  }
}

// Access Error
export class SchedulingAccessDeniedError extends SchedulingError {
  constructor(resource: string) {
    super(`Access denied to scheduling resource: ${resource}`, "SCHEDULING_ACCESS_DENIED", 403);
  }
}
```

- **MIRROR**: `src/features/projects/errors.ts:1-40`
- **IMPORTS**: `import type { HttpStatusCode } from "@/core/api/errors"`
- **PATTERN**: Extend base Error, include `code` and `statusCode` properties
- **VALIDATE**: `bun tsc --noEmit`

### Task 5: CREATE `src/features/scheduling/index.ts`

- **ACTION**: CREATE public API exports
- **IMPLEMENT**:

```typescript
// ============================================================================
// Errors
// ============================================================================
export type { SchedulingErrorCode } from "./errors";
export {
  AppointmentInsufficientNoticeError,
  AppointmentNotFoundError,
  AppointmentOutsideAvailabilityError,
  AppointmentSlotUnavailableError,
  AppointmentTooFarAdvanceError,
  AvailabilityWindowNotFoundError,
  AvailabilityWindowOverlapError,
  EventTypeNotFoundError,
  EventTypeSlugExistsError,
  SchedulingAccessDeniedError,
  SchedulingError,
} from "./errors";

// ============================================================================
// Models (Types)
// ============================================================================
export type {
  Appointment,
  AvailabilityWindow,
  EventType,
  NewAppointment,
  NewAvailabilityWindow,
  NewEventType,
} from "./models";

// ============================================================================
// Schemas (for validation)
// ============================================================================
export type {
  AppointmentResponse,
  AvailabilityWindowResponse,
  CancelAppointmentInput,
  CreateAppointmentInput,
  CreateAvailabilityWindowInput,
  CreateEventTypeInput,
  EventTypeResponse,
  UpdateAvailabilityWindowInput,
  UpdateEventTypeInput,
} from "./schemas";

export {
  AppointmentResponseSchema,
  AvailabilityWindowResponseSchema,
  CancelAppointmentSchema,
  CreateAppointmentSchema,
  CreateAvailabilityWindowSchema,
  CreateEventTypeSchema,
  EventTypeResponseSchema,
  UpdateAvailabilityWindowSchema,
  UpdateEventTypeSchema,
} from "./schemas";

// ============================================================================
// Service functions (to be added in Phase 2/3)
// ============================================================================
// export { ... } from "./service";
```

- **MIRROR**: `src/features/projects/index.ts:1-23`
- **PATTERN**: Named exports only, hide internal implementation (repository not exported)
- **GOTCHA**: Types use `export type { }`, values use `export { }`
- **VALIDATE**: `bun run lint && bun tsc --noEmit`

### Task 6: CREATE `src/features/scheduling/tests/schemas.test.ts`

- **ACTION**: CREATE unit tests for Zod schemas
- **IMPLEMENT**:

```typescript
import { describe, expect, it } from "bun:test";

import {
  CreateAppointmentSchema,
  CreateAvailabilityWindowSchema,
  CreateEventTypeSchema,
  UpdateEventTypeSchema,
} from "../schemas";

describe("CreateEventTypeSchema", () => {
  it("validates valid input", () => {
    const result = CreateEventTypeSchema.parse({
      name: "30 Minute Consultation",
      description: "A quick intro call",
      durationMinutes: 30,
    });
    expect(result.name).toBe("30 Minute Consultation");
    expect(result.durationMinutes).toBe(30);
  });

  it("uses default values", () => {
    const result = CreateEventTypeSchema.parse({
      name: "Quick Call",
    });
    expect(result.durationMinutes).toBe(30);
    expect(result.bufferBeforeMinutes).toBe(0);
    expect(result.bufferAfterMinutes).toBe(15);
    expect(result.minNoticeHours).toBe(24);
    expect(result.maxAdvanceDays).toBe(14);
    expect(result.isActive).toBe(true);
  });

  it("rejects name shorter than 3 characters", () => {
    expect(() => CreateEventTypeSchema.parse({ name: "ab" })).toThrow();
  });

  it("rejects duration less than 5 minutes", () => {
    expect(() =>
      CreateEventTypeSchema.parse({ name: "Too Short", durationMinutes: 3 }),
    ).toThrow();
  });

  it("rejects duration more than 480 minutes", () => {
    expect(() =>
      CreateEventTypeSchema.parse({ name: "Too Long", durationMinutes: 500 }),
    ).toThrow();
  });
});

describe("UpdateEventTypeSchema", () => {
  it("validates partial updates", () => {
    const result = UpdateEventTypeSchema.parse({
      name: "Updated Name",
    });
    expect(result.name).toBe("Updated Name");
    expect(result.durationMinutes).toBeUndefined();
  });

  it("validates empty object", () => {
    const result = UpdateEventTypeSchema.parse({});
    expect(result).toEqual({});
  });
});

describe("CreateAvailabilityWindowSchema", () => {
  it("validates valid input", () => {
    const result = CreateAvailabilityWindowSchema.parse({
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.dayOfWeek).toBe(1);
    expect(result.startTime).toBe("09:00");
    expect(result.endTime).toBe("17:00");
  });

  it("rejects invalid day of week", () => {
    expect(() =>
      CreateAvailabilityWindowSchema.parse({
        dayOfWeek: 7, // Invalid
        startTime: "09:00",
        endTime: "17:00",
      }),
    ).toThrow();
  });

  it("rejects invalid time format", () => {
    expect(() =>
      CreateAvailabilityWindowSchema.parse({
        dayOfWeek: 1,
        startTime: "9:00", // Missing leading zero
        endTime: "17:00",
      }),
    ).toThrow();
  });

  it("rejects invalid time values", () => {
    expect(() =>
      CreateAvailabilityWindowSchema.parse({
        dayOfWeek: 1,
        startTime: "25:00", // Invalid hour
        endTime: "17:00",
      }),
    ).toThrow();
  });
});

describe("CreateAppointmentSchema", () => {
  it("validates valid input", () => {
    const result = CreateAppointmentSchema.parse({
      eventTypeId: "550e8400-e29b-41d4-a716-446655440000",
      startTime: "2026-01-20T10:00:00Z",
      attendeeName: "John Doe",
      attendeeEmail: "john@example.com",
      attendeeMessage: "Looking forward to our call!",
    });
    expect(result.attendeeName).toBe("John Doe");
    expect(result.attendeeEmail).toBe("john@example.com");
    expect(result.startTime).toBeInstanceOf(Date);
  });

  it("coerces date string to Date object", () => {
    const result = CreateAppointmentSchema.parse({
      eventTypeId: "550e8400-e29b-41d4-a716-446655440000",
      startTime: "2026-01-20T10:00:00Z",
      attendeeName: "Jane Doe",
      attendeeEmail: "jane@example.com",
    });
    expect(result.startTime).toBeInstanceOf(Date);
  });

  it("rejects invalid email", () => {
    expect(() =>
      CreateAppointmentSchema.parse({
        eventTypeId: "550e8400-e29b-41d4-a716-446655440000",
        startTime: "2026-01-20T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "not-an-email",
      }),
    ).toThrow();
  });

  it("rejects invalid UUID", () => {
    expect(() =>
      CreateAppointmentSchema.parse({
        eventTypeId: "not-a-uuid",
        startTime: "2026-01-20T10:00:00Z",
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
      }),
    ).toThrow();
  });

  it("rejects name shorter than 2 characters", () => {
    expect(() =>
      CreateAppointmentSchema.parse({
        eventTypeId: "550e8400-e29b-41d4-a716-446655440000",
        startTime: "2026-01-20T10:00:00Z",
        attendeeName: "J",
        attendeeEmail: "j@example.com",
      }),
    ).toThrow();
  });
});
```

- **MIRROR**: `src/features/projects/tests/schemas.test.ts:1-119`
- **IMPORTS**: `import { describe, expect, it } from "bun:test"`
- **PATTERN**: Test valid input, defaults, boundary conditions, rejections
- **VALIDATE**: `bun test src/features/scheduling/tests/schemas.test.ts`

### Task 7: CREATE `src/features/scheduling/tests/errors.test.ts`

- **ACTION**: CREATE unit tests for error classes
- **IMPLEMENT**:

```typescript
import { describe, expect, it } from "bun:test";

import {
  AppointmentInsufficientNoticeError,
  AppointmentNotFoundError,
  AppointmentOutsideAvailabilityError,
  AppointmentSlotUnavailableError,
  AppointmentTooFarAdvanceError,
  AvailabilityWindowNotFoundError,
  AvailabilityWindowOverlapError,
  EventTypeNotFoundError,
  EventTypeSlugExistsError,
  SchedulingAccessDeniedError,
  SchedulingError,
} from "../errors";

describe("SchedulingError", () => {
  it("creates error with message, code, and status", () => {
    const error = new SchedulingError("Test error", "EVENT_TYPE_NOT_FOUND", 404);
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("EVENT_TYPE_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("SchedulingError");
  });

  it("is instanceof Error", () => {
    const error = new SchedulingError("Test", "EVENT_TYPE_NOT_FOUND", 404);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("EventTypeNotFoundError", () => {
  it("creates error with identifier in message", () => {
    const error = new EventTypeNotFoundError("et-123");
    expect(error.message).toBe("Event type not found: et-123");
    expect(error.code).toBe("EVENT_TYPE_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("EventTypeNotFoundError");
  });

  it("is instanceof SchedulingError", () => {
    const error = new EventTypeNotFoundError("id");
    expect(error).toBeInstanceOf(SchedulingError);
  });
});

describe("EventTypeSlugExistsError", () => {
  it("creates error with slug in message", () => {
    const error = new EventTypeSlugExistsError("my-event");
    expect(error.message).toBe("Event type slug already exists: my-event");
    expect(error.code).toBe("EVENT_TYPE_SLUG_EXISTS");
    expect(error.statusCode).toBe(409);
  });
});

describe("AvailabilityWindowNotFoundError", () => {
  it("creates error with identifier in message", () => {
    const error = new AvailabilityWindowNotFoundError("aw-123");
    expect(error.message).toBe("Availability window not found: aw-123");
    expect(error.code).toBe("AVAILABILITY_WINDOW_NOT_FOUND");
    expect(error.statusCode).toBe(404);
  });
});

describe("AvailabilityWindowOverlapError", () => {
  it("creates error with day name in message", () => {
    const error = new AvailabilityWindowOverlapError(1);
    expect(error.message).toBe("Availability window overlaps with existing window on Monday");
    expect(error.code).toBe("AVAILABILITY_WINDOW_OVERLAP");
    expect(error.statusCode).toBe(409);
  });

  it("handles Sunday (day 0)", () => {
    const error = new AvailabilityWindowOverlapError(0);
    expect(error.message).toContain("Sunday");
  });

  it("handles Saturday (day 6)", () => {
    const error = new AvailabilityWindowOverlapError(6);
    expect(error.message).toContain("Saturday");
  });
});

describe("AppointmentNotFoundError", () => {
  it("creates error with identifier in message", () => {
    const error = new AppointmentNotFoundError("apt-123");
    expect(error.message).toBe("Appointment not found: apt-123");
    expect(error.code).toBe("APPOINTMENT_NOT_FOUND");
    expect(error.statusCode).toBe(404);
  });
});

describe("AppointmentSlotUnavailableError", () => {
  it("creates error with time in message", () => {
    const startTime = new Date("2026-01-20T10:00:00Z");
    const error = new AppointmentSlotUnavailableError(startTime);
    expect(error.message).toContain("2026-01-20");
    expect(error.code).toBe("APPOINTMENT_SLOT_UNAVAILABLE");
    expect(error.statusCode).toBe(409);
  });
});

describe("AppointmentOutsideAvailabilityError", () => {
  it("creates error with correct message", () => {
    const error = new AppointmentOutsideAvailabilityError();
    expect(error.message).toBe("Requested time is outside available hours");
    expect(error.code).toBe("APPOINTMENT_OUTSIDE_AVAILABILITY");
    expect(error.statusCode).toBe(400);
  });
});

describe("AppointmentInsufficientNoticeError", () => {
  it("creates error with hours in message", () => {
    const error = new AppointmentInsufficientNoticeError(24);
    expect(error.message).toBe("Appointments require at least 24 hours notice");
    expect(error.code).toBe("APPOINTMENT_INSUFFICIENT_NOTICE");
    expect(error.statusCode).toBe(400);
  });
});

describe("AppointmentTooFarAdvanceError", () => {
  it("creates error with days in message", () => {
    const error = new AppointmentTooFarAdvanceError(14);
    expect(error.message).toBe("Appointments can only be booked up to 14 days in advance");
    expect(error.code).toBe("APPOINTMENT_TOO_FAR_ADVANCE");
    expect(error.statusCode).toBe(400);
  });
});

describe("SchedulingAccessDeniedError", () => {
  it("creates error with resource in message", () => {
    const error = new SchedulingAccessDeniedError("event-type-123");
    expect(error.message).toBe("Access denied to scheduling resource: event-type-123");
    expect(error.code).toBe("SCHEDULING_ACCESS_DENIED");
    expect(error.statusCode).toBe(403);
  });
});
```

- **MIRROR**: `src/features/projects/tests/errors.test.ts:1-68`
- **IMPORTS**: `import { describe, expect, it } from "bun:test"`
- **PATTERN**: Test error construction, verify all properties, test instanceof
- **VALIDATE**: `bun test src/features/scheduling/tests/errors.test.ts`

### Task 8: Generate and run database migration

- **ACTION**: Generate migration from schema changes
- **IMPLEMENT**:
  1. Run `bun run db:generate` to generate migration
  2. Review generated SQL in `drizzle/migrations/`
  3. Run `bun run db:push` to apply to development database (or `bun run db:migrate` for production)
- **GOTCHA**: Ensure DATABASE_URL is set in environment
- **VALIDATE**:
  - Migration file exists in `drizzle/migrations/`
  - Tables created in database
  - `bun run lint && bun tsc --noEmit` still passes

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `src/features/scheduling/tests/schemas.test.ts` | ~15 cases | Zod schema validation |
| `src/features/scheduling/tests/errors.test.ts` | ~15 cases | Error class construction |

### Edge Cases Checklist

- [x] Time format validation (HH:MM with leading zeros)
- [x] Day of week bounds (0-6)
- [x] Duration bounds (5-480 minutes)
- [x] Notice period bounds (0-168 hours)
- [x] Advance booking bounds (1-90 days)
- [x] Email format validation
- [x] UUID format validation
- [x] Empty string inputs
- [x] Null vs undefined handling

---

## Validation Commands

### Level 1: STATIC_ANALYSIS
```bash
bun run lint && bun tsc --noEmit
```
**EXPECT**: Exit 0, no errors or warnings

### Level 2: UNIT_TESTS
```bash
bun test src/features/scheduling/tests/
```
**EXPECT**: All tests pass

### Level 3: FULL_SUITE
```bash
bun test && bun run build
```
**EXPECT**: All tests pass, build succeeds

### Level 4: DATABASE_VALIDATION
```bash
bun run db:generate
```
**EXPECT**: Migration generated with correct SQL for all 3 tables

---

## Acceptance Criteria

- [x] Three tables defined in schema (`event_types`, `availability_windows`, `appointments`)
- [ ] All tables have proper foreign keys with cascade delete
- [ ] All tables include `timestamps` (createdAt, updatedAt)
- [ ] Type inference works (`EventType`, `NewEventType`, etc.)
- [ ] Zod schemas validate inputs with appropriate constraints
- [ ] Error classes have `code` and `statusCode` properties
- [ ] All tests pass
- [ ] Static analysis passes (lint + tsc)

---

## Completion Checklist

- [ ] Task 1: Schema tables added
- [ ] Task 2: models.ts created
- [ ] Task 3: schemas.ts created
- [ ] Task 4: errors.ts created
- [ ] Task 5: index.ts created
- [ ] Task 6: schemas.test.ts created
- [ ] Task 7: errors.test.ts created
- [ ] Task 8: Migration generated
- [ ] Level 1: `bun run lint && bun tsc --noEmit` passes
- [ ] Level 2: `bun test src/features/scheduling/tests/` passes
- [ ] Level 3: `bun test && bun run build` succeeds

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Time column type compatibility | LOW | MEDIUM | Use `time` type which maps to PostgreSQL TIME, store as string (HH:MM) |
| Timezone confusion with `time` vs `timestamp` | MEDIUM | HIGH | `time` is timezone-agnostic (local time), `timestamp` stores UTC. Document clearly. |
| Drizzle version incompatibility | LOW | HIGH | Use exact column types from drizzle-orm/pg-core, test migration |

---

## Notes

**Design Decisions:**

1. **Day of week as smallint**: Using 0-6 (ISO standard: 0=Sunday) instead of enum. Simpler, works with JavaScript's `Date.getDay()`.

2. **Time as `time` type**: PostgreSQL `TIME` stores time-of-day without date or timezone. Perfect for recurring availability (e.g., "9am-5pm"). Returns as string "HH:MM:SS".

3. **Timestamp for appointments**: Full datetime with timezone for actual bookings. Store in UTC.

4. **Status as text**: Using text field with default "confirmed" instead of enum. Easier to extend later (add "pending", "completed" etc.) without migration.

5. **Separate `cancelledAt` and `reminderSentAt`**: Track when these events happened for audit trail, not just boolean flags.

**Future Considerations:**

- Phase 2 will add repository functions
- Phase 3 will add slot generation service
- May need to add timezone column to user profile for proper display
