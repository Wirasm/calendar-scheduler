"use server";

import { revalidatePath } from "next/cache";

import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";

const logger = getLogger("scheduling.actions");

import {
  CreateAvailabilityWindowSchema,
  createAvailabilityWindow,
  deleteAvailabilityWindow,
  SchedulingError,
  UpdateAvailabilityWindowSchema,
  updateAvailabilityWindow,
} from "@/features/scheduling";

export interface AvailabilityActionState {
  error?: string;
  success?: boolean;
}

type UpdateInput = { dayOfWeek?: number; startTime?: string; endTime?: string };
type ParseResult = { input: UpdateInput } | { error: string };

function parseOptionalUpdateFields(formData: FormData): ParseResult {
  const dayOfWeek = formData.get("dayOfWeek");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");

  const input: UpdateInput = {};

  if (dayOfWeek !== null && dayOfWeek !== "") {
    const parsed = Number(dayOfWeek);
    if (Number.isNaN(parsed)) {
      return { error: "Day of week must be a valid number" };
    }
    input.dayOfWeek = parsed;
  }
  if (startTime !== null && startTime !== "") {
    input.startTime = String(startTime);
  }
  if (endTime !== null && endTime !== "") {
    input.endTime = String(endTime);
  }

  return { input };
}

export async function createAvailabilityWindowAction(
  _prevState: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const dayOfWeekRaw = formData.get("dayOfWeek");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");

  // Validate required fields before type conversion
  if (dayOfWeekRaw === null || dayOfWeekRaw === "") {
    return { error: "Day of week is required" };
  }
  if (startTime === null || startTime === "") {
    return { error: "Start time is required" };
  }
  if (endTime === null || endTime === "") {
    return { error: "End time is required" };
  }

  const dayOfWeek = Number(dayOfWeekRaw);
  if (Number.isNaN(dayOfWeek)) {
    return { error: "Day of week must be a valid number" };
  }

  const result = CreateAvailabilityWindowSchema.safeParse({
    dayOfWeek,
    startTime: String(startTime),
    endTime: String(endTime),
  });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await createAvailabilityWindow(result.data, user.id);
    revalidatePath("/dashboard/scheduling/availability");
    return { success: true };
  } catch (error) {
    if (error instanceof SchedulingError) {
      return { error: error.message };
    }
    logger.error({ error, userId: user.id }, "availability_window.create_action_failed");
    return { error: "Failed to create availability window" };
  }
}

export async function updateAvailabilityWindowAction(
  _prevState: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id");
  if (id === null || id === "") {
    return { error: "Missing window ID" };
  }

  const parseResult = parseOptionalUpdateFields(formData);
  if ("error" in parseResult) {
    return { error: parseResult.error };
  }

  const validationResult = UpdateAvailabilityWindowSchema.safeParse(parseResult.input);
  if (!validationResult.success) {
    return { error: validationResult.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await updateAvailabilityWindow(String(id), validationResult.data, user.id);
    revalidatePath("/dashboard/scheduling/availability");
    return { success: true };
  } catch (error) {
    if (error instanceof SchedulingError) {
      return { error: error.message };
    }
    logger.error(
      { error, windowId: id, userId: user.id },
      "availability_window.update_action_failed",
    );
    return { error: "Failed to update availability window" };
  }
}

export async function deleteAvailabilityWindowAction(
  _prevState: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id");

  if (id === null || id === "") {
    return { error: "Missing window ID" };
  }

  try {
    await deleteAvailabilityWindow(String(id), user.id);
    revalidatePath("/dashboard/scheduling/availability");
    return { success: true };
  } catch (error) {
    if (error instanceof SchedulingError) {
      return { error: error.message };
    }
    logger.error(
      { error, windowId: id, userId: user.id },
      "availability_window.delete_action_failed",
    );
    return { error: "Failed to delete availability window" };
  }
}
