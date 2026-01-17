"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateFull, formatTime } from "@/shared";

import { createBookingAction, initialBookingState } from "./actions";

interface BookingFormProps {
  eventTypeId: string;
  selectedSlot: { startTime: Date; endTime: Date };
  consultantName: string;
  eventTypeName: string;
  durationMinutes: number;
  onCancel: () => void;
}

export function BookingForm({
  eventTypeId,
  selectedSlot,
  consultantName,
  eventTypeName,
  durationMinutes,
  onCancel,
}: BookingFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createBookingAction, initialBookingState);

  useEffect(() => {
    if (state.status === "success") {
      const params = new URLSearchParams({ id: state.appointmentId });
      if (!state.emailSent) {
        params.set("emailWarning", "true");
      }
      router.push(`/book/confirmation?${params.toString()}`);
    }
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{eventTypeName}</CardTitle>
        <CardDescription>
          {durationMinutes} minutes with {consultantName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg bg-muted p-4">
          <p className="font-medium">{formatDateFull(selectedSlot.startTime)}</p>
          <p className="text-sm text-muted-foreground">
            {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="eventTypeId" value={eventTypeId} />
          <input type="hidden" name="startTime" value={selectedSlot.startTime.toISOString()} />

          {state.status === "error" && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="attendeeName">Your Name</Label>
            <Input
              id="attendeeName"
              name="attendeeName"
              required
              minLength={2}
              maxLength={100}
              placeholder="John Doe"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="attendeeEmail">Your Email</Label>
            <Input
              id="attendeeEmail"
              name="attendeeEmail"
              type="email"
              required
              placeholder="john@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="attendeeMessage">Message (optional)</Label>
            <Textarea
              id="attendeeMessage"
              name="attendeeMessage"
              maxLength={1000}
              rows={3}
              placeholder="Anything you'd like to share before the meeting..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Back
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
