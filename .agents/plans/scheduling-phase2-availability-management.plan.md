# Feature: Availability Management (Phase 2)

## Summary

Build an admin page at `/dashboard/scheduling/availability` where consultants can define their weekly availability windows. The page displays a visual weekly grid showing when the consultant is available for bookings, with CRUD operations (create, read, update, delete) for availability windows through a dialog form. This enables the core scheduling hypothesis: consultants control when leads can book, eliminating back-and-forth scheduling friction.

## User Story

As a solo consultant
I want to define my weekly availability windows (day/time ranges)
So that leads can only book meetings during times I've designated as available

## Problem Statement

Without defined availability, there are no bookable time slots for the public booking page (Phase 4). The consultant needs a way to specify recurring weekly windows (e.g., "Mon-Fri 9am-5pm") that the system uses to generate available slots.

## Solution Statement

Create a dashboard page with:
1. A visual weekly grid showing all availability windows grouped by day
2. An "Add Availability" button that opens a dialog form with day/time fields
3. Edit and delete actions for each existing window
4. Server actions for CRUD operations backed by repository/service layer

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | scheduling feature, dashboard routes, navigation |
| Dependencies | React Hook Form, Zod v4, shadcn/ui (select component needed), Drizzle ORM |
| Estimated Tasks | 11 |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────┐ ║
║   │  Dashboard Layout - Navigation:                                          │ ║
║   │  [Dashboard] [Projects]                                                  │ ║
║   │                                                                          │ ║
║   │  (No scheduling link exists)                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║   USER_FLOW: Consultant has no way to define availability                     ║
║   PAIN_POINT: Booking page (Phase 4) cannot show available slots              ║
║   DATA_FLOW: None - no availability data exists                               ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────┐ ║
║   │  Dashboard Layout - Navigation:                                          │ ║
║   │  [Dashboard] [Projects] [Scheduling]                                     │ ║
║   └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────┐ ║
║   │  /dashboard/scheduling/availability                                      │ ║
║   │  ┌────────────────────────────────────────────────────────────────────┐ │ ║
║   │  │  Weekly Availability                          [+ Add Availability] │ │ ║
║   │  ├────────────────────────────────────────────────────────────────────┤ │ ║
║   │  │                                                                    │ │ ║
║   │  │  Monday       ┌─────────────────────────────────────────────┐     │ │ ║
║   │  │               │ 09:00 - 17:00          [Edit] [Delete]      │     │ │ ║
║   │  │               └─────────────────────────────────────────────┘     │ │ ║
║   │  │                                                                    │ │ ║
║   │  │  Tuesday      ┌─────────────────────────────────────────────┐     │ │ ║
║   │  │               │ 09:00 - 12:00          [Edit] [Delete]      │     │ │ ║
║   │  │               ├─────────────────────────────────────────────┤     │ │ ║
║   │  │               │ 14:00 - 17:00          [Edit] [Delete]      │     │ │ ║
║   │  │               └─────────────────────────────────────────────┘     │ │ ║
║   │  │                                                                    │ │ ║
║   │  │  Wednesday    (No availability set)                               │ │ ║
║   │  │  ...                                                              │ │ ║
║   │  └────────────────────────────────────────────────────────────────────┘ │ ║
║   └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────┐ ║
║   │  Add/Edit Availability Dialog                                            │ ║
║   │  ┌────────────────────────────────────────────────────────────────────┐ │ ║
║   │  │  Day of Week:  [Select: Monday ▼]                                 │ │ ║
║   │  │  Start Time:   [09:00]                                            │ │ ║
║   │  │  End Time:     [17:00]                                            │ │ ║
║   │  │                                                                    │ │ ║
║   │  │                              [Cancel] [Save]                       │ │ ║
║   │  └────────────────────────────────────────────────────────────────────┘ │ ║
║   └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║   USER_FLOW:                                                                  ║
║   1. Navigate to Scheduling → Availability                                    ║
║   2. Click "+ Add Availability"                                               ║
║   3. Select day (Monday), set times (09:00 - 17:00)                          ║
║   4. Click Save → window appears in weekly grid                              ║
║   5. Edit or delete via actions on each window                               ║
║                                                                               ║
║   VALUE_ADD: Consultant defines when they're bookable, enables Phase 4       ║
║   DATA_FLOW:                                                                  ║
║   Dialog Form → Server Action → Service → Repository → Database              ║
║   Database → Server Component → Weekly Grid Display                          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Dashboard nav | No scheduling link | "Scheduling" dropdown/link | Can access availability |
| `/dashboard/scheduling/availability` | 404 | Weekly grid + CRUD | Can define availability |
| Add dialog | N/A | Form with day/time fields | Can create windows |
| Edit action | N/A | Pre-filled dialog | Can modify windows |
| Delete action | N/A | Confirmation + delete | Can remove windows |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/features/scheduling/schemas.ts` | 44-82 | Existing Zod schemas for availability windows |
| P0 | `src/features/scheduling/errors.ts` | 46-63 | Error classes to use (AvailabilityWindowNotFoundError, OverlapError) |
| P0 | `src/features/scheduling/models.ts` | 1-14 | Types to import (AvailabilityWindow, NewAvailabilityWindow) |
| P0 | `src/features/projects/repository.ts` | 1-63 | Repository pattern to MIRROR exactly |
| P0 | `src/features/projects/service.ts` | 1-200 | Service pattern to MIRROR exactly |
| P1 | `src/app/(dashboard)/layout.tsx` | 1-47 | Navigation structure to UPDATE |
| P1 | `src/app/(dashboard)/dashboard/page.tsx` | 1-73 | Page structure to MIRROR |
| P1 | `src/app/(auth)/login/actions.ts` | 1-35 | Server action signature pattern |
| P1 | `src/app/(auth)/login/page.tsx` | 1-65 | useActionState form pattern |
| P2 | `src/features/projects/tests/service.test.ts` | 1-100 | Test pattern to FOLLOW |
| P2 | `src/components/ui/dialog.tsx` | 1-130 | Dialog component API |
| P2 | `src/components/ui/form.tsx` | 1-150 | React Hook Form integration |

**External Documentation:**

| Source | Section | Why Needed |
|--------|---------|------------|
| [React Hook Form v7](https://react-hook-form.com/docs) | useForm, Controller | Form state management |
| [Zod v4](https://zod.dev) | Schemas, refinements | Already using v4, import from `zod/v4` |
| [shadcn/ui Select](https://ui.shadcn.com/docs/components/select) | Component API | Need to add select component |

---

## Patterns to Mirror

**NAMING_CONVENTION:**
```typescript
// SOURCE: src/features/projects/service.ts:10-15
// COPY THIS PATTERN:
export async function createProject(input: CreateProjectInput, ownerId: string): Promise<Project>
export async function getProject(id: string, userId: string | null): Promise<Project>
export async function updateProject(id: string, input: UpdateProjectInput, userId: string): Promise<Project>
export async function deleteProject(id: string, userId: string): Promise<void>

