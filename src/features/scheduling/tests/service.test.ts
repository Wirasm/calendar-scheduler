import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { AvailabilityWindow, NewAvailabilityWindow } from "../models";

// Mock the repository module
const mockRepository = {
  findById: mock<(id: string) => Promise<AvailabilityWindow | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  findByUserId: mock<(userId: string) => Promise<AvailabilityWindow[]>>(() => Promise.resolve([])),
  findByUserIdAndDay: mock<(userId: string, dayOfWeek: number) => Promise<AvailabilityWindow[]>>(
    () => Promise.resolve([]),
  ),
  create: mock<(data: NewAvailabilityWindow) => Promise<AvailabilityWindow>>(() =>
    Promise.resolve({} as AvailabilityWindow),
  ),
  update: mock<
    (
      id: string,
      data: Partial<Pick<AvailabilityWindow, "dayOfWeek" | "startTime" | "endTime">>,
    ) => Promise<AvailabilityWindow | undefined>
  >(() => Promise.resolve(undefined)),
  deleteById: mock<(id: string) => Promise<boolean>>(() => Promise.resolve(false)),
};

// Mock the repository before importing service
mock.module("../repository", () => mockRepository);

// Import service after mocking
const {
  createAvailabilityWindow,
  deleteAvailabilityWindow,
  getAvailabilityWindow,
  getAvailabilityWindowsByUser,
  updateAvailabilityWindow,
} = await import("../service");

const mockWindow: AvailabilityWindow = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "550e8400-e29b-41d4-a716-446655440001",
  dayOfWeek: 1, // Monday
  startTime: "09:00",
  endTime: "17:00",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const userId = "550e8400-e29b-41d4-a716-446655440001";
const otherUserId = "550e8400-e29b-41d4-a716-446655440002";

describe("createAvailabilityWindow", () => {
  beforeEach(() => {
    mockRepository.findByUserIdAndDay.mockReset();
    mockRepository.create.mockReset();
  });

  it("creates window when no overlap exists", async () => {
    mockRepository.findByUserIdAndDay.mockResolvedValue([]);
    mockRepository.create.mockResolvedValue(mockWindow);

    const result = await createAvailabilityWindow(
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      userId,
    );

    expect(result).toEqual(mockWindow);
    expect(mockRepository.create).toHaveBeenCalledTimes(1);
  });

  it("throws AvailabilityWindowOverlapError when overlap exists", async () => {
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);

    await expect(
      createAvailabilityWindow({ dayOfWeek: 1, startTime: "10:00", endTime: "12:00" }, userId),
    ).rejects.toThrow("overlaps");
  });

  it("allows non-overlapping windows on same day", async () => {
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);
    const afternoonWindow = { ...mockWindow, id: "new-id", startTime: "18:00", endTime: "20:00" };
    mockRepository.create.mockResolvedValue(afternoonWindow);

    const result = await createAvailabilityWindow(
      { dayOfWeek: 1, startTime: "18:00", endTime: "20:00" },
      userId,
    );

    expect(result.startTime).toBe("18:00");
    expect(mockRepository.create).toHaveBeenCalledTimes(1);
  });
});

describe("getAvailabilityWindowsByUser", () => {
  beforeEach(() => {
    mockRepository.findByUserId.mockReset();
  });

  it("returns windows for user", async () => {
    mockRepository.findByUserId.mockResolvedValue([mockWindow]);

    const result = await getAvailabilityWindowsByUser(userId);

    expect(result).toEqual([mockWindow]);
    expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
  });

  it("returns empty array when no windows exist", async () => {
    mockRepository.findByUserId.mockResolvedValue([]);

    const result = await getAvailabilityWindowsByUser(userId);

    expect(result).toEqual([]);
  });
});

describe("getAvailabilityWindow", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
  });

  it("returns window when user is owner", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);

    const result = await getAvailabilityWindow(mockWindow.id, userId);

    expect(result).toEqual(mockWindow);
  });

  it("throws AvailabilityWindowNotFoundError when window does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(getAvailabilityWindow("non-existent-id", userId)).rejects.toThrow(
      "Availability window not found",
    );
  });

  it("throws SchedulingAccessDeniedError when user is not owner", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);

    await expect(getAvailabilityWindow(mockWindow.id, otherUserId)).rejects.toThrow(
      "Access denied",
    );
  });
});

describe("updateAvailabilityWindow", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
    mockRepository.findByUserIdAndDay.mockReset();
    mockRepository.update.mockReset();
  });

  it("updates window when user is owner and no overlap", async () => {
    const updatedWindow = { ...mockWindow, startTime: "10:00" };
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);
    mockRepository.update.mockResolvedValue(updatedWindow);

    const result = await updateAvailabilityWindow(mockWindow.id, { startTime: "10:00" }, userId);

    expect(result.startTime).toBe("10:00");
    expect(mockRepository.update).toHaveBeenCalledTimes(1);
  });

  it("throws AvailabilityWindowNotFoundError when window does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(
      updateAvailabilityWindow("non-existent-id", { startTime: "10:00" }, userId),
    ).rejects.toThrow("Availability window not found");
  });

  it("throws SchedulingAccessDeniedError when user is not owner", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);

    await expect(
      updateAvailabilityWindow(mockWindow.id, { startTime: "10:00" }, otherUserId),
    ).rejects.toThrow("Access denied");
  });

  it("throws AvailabilityWindowOverlapError when update causes overlap", async () => {
    const existingWindow2 = { ...mockWindow, id: "other-id", startTime: "18:00", endTime: "20:00" };
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow, existingWindow2]);

    await expect(
      updateAvailabilityWindow(mockWindow.id, { startTime: "18:30", endTime: "19:30" }, userId),
    ).rejects.toThrow("overlaps");
  });

  it("allows update that does not cause overlap", async () => {
    const updatedWindow = { ...mockWindow, endTime: "16:00" };
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);
    mockRepository.update.mockResolvedValue(updatedWindow);

    const result = await updateAvailabilityWindow(mockWindow.id, { endTime: "16:00" }, userId);

    expect(result.endTime).toBe("16:00");
  });

  it("throws AvailabilityWindowNotFoundError when update fails (race condition)", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.findByUserIdAndDay.mockResolvedValue([mockWindow]);
    mockRepository.update.mockResolvedValue(undefined);

    await expect(
      updateAvailabilityWindow(mockWindow.id, { startTime: "10:00" }, userId),
    ).rejects.toThrow("Availability window not found");
  });
});

describe("deleteAvailabilityWindow", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
    mockRepository.deleteById.mockReset();
  });

  it("deletes window when user is owner", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.deleteById.mockResolvedValue(true);

    await expect(deleteAvailabilityWindow(mockWindow.id, userId)).resolves.toBeUndefined();
    expect(mockRepository.deleteById).toHaveBeenCalledWith(mockWindow.id);
  });

  it("throws AvailabilityWindowNotFoundError when window does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(deleteAvailabilityWindow("non-existent-id", userId)).rejects.toThrow(
      "Availability window not found",
    );
  });

  it("throws SchedulingAccessDeniedError when user is not owner", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);

    await expect(deleteAvailabilityWindow(mockWindow.id, otherUserId)).rejects.toThrow(
      "Access denied",
    );
  });

  it("throws AvailabilityWindowNotFoundError when delete fails (race condition)", async () => {
    mockRepository.findById.mockResolvedValue(mockWindow);
    mockRepository.deleteById.mockResolvedValue(false);

    await expect(deleteAvailabilityWindow(mockWindow.id, userId)).rejects.toThrow(
      "Availability window not found",
    );
  });
});
