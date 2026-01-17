import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/core/database/client";
import { eventTypes, users } from "@/core/database/schema";
import { getLogger } from "@/core/logging";
import type { EventType, User } from "@/features/scheduling";

import { BookingPageClient } from "./booking-page-client";

const logger = getLogger("booking.page");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ username: string; eventSlug: string }>;
}

export default async function BookingPage({ params }: PageProps) {
  const { username, eventSlug } = await params;

  // Validate user ID format
  if (!UUID_REGEX.test(username)) {
    notFound();
  }

  let user: User | undefined;
  let eventType: EventType | undefined;

  try {
    // Find user by ID (username is actually user ID for now)
    const userResults = await db.select().from(users).where(eq(users.id, username)).limit(1);
    user = userResults[0];

    if (user) {
      // Find event type by slug and user
      const eventTypeResults = await db
        .select()
        .from(eventTypes)
        .where(
          and(
            eq(eventTypes.userId, user.id),
            eq(eventTypes.slug, eventSlug),
            eq(eventTypes.isActive, true),
          ),
        )
        .limit(1);
      eventType = eventTypeResults[0];
    }
  } catch (error) {
    logger.error({ username, eventSlug, error }, "booking.page_load_failed");
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-16">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-8 text-center">
            <h1 className="text-xl font-semibold text-destructive">Unable to load booking page</h1>
            <p className="mt-2 text-muted-foreground">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !eventType) {
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