// FOR AVAILABILITY:
export async function createAvailabilityWindow(input: CreateAvailabilityWindowInput, userId: string): Promise<AvailabilityWindow>
export async function getAvailabilityWindowsByUser(userId: string): Promise<AvailabilityWindow[]>
export async function updateAvailabilityWindow(id: string, input: UpdateAvailabilityWindowInput, userId: string): Promise<AvailabilityWindow>
export async function deleteAvailabilityWindow(id: string, userId: string): Promise<void>
```

**ERROR_HANDLING:**
```typescript
// SOURCE: src/features/scheduling/errors.ts:46-63
// ALREADY EXISTS - USE THESE:
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
```

**LOGGING_PATTERN:**
```typescript
// SOURCE: src/features/projects/service.ts:1-8, 25-30
// COPY THIS PATTERN:
import { getLogger } from "@/core/logging";
const logger = getLogger("scheduling.service");

// In functions:
logger.info({ userId }, "availability_window.create_started");
logger.info({ windowId: window.id }, "availability_window.create_completed");
logger.error({ windowId: id, error }, "availability_window.update_failed");
```

**REPOSITORY_PATTERN:**
```typescript
// SOURCE: src/features/projects/repository.ts:8-55
// COPY THIS PATTERN:
export async function findById(id: string): Promise<AvailabilityWindow | undefined> {
  const results = await db.select().from(availabilityWindows).where(eq(availabilityWindows.id, id)).limit(1);
  return results[0];
}

