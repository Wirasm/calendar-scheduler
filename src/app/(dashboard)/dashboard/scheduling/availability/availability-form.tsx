"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AvailabilityWindow } from "@/features/scheduling";

import {
  type AvailabilityActionState,
  createAvailabilityWindowAction,
  updateAvailabilityWindowAction,
} from "./actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const initialState: AvailabilityActionState = {};

interface AvailabilityFormProps {
  editWindow?: AvailabilityWindow | null;
  onClose: () => void;
  open: boolean;
}

export function AvailabilityForm({ editWindow, onClose, open }: AvailabilityFormProps) {
  const isEdit = editWindow !== null && editWindow !== undefined;
  const action = isEdit ? updateAvailabilityWindowAction : createAvailabilityWindowAction;

  const [state, formAction, isPending] = useActionState<AvailabilityActionState, FormData>(
    action,
    initialState,
  );

  const [dayOfWeek, setDayOfWeek] = useState<string>(
    editWindow ? String(editWindow.dayOfWeek) : "1",
  );
  const [startTime, setStartTime] = useState(editWindow?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(editWindow?.endTime ?? "17:00");

  // Reset form when editWindow changes
  useEffect(() => {
    if (editWindow) {
      setDayOfWeek(String(editWindow.dayOfWeek));
      setStartTime(editWindow.startTime);
      setEndTime(editWindow.endTime);
    } else {
      setDayOfWeek("1");
      setStartTime("09:00");
      setEndTime("17:00");
    }
  }, [editWindow]);

  // Close dialog on success
  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Availability" : "Add Availability"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={editWindow.id} />}

          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="dayOfWeek">Day of Week</Label>
            <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day, index) => (
                  <SelectItem key={day} value={String(index)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
