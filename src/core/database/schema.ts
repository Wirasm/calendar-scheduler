import {
  boolean,
  integer,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Base timestamp columns for all tables.
 * Usage: ...timestamps
 */
export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
};

/**
 * Users table - syncs with Supabase Auth via database trigger.
 *
 * To set up the trigger in Supabase SQL Editor:
 *
 * ```sql
 * -- Function to sync auth.users to public.users
 * CREATE OR REPLACE FUNCTION public.handle_new_user()
 * RETURNS trigger AS $$
 * BEGIN
 *   INSERT INTO public.users (id, email)
 *   VALUES (NEW.id, NEW.email);
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 *
 * -- Trigger on auth.users insert
 * CREATE OR REPLACE TRIGGER on_auth_user_created
 *   AFTER INSERT ON auth.users
 *   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
 * ```
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // References auth.users(id)
  email: text("email").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

/**
 * Projects table - stores project information with ownership.
 */
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