export async function findByUserId(userId: string): Promise<AvailabilityWindow[]> {
  return db.select().from(availabilityWindows).where(eq(availabilityWindows.userId, userId));
}

export async function create(data: NewAvailabilityWindow): Promise<AvailabilityWindow> {
  const results = await db.insert(availabilityWindows).values(data).returning();
  const window = results[0];
  if (!window) {
    throw new Error("Failed to create availability window");
  }
  return window;
}

export async function update(
  id: string,
  data: Partial<Pick<AvailabilityWindow, "dayOfWeek" | "startTime" | "endTime">>,
): Promise<AvailabilityWindow | undefined> {
  const results = await db
    .update(availabilityWindows)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(availabilityWindows.id, id))
    .returning();
  return results[0];
}

export async function deleteById(id: string): Promise<boolean> {
  const results = await db.delete(availabilityWindows).where(eq(availabilityWindows.id, id)).returning();
  return results.length > 0;
}
```

**SERVICE_PATTERN:**
```typescript
// SOURCE: src/features/projects/service.ts:68-85
// COPY THIS PATTERN for access control:
export async function getAvailabilityWindow(id: string, userId: string): Promise<AvailabilityWindow> {
  logger.info({ windowId: id, userId }, "availability_window.get_started");

  const window = await repository.findById(id);

  if (!window) {
    logger.warn({ windowId: id }, "availability_window.get_not_found");
    throw new AvailabilityWindowNotFoundError(id);
  }

  if (window.userId !== userId) {
    logger.warn({ windowId: id, userId }, "availability_window.access_denied");
    throw new SchedulingAccessDeniedError(`availability_window:${id}`);
  }

  logger.info({ windowId: id }, "availability_window.get_completed");
  return window;
}
```

**SERVER_ACTION_PATTERN:**
```typescript
// SOURCE: src/app/(auth)/login/actions.ts:1-35
// COPY THIS PATTERN:
"use server";

export interface AvailabilityActionState {
  error?: string;
  success?: boolean;
}

export async function createAvailabilityWindowAction(
  _prevState: AvailabilityActionState,
  formData: FormData
): Promise<AvailabilityActionState> {
  // 1. Get user from Supabase
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // 2. Parse and validate form data
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  // 3. Validate with Zod
  const result = CreateAvailabilityWindowSchema.safeParse({ dayOfWeek, startTime, endTime });
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Invalid input" };
  }

  // 4. Call service
  try {
    await createAvailabilityWindow(result.data, user.id);
    revalidatePath("/dashboard/scheduling/availability");
    return { success: true };
  } catch (error) {
    if (error instanceof SchedulingError) {
      return { error: error.message };
    }
    return { error: "Failed to create availability window" };
  }
}
```

**TEST_STRUCTURE:**
```typescript
// SOURCE: src/features/projects/tests/service.test.ts:1-30
// COPY THIS PATTERN:
import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { AvailabilityWindow } from "../models";

const mockRepository = {
  findById: mock<(id: string) => Promise<AvailabilityWindow | undefined>>(() => Promise.resolve(undefined)),
  findByUserId: mock<(userId: string) => Promise<AvailabilityWindow[]>>(() => Promise.resolve([])),
  create: mock<(data: unknown) => Promise<AvailabilityWindow>>(() => Promise.resolve({} as AvailabilityWindow)),
  update: mock<(id: string, data: unknown) => Promise<AvailabilityWindow | undefined>>(() => Promise.resolve(undefined)),
  deleteById: mock<(id: string) => Promise<boolean>>(() => Promise.resolve(false)),
};

mock.module("../repository", () => mockRepository);

