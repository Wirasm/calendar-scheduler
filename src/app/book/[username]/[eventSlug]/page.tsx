import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/core/database/client";
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
    .where(
      and(
        eq(eventTypes.userId, user.id),
        eq(eventTypes.slug, eventSlug),
        eq(eventTypes.isActive, true),
      ),
    )
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
