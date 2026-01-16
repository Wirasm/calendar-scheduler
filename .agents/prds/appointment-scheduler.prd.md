# Appointment Scheduler

## Problem Statement

Solo consultants receiving 10-50 meeting requests per month waste time on back-and-forth email scheduling. Each booking requires multiple exchanges to find a mutually available time, creating friction for both the consultant and the lead. This manual process doesn't scale and distracts from billable work.

## Evidence

- User testimony: "I get 10-50 requests a month and don't want to manually manage this"
- Common pattern: Cal.com, Calendly built billion-dollar businesses solving this exact problem
- Assumption - needs validation: Time saved per booking (estimate: 5-10 minutes of email exchanges avoided)

## Proposed Solution

A minimal self-serve booking system where leads can view available time slots and book directly. The consultant defines availability windows in advance, and the system handles slot management and email confirmations. No bloat—just the core scheduling loop.

## Key Hypothesis

We believe a simple self-serve booking page will eliminate scheduling friction for solo consultants.
We'll know we're right when 80%+ of bookings happen without email back-and-forth.

## What We're NOT Building

- Team calendars - solopreneurs only, no multi-employee scheduling
- Payment collection - booking is free, payments handled elsewhere
- Google Calendar sync - deferred to v2, start with native calendar
- Complex workflows - no conditional logic, approval chains, or automation rules
- Video conferencing integration - user provides meeting link manually

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Self-serve booking rate | 80%+ | Bookings via link vs manual scheduling |
| Booking completion rate | 70%+ | Started bookings that complete |
| Time to book | < 2 minutes | From landing on page to confirmation |

## Configuration Defaults

| Setting | Default | Rationale |
|---------|---------|-----------|
| Booking form fields | Name, email, optional message | Minimal friction, message gives context |
| Meeting duration | 30 minutes | Standard for initial consultations |
| Booking window | 2 weeks ahead | Not too far (plans change), not too short |
| Minimum notice | 24 hours | Time to prepare, not too restrictive |
| Buffer between meetings | 15 minutes | Wrap up notes, prepare for next |

## Open Questions

- [x] ~~What information to collect from leads?~~ → Name, email, optional message
- [x] ~~Default meeting duration?~~ → 30 minutes
- [x] ~~How far in advance can leads book?~~ → 2 weeks
- [x] ~~Minimum notice period?~~ → 24 hours
- [x] ~~Buffer time between meetings?~~ → 15 minutes

---

## Users & Context

**Primary User**
- **Who**: Solo consultant (initially: the developer building this)
- **Current behavior**: Receives inquiry via website/email → exchanges 2-4 emails to find time → manually adds to calendar
- **Trigger**: Lead expresses interest in meeting
- **Success state**: Lead books slot, both parties get confirmation, meeting appears in calendar

**Job to Be Done**

Three perspectives:

1. **Lead**: When I want to schedule a consultation, I want to see available times and book instantly, so I can secure a slot without back-and-forth emails.

2. **Consultant (booking)**: When a lead wants to meet, I want to send them a booking link, so I can avoid email ping-pong finding a time.

3. **Consultant (planning)**: When I plan my week, I want to define when I'm available for client calls, so I can protect my focus time and only get booked when it works for me.

**Non-Users**
- Multi-employee businesses needing shared calendars
- Users requiring payment integration
- Anyone needing complex scheduling rules or workflows

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Define availability windows (day/time ranges) | Core to controlling when bookings happen |
| Must | Public booking page with available slots | Enables self-serve booking |
| Must | Email confirmation to both parties | Confirms booking happened |
| Must | View/manage upcoming bookings | Consultant needs visibility |
| Should | Cancel/reschedule booking | Flexibility for both parties |
| Should | Reminder emails before meeting | Reduce no-shows |
| Should | Custom intake questions on booking form | Gather context before meeting |
| Could | Embed booking widget on external site | Convenience for website integration |
| Could | Multiple event types (15 min, 30 min, 60 min) | Flexibility for different meeting types |
| Won't | Google Calendar sync | Deferred to v2 - adds OAuth complexity |
| Won't | Team scheduling | Out of scope for solopreneur focus |
| Won't | Payments | Out of scope |

### MVP Scope

The minimum to validate the hypothesis:

1. **Availability management**: Set recurring weekly availability (e.g., Mon-Fri 9am-5pm)
2. **Public booking page**: Shows available 30-minute slots for next 2 weeks
3. **Booking form**: Name, email, optional message
4. **Email confirmations**: Send to both lead and consultant on booking
5. **Bookings list**: View upcoming bookings in admin

### User Flow

**Lead booking flow:**
```
Visit booking page → See available slots → Select slot → Fill form (name, email) → Submit → Confirmation page + email
```

**Consultant flow:**
```
Set availability → Share booking link → Receive booking notification → View in bookings list
```

---

## Technical Approach

**Feasibility**: HIGH

Existing codebase provides all foundational patterns. Appointment scheduling is a new vertical slice feature following established architecture.

**Architecture Notes**