// Import service AFTER mocking
const { createAvailabilityWindow, getAvailabilityWindowsByUser } = await import("../service");

describe("createAvailabilityWindow", () => {
  beforeEach(() => {
    mockRepository.create.mockReset();
    mockRepository.findByUserId.mockReset();
  });

  it("creates window when no overlap", async () => {
    mockRepository.findByUserId.mockResolvedValue([]);
    mockRepository.create.mockResolvedValue(mockWindow);

    const result = await createAvailabilityWindow(input, userId);

    expect(result).toEqual(mockWindow);
    expect(mockRepository.create).toHaveBeenCalledTimes(1);
  });
});
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/components/ui/select.tsx` | CREATE (via shadcn) | Need select for day of week dropdown |
| `src/features/scheduling/repository.ts` | CREATE | Database operations for availability windows |
| `src/features/scheduling/service.ts` | CREATE | Business logic layer with logging, validation, access control |
| `src/features/scheduling/index.ts` | UPDATE | Export new service functions |
| `src/app/(dashboard)/layout.tsx` | UPDATE | Add "Scheduling" to navigation |
| `src/app/(dashboard)/dashboard/scheduling/availability/page.tsx` | CREATE | Main availability page (server component) |
| `src/app/(dashboard)/dashboard/scheduling/availability/actions.ts` | CREATE | Server actions for CRUD |
| `src/app/(dashboard)/dashboard/scheduling/availability/availability-form.tsx` | CREATE | Client component with React Hook Form dialog |
| `src/app/(dashboard)/dashboard/scheduling/availability/availability-grid.tsx` | CREATE | Client component for weekly grid display |
| `src/features/scheduling/tests/service.test.ts` | CREATE | Unit tests for service layer |
| `src/features/scheduling/tests/repository.test.ts` | CREATE | Unit tests for repository (optional, lower priority) |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **Timezone handling UI** - Store in UTC, let browser handle display; complex timezone selector deferred
- **Recurring exceptions** - No "except Dec 25" functionality; just weekly recurring windows
- **Drag-and-drop grid editing** - Too complex for MVP; use dialog forms instead
- **Multiple event types per availability** - One availability config for the user; event types come in Phase 3
- **Copy availability from previous week** - Nice-to-have, not MVP
- **Bulk delete** - Delete one at a time via individual actions
- **Availability templates** - Pre-set "office hours" templates deferred
- **API routes** - Using Server Actions instead; API routes can be added if needed for external integrations

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: ADD Select component from shadcn

- **ACTION**: Add shadcn/ui select component
- **COMMAND**: `bunx shadcn@canary add select`
- **POST**: Run `bun run lint:fix` to format
- **VALIDATE**: `npx tsc --noEmit` - component compiles

### Task 2: CREATE `src/features/scheduling/repository.ts`

- **ACTION**: CREATE database operations for availability windows
- **IMPLEMENT**: `findById`, `findByUserId`, `findByUserIdAndDay`, `create`, `update`, `deleteById`
- **MIRROR**: `src/features/projects/repository.ts:1-63`
- **IMPORTS**:
  ```typescript
  import { and, eq } from "drizzle-orm";
  import { db } from "@/core/database/client";
  import { availabilityWindows, type AvailabilityWindow, type NewAvailabilityWindow } from "./models";
  ```
- **GOTCHA**: Use `results[0]` pattern with `noUncheckedIndexedAccess` - type will be `T | undefined`
- **GOTCHA**: `findByUserIdAndDay` needed for overlap checking in service
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 3: CREATE `src/features/scheduling/service.ts`

- **ACTION**: CREATE business logic layer for availability windows
- **IMPLEMENT**:
  - `createAvailabilityWindow(input, userId)` - checks for overlap, creates window
  - `getAvailabilityWindowsByUser(userId)` - returns all windows for user
  - `getAvailabilityWindow(id, userId)` - single window with access control
  - `updateAvailabilityWindow(id, input, userId)` - update with access control and overlap check
  - `deleteAvailabilityWindow(id, userId)` - delete with access control
- **MIRROR**: `src/features/projects/service.ts:1-200`
- **IMPORTS**:
  ```typescript
  import { getLogger } from "@/core/logging";
  import { AvailabilityWindowNotFoundError, AvailabilityWindowOverlapError, SchedulingAccessDeniedError } from "./errors";
  import type { CreateAvailabilityWindowInput, UpdateAvailabilityWindowInput } from "./schemas";
  import * as repository from "./repository";
  ```
- **OVERLAP CHECK LOGIC**:
  ```typescript
  // Check if new window overlaps with existing windows on same day
  function checkOverlap(existing: AvailabilityWindow[], newWindow: { startTime: string; endTime: string }): boolean {
    for (const window of existing) {
      // Overlap exists if: new.start < existing.end AND new.end > existing.start
      if (newWindow.startTime < window.endTime && newWindow.endTime > window.startTime) {
        return true;
      }
    }
    return false;
  }
  ```
- **LOGGING**: Use `availability_window.{action}_{state}` pattern
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 4: UPDATE `src/features/scheduling/index.ts`

- **ACTION**: Export service functions from feature index
- **ADD**:
  ```typescript
  // Service functions
  export {
    createAvailabilityWindow,
    getAvailabilityWindowsByUser,
    getAvailabilityWindow,
    updateAvailabilityWindow,
    deleteAvailabilityWindow,
  } from "./service";
  ```
- **VALIDATE**: `npx tsc --noEmit`

### Task 5: UPDATE `src/app/(dashboard)/layout.tsx`

- **ACTION**: Add "Scheduling" link to dashboard navigation
- **LOCATION**: After Projects link (around line 30-32)
- **IMPLEMENT**:
  ```typescript
  <a
    href="/dashboard/scheduling/availability"
    className="text-muted-foreground hover:text-foreground transition-colors"
  >
    Scheduling
  </a>
  ```
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 6: CREATE `src/app/(dashboard)/dashboard/scheduling/availability/actions.ts`

- **ACTION**: CREATE server actions for CRUD operations
- **IMPLEMENT**:
  - `createAvailabilityWindowAction(_prevState, formData)`
  - `updateAvailabilityWindowAction(_prevState, formData)`
  - `deleteAvailabilityWindowAction(_prevState, formData)`
- **MIRROR**: `src/app/(auth)/login/actions.ts:1-35` for signature pattern
- **IMPORTS**:
  ```typescript
  "use server";
  import { revalidatePath } from "next/cache";
  import { createClient } from "@/core/supabase/server";
  import { createAvailabilityWindow, updateAvailabilityWindow, deleteAvailabilityWindow } from "@/features/scheduling";
  import { CreateAvailabilityWindowSchema, UpdateAvailabilityWindowSchema } from "@/features/scheduling";
  import { SchedulingError } from "@/features/scheduling";
  ```
- **STATE TYPE**:
  ```typescript
  export interface AvailabilityActionState {
    error?: string;
    success?: boolean;
    windowId?: string; // For edit modal to know which window
  }
  ```
- **GOTCHA**: Use `revalidatePath("/dashboard/scheduling/availability")` after mutations
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 7: CREATE `src/app/(dashboard)/dashboard/scheduling/availability/availability-grid.tsx`

- **ACTION**: CREATE client component for weekly grid display
- **IMPLEMENT**:
  - Accept `windows: AvailabilityWindow[]` prop
  - Group windows by dayOfWeek
  - Display 7-day grid with day names
  - Show time ranges for each window
  - Include Edit and Delete buttons per window
- **MIRROR**: Card layout from `src/app/(dashboard)/dashboard/page.tsx:20-69`
- **IMPORTS**:
  ```typescript
  "use client";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import type { AvailabilityWindow } from "@/features/scheduling";
  ```
- **DAY NAMES**:
  ```typescript
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  ```
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 8: CREATE `src/app/(dashboard)/dashboard/scheduling/availability/availability-form.tsx`

- **ACTION**: CREATE client component with dialog form for add/edit
- **IMPLEMENT**:
  - Dialog with form for dayOfWeek (select), startTime (time input), endTime (time input)
  - useActionState for form submission
  - Controlled dialog open state
  - Error display from action state
  - Close on success
- **MIRROR**: `src/app/(auth)/login/page.tsx:1-65` for useActionState pattern
- **IMPORTS**:
  ```typescript
  "use client";
  import { useActionState, useState, useEffect } from "react";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { createAvailabilityWindowAction, updateAvailabilityWindowAction, type AvailabilityActionState } from "./actions";
  import type { AvailabilityWindow } from "@/features/scheduling";
  ```
- **GOTCHA**: Use native `type="time"` for time inputs - returns "HH:MM" format matching schema
- **GOTCHA**: For edit, pre-fill form with existing window data
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 9: CREATE `src/app/(dashboard)/dashboard/scheduling/availability/page.tsx`

- **ACTION**: CREATE main availability page (server component)
- **IMPLEMENT**:
  - Fetch current user from Supabase
  - Fetch user's availability windows from service
  - Render page header with "Add Availability" button
  - Render AvailabilityGrid component with windows
- **MIRROR**: `src/app/(dashboard)/dashboard/page.tsx:5-69` for structure
- **IMPORTS**:
  ```typescript
  import { createClient } from "@/core/supabase/server";
  import { redirect } from "next/navigation";
  import { getAvailabilityWindowsByUser } from "@/features/scheduling";
  import { AvailabilityGrid } from "./availability-grid";
  import { AvailabilityForm } from "./availability-form";
  ```
- **GOTCHA**: Layout already handles auth redirect, but double-check user exists for type safety
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 10: CREATE `src/features/scheduling/tests/service.test.ts`

- **ACTION**: CREATE unit tests for service layer
- **IMPLEMENT**:
  - Test `createAvailabilityWindow` - success case, overlap rejection
  - Test `getAvailabilityWindowsByUser` - returns windows for user
  - Test `getAvailabilityWindow` - not found error, access denied error
  - Test `updateAvailabilityWindow` - success, not found, access denied, overlap on update
  - Test `deleteAvailabilityWindow` - success, not found, access denied
- **MIRROR**: `src/features/projects/tests/service.test.ts:1-100`
- **MOCK DATA**:
  ```typescript
  const mockWindow: AvailabilityWindow = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    userId: "550e8400-e29b-41d4-a716-446655440001",
    dayOfWeek: 1, // Monday
    startTime: "09:00",
    endTime: "17:00",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  ```
- **VALIDATE**: `bun test src/features/scheduling/tests/service.test.ts`

### Task 11: INTEGRATION TEST - End-to-end verification

- **ACTION**: Manual verification in browser
- **STEPS**:
  1. Start dev server: `bun run dev`
  2. Navigate to `/dashboard/scheduling/availability`
  3. Click "Add Availability"
  4. Select Monday, 09:00-17:00, save
  5. Verify window appears in grid
  6. Click Edit, change to 09:00-12:00, save
  7. Verify window updated in grid
  8. Click Delete, confirm
  9. Verify window removed from grid
  10. Add overlapping window on same day - verify error shown
- **VALIDATE**: All CRUD operations work, overlap detection works

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `src/features/scheduling/tests/service.test.ts` | create success, create overlap, get not found, get access denied, update success, update overlap, delete success | Business logic |
| `src/features/scheduling/tests/schemas.test.ts` | (already exists) | Zod validation |
| `src/features/scheduling/tests/errors.test.ts` | (already exists) | Error classes |

### Edge Cases Checklist

- [ ] Create window with startTime >= endTime → validation error
- [ ] Create overlapping window on same day → AvailabilityWindowOverlapError
- [ ] Get window that doesn't exist → AvailabilityWindowNotFoundError
- [ ] Get window owned by different user → SchedulingAccessDeniedError
- [ ] Update to overlap with another window → AvailabilityWindowOverlapError
- [ ] Update non-existent window → AvailabilityWindowNotFoundError
- [ ] Delete non-existent window → AvailabilityWindowNotFoundError
- [ ] Invalid time format (not HH:MM) → validation error
- [ ] Day of week outside 0-6 range → validation error
- [ ] Unauthenticated user → redirect to login (layout handles this)

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
**EXPECT**: All tests pass

### Level 3: FULL_SUITE
```bash
bun test && bun run build
```
**EXPECT**: All tests pass, build succeeds

### Level 4: DATABASE_VALIDATION
Use Drizzle Studio or direct query to verify:
```bash
bun run db:studio
```
- [ ] `availability_windows` table accessible
- [ ] Can insert/select/update/delete rows

### Level 5: BROWSER_VALIDATION
Start dev server and verify manually:
```bash
bun run dev
```
Navigate to `http://localhost:3000/dashboard/scheduling/availability`
- [ ] Page loads with weekly grid
- [ ] Add button opens dialog
- [ ] Form validates input (try invalid time)
- [ ] Create window appears in grid
- [ ] Edit updates window
- [ ] Delete removes window
- [ ] Overlap rejection shows error in dialog

