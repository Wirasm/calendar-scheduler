"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/core/supabase/server";
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

  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  const result = CreateAvailabilityWindowSchema.safeParse({ dayOfWeek, startTime, endTime });
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

  const id = formData.get("id") as string;
  const dayOfWeek = formData.get("dayOfWeek");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");

  if (!id) {
    return { error: "Missing window ID" };
  }

  const input: {
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
  } = {};
  if (dayOfWeek !== null) {
    input.dayOfWeek = Number(dayOfWeek);
  }
  if (startTime !== null) {
    input.startTime = startTime as string;
  }
  if (endTime !== null) {
    input.endTime = endTime as string;
  }

  const result = UpdateAvailabilityWindowSchema.safeParse(input);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await updateAvailabilityWindow(id, result.data, user.id);
    revalidatePath("/dashboard/scheduling/availability");
    return { success: true };
  } catch (error) {
    if (error instanceof SchedulingError) {
      return { error: error.message };
    }
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

  const id = formData.get("id") as string;

  if (!id) {
    return { error: "Missing window ID" };
  }

  try {
    await deleteAvailabilityWindow(id, user.id);
    revalidatePath("/dashboard/scheduling/availability");
    return { success: true };
  } catch (error) {
    if (error instanceof SchedulingError) {
      return { error: error.message };
    }
    return { error: "Failed to delete availability window" };
  }
}
