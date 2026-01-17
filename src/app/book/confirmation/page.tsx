import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/core/database/client";
import { appointments, eventTypes, users } from "@/core/database/schema";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                role="img"
                aria-label="Success checkmark"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p>
                <span className="font-medium">Meeting:</span> {eventType.name}
              </p>
              <p>
                <span className="font-medium">With:</span>{" "}
                {consultant.displayName ?? consultant.email}
              </p>
              <p>
                <span className="font-medium">Date:</span> {formatDate(appointment.startTime)}
              </p>
              <p>
                <span className="font-medium">Time:</span> {formatTime(appointment.startTime)} -{" "}
                {formatTime(appointment.endTime)}
              </p>
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