### Level 6: MANUAL_VALIDATION
Full user flow testing:
1. Log in to dashboard
2. Navigate to Scheduling in nav
3. Add availability for Mon-Fri 9am-5pm (5 windows)
4. Edit Tuesday to 10am-4pm
5. Delete Wednesday
6. Try to add overlapping window on Monday 10am-12pm → should fail
7. Verify grid reflects all changes

---

## Acceptance Criteria

- [ ] Dashboard navigation includes "Scheduling" link
- [ ] `/dashboard/scheduling/availability` renders weekly grid
- [ ] User can create availability window via dialog form
- [ ] User can edit existing availability window
- [ ] User can delete existing availability window
- [ ] Overlapping windows on same day are rejected with clear error
- [ ] Invalid time formats are rejected (Zod validation)
- [ ] Only authenticated user can access (layout redirect)
- [ ] User can only see/modify their own windows (access control)
- [ ] All static analysis passes (`bun run lint && npx tsc --noEmit`)
- [ ] All unit tests pass (`bun test`)
- [ ] Build succeeds (`bun run build`)

---

## Completion Checklist

- [ ] Task 1: Select component added
- [ ] Task 2: Repository created and compiles
- [ ] Task 3: Service created with overlap logic
- [ ] Task 4: Index exports updated
- [ ] Task 5: Navigation updated
- [ ] Task 6: Server actions created
- [ ] Task 7: Grid component created
- [ ] Task 8: Form component created
- [ ] Task 9: Page component created
- [ ] Task 10: Service tests created and passing
- [ ] Task 11: Integration test passes
- [ ] Level 1: `bun run lint && npx tsc --noEmit` passes
- [ ] Level 2: `bun test src/features/scheduling/tests/` passes
- [ ] Level 3: `bun test && bun run build` succeeds
- [ ] Level 5: Browser validation complete
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Time input browser inconsistency | LOW | MEDIUM | Use native `type="time"` with HH:MM format; works in all modern browsers |
| Overlap detection edge cases | MEDIUM | LOW | Clear overlap logic with string comparison (times are HH:MM format, lexicographic comparison works) |
| Dialog state management complexity | MEDIUM | LOW | Use controlled dialog with useState, close on success via useEffect watching state.success |
| Form reset after successful submission | MEDIUM | LOW | Reset form state when dialog closes; use key prop to force remount |

---

## Notes

**Architecture Decision**: Using Server Actions instead of API routes because:
1. Simpler code - no separate route files
2. Better type safety with `useActionState`
3. Automatic revalidation with `revalidatePath`
4. API routes can be added later if needed for external integrations

**Overlap Detection**: Using string comparison for times because they're stored as "HH:MM" format. "09:00" < "17:00" lexicographically, which works for 24-hour time.

**Form Library Choice**: Using native HTML forms with `useActionState` instead of React Hook Form for this simple form (3 fields). React Hook Form's shadcn integration (`form.tsx`) is available if forms get more complex.

**Future Enhancement**: Phase 3 (Slot Generation) will use these availability windows to compute bookable slots. The repository's `findByUserId` will be called by slot generation logic.
