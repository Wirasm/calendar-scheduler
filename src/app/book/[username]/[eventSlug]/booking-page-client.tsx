"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventType, TimeSlot, User } from "@/features/scheduling";
import { formatDateShort, formatTime } from "@/shared";

import { getAvailableSlotsAction } from "./actions";
import { BookingForm } from "./booking-form";

interface BookingPageClientProps {
  eventType: EventType;
  consultant: User;
}

interface DaySlots {
  date: Date;
  dateString: string;
  slots: TimeSlot[];
}

function groupSlotsByDay(slots: TimeSlot[]): DaySlots[] {
  const grouped = new Map<string, TimeSlot[]>();

  for (const slot of slots) {
    const dateString = slot.startTime.toISOString().split("T")[0] ?? "";
    const existing = grouped.get(dateString);
    if (existing) {
      existing.push(slot);
    } else {
      grouped.set(dateString, [slot]);
    }
  }

  const result: DaySlots[] = [];
  for (const [dateString, daySlots] of grouped) {
    const firstSlot = daySlots[0];
    if (firstSlot) {
      result.push({
        date: new Date(dateString),
        dateString,
        slots: daySlots,
      });
    }
  }

  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function BookingPageClient({ eventType, consultant }: BookingPageClientProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    async function loadSlots() {
      setLoading(true);
      setError(null);
      const result = await getAvailableSlotsAction(eventType.id);
      if (!result.ok) {
        setError(result.error);
      } else {
        const parsedSlots = result.slots.map((slot) => ({
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
        }));
        setSlots(parsedSlots);
      }
      setLoading(false);
    }
    void loadSlots().catch(() => {
      setError("Failed to load available times. Please refresh the page.");
      setLoading(false);
    });
  }, [eventType.id]);

  const daySlots = groupSlotsByDay(slots);
  const selectedDaySlots = selectedDate
    ? (daySlots.find((d) => d.dateString === selectedDate)?.slots ?? [])
    : [];

  if (selectedSlot) {
    return (
      <BookingForm
        eventTypeId={eventType.id}
        selectedSlot={selectedSlot}
        consultantName={consultant.displayName ?? consultant.email}
        eventTypeName={eventType.name}
        durationMinutes={eventType.durationMinutes}
        onCancel={() => setSelectedSlot(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Consultant and Event Info */}
      <Card>
        <CardHeader>
          <CardTitle>{eventType.name}</CardTitle>
          <CardDescription>
            {eventType.durationMinutes} minutes with {consultant.displayName ?? consultant.email}
          </CardDescription>
        </CardHeader>
        {eventType.description && (
          <CardContent>
            <p className="text-sm text-muted-foreground">{eventType.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading available times...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="rounded-md bg-destructive/10 p-4 text-center text-sm text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Slots Available */}
      {!loading && !error && slots.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No available times in the next 2 weeks.</p>
          </CardContent>
        </Card>
      )}

      {/* Date Selection */}
      {!loading && !error && slots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select a Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((day) => (
                <Button
                  key={day.dateString}
                  variant={selectedDate === day.dateString ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedDate(day.dateString);
                    setSelectedSlot(null);
                  }}
                >
                  {formatDateShort(day.date)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Selection */}
      {selectedDate && selectedDaySlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select a Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {selectedDaySlots.map((slot) => (
                <Button
                  key={slot.startTime.toISOString()}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSlot(slot)}
                >
                  {formatTime(slot.startTime)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