- **Database**: New tables for `availability_windows`, `appointments`, `event_types`
- **Feature structure**: `/src/features/scheduling/` following vertical slice pattern
- **Email**: Add Resend (`bun add resend`) for transactional emails
- **Public routes**: `/book/[username]` for public booking page (no auth required)
- **Admin routes**: `/dashboard/scheduling` for availability and bookings management
- **Timezone**: Store all times in UTC, convert for display (use user's local timezone)

**Key Technical Decisions**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Calendar storage | Native PostgreSQL | Simpler than external sync, full control |
| Time slots | Generated from availability windows | No need to pre-create individual slots |
| Email provider | Resend | Simple API, generous free tier (3k/month) |
| Timezone handling | UTC storage, client-side conversion | Standard practice, avoids confusion |

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Timezone bugs | Medium | Use established library (date-fns-tz or similar), thorough testing |
| Double-booking race condition | Low | Database transaction with row locking on slot check |
| Email deliverability | Low | Resend handles this; add SPF/DKIM records |

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Database schema | Availability, appointments, event types tables | pending | - | - | [Plan](./../plans/scheduling-phase1-database-schema.plan.md) |
| 2 | Availability management | Admin UI to set weekly availability windows | pending | with 3, 5 | 1 | - |
| 3 | Slot generation | Logic to compute available slots from availability | pending | with 2, 5 | 1 | - |
| 4 | Public booking page | Display slots, booking form, create appointment | pending | - | 3, 5 | - |
| 5 | Email notifications | Resend integration, confirmation emails | pending | with 2, 3 | 1 | - |
| 6 | Bookings management | View, cancel upcoming bookings | pending | - | 4 | - |
| 7 | Reminders | Scheduled reminder emails before meetings | pending | - | 5, 6 | - |

### Phase Details

**Phase 1: Database Schema**
- **Goal**: Define data model for scheduling feature
- **Scope**:
  - `event_types` table (name, duration, slug)
  - `availability_windows` table (day of week, start time, end time)
  - `appointments` table (event type, start time, attendee info, status)
- **Success signal**: Migrations run, types generated, no schema errors

**Phase 2: Availability Management**
- **Goal**: Consultant can define when they're available
- **Scope**:
  - Admin page at `/dashboard/scheduling/availability`
  - CRUD for weekly availability windows
  - Visual weekly grid showing availability
- **Success signal**: Can set "Mon-Fri 9am-5pm" and see it reflected

**Phase 3: Slot Generation**
- **Goal**: Compute bookable slots from availability
- **Scope**:
  - Service function: given date range, return available slots
  - Account for existing bookings (no double-booking)
  - Respect minimum notice period and booking window
- **Success signal**: Returns correct slots, excludes booked times

**Phase 4: Public Booking Page**
- **Goal**: Leads can book without authentication
- **Scope**:
  - Public route `/book/[username]`
  - Calendar view showing available days
  - Time slot picker for selected day
  - Booking form (name, email, message)
  - Create appointment on submit
  - Confirmation page
- **Success signal**: End-to-end booking works, appointment created in DB

**Phase 5: Email Notifications**
- **Goal**: Both parties get confirmation emails
- **Scope**:
  - Install and configure Resend
  - Email templates for booking confirmation
  - Send to attendee and consultant on booking
- **Success signal**: Emails delivered on booking

**Phase 6: Bookings Management**
- **Goal**: Consultant can view and manage bookings
- **Scope**:
  - Admin page at `/dashboard/scheduling/bookings`
  - List upcoming bookings with details
  - Cancel booking (sends cancellation email)
- **Success signal**: Can view and cancel bookings

**Phase 7: Reminders**
- **Goal**: Reduce no-shows with reminder emails
- **Scope**:
  - Reminder email template
  - Background job or cron to send reminders (24h before)
  - Mark reminders as sent to avoid duplicates
- **Success signal**: Reminder sent 24h before meeting

### Parallelism Notes

**Execution Waves:**

```
Wave 1:  [Phase 1: Schema] ────────────────────────────►
                │
Wave 2:         ├── [Phase 2: Availability UI] ────────►
                ├── [Phase 3: Slot Generation] ────────►
                └── [Phase 5: Email Setup] ────────────►
                                │
Wave 3:                         └── [Phase 4: Booking Page] ────►
                                                │
Wave 4:                                         └── [Phase 6: Bookings Mgmt] ────►
                                                                │
Wave 5:                                                         └── [Phase 7: Reminders] ────►
```

**Wave 2 Parallelism (after Phase 1 completes):**
- **Phase 2** (Availability UI) - Admin CRUD for availability windows
- **Phase 3** (Slot Generation) - Backend logic to compute available slots
- **Phase 5** (Email Setup) - Resend integration and email templates

These three are independent - they all only need the schema/types from Phase 1. Can be developed in separate git worktrees and merged independently.

**Notes:**
- Phase 4 needs both Phase 3 (slot logic) and Phase 5 (to send confirmation emails)
- Phase 7 (reminders) requires a background job mechanism - consider Vercel Cron or similar

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Calendar system | Native (no Google sync) | Google Calendar API | Simpler MVP, avoid OAuth complexity |
| Slot duration | 30 minutes default | Configurable per event type | Start simple, can add event types later |
| Email provider | Resend | SendGrid, Postmark, AWS SES | Simple API, good DX, generous free tier |
| Booking window | 2 weeks ahead | 1 week, 1 month | Reasonable default, can make configurable |
| Timezone | UTC storage + client display | Store in user timezone | Industry standard, avoids bugs |

---

## Research Summary

**Market Context**
- Cal.com is the dominant open-source solution but complex (~99k LOC monorepo)
- Core scheduling features are well-understood: availability, booking page, confirmations
- Common mistake: over-building with features users don't need (teams, payments, workflows)
- Free tier of Cal.com works but means giving up ownership and customization

**Technical Context**
- Existing codebase has all patterns needed (auth, Drizzle ORM, forms, API routes)
- Vertical slice architecture makes adding scheduling feature straightforward
- Date utilities exist but may need timezone library addition
- No email infrastructure yet - Resend is the recommended addition

---

*Generated: 2026-01-16*
*Status: READY FOR IMPLEMENTATION*
