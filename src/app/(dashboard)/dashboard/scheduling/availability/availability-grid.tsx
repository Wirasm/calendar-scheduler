"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AvailabilityWindow } from "@/features/scheduling";

import { type AvailabilityActionState, deleteAvailabilityWindowAction } from "./actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface AvailabilityGridProps {
  windows: AvailabilityWindow[];
  onEdit: (window: AvailabilityWindow) => void;
}

function DeleteButton({ windowId }: { windowId: string }) {
  const [state, formAction, isPending] = useActionState<AvailabilityActionState, FormData>(
    deleteAvailabilityWindowAction,
    {},
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={windowId} />
      <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
        {isPending ? "..." : "Delete"}
      </Button>
      {state.error && <span className="ml-2 text-sm text-destructive">{state.error}</span>}
    </form>
  );
}

export function AvailabilityGrid({ windows, onEdit }: AvailabilityGridProps) {
  // Group windows by day of week
  const windowsByDay = new Map<number, AvailabilityWindow[]>();
  for (let i = 0; i < 7; i++) {
    windowsByDay.set(i, []);
  }
  for (const window of windows) {
    const dayWindows = windowsByDay.get(window.dayOfWeek);
    if (dayWindows) {
      dayWindows.push(window);
    }
  }

  // Sort windows within each day by start time
  for (const dayWindows of windowsByDay.values()) {
    dayWindows.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DAYS.map((dayName, dayIndex) => {
            const dayWindows = windowsByDay.get(dayIndex) ?? [];
            return (
              <div key={dayName} className="flex items-start gap-4">
                <div className="w-24 font-medium text-sm pt-2">{dayName}</div>
                <div className="flex-1">
                  {dayWindows.length > 0 ? (
                    <div className="space-y-2">
                      {dayWindows.map((window) => (
                        <div
                          key={window.id}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <span className="font-mono text-sm">
                            {window.startTime} - {window.endTime}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => onEdit(window)}>
                              Edit
                            </Button>
                            <DeleteButton windowId={window.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground pt-2">No availability set</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
