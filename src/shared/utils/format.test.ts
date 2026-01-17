import { describe, expect, it } from "bun:test";

import { formatDate, formatDateFull, formatDateShort, formatTime } from "./format";

describe("formatDate", () => {
  it("returns ISO string for valid date", () => {
    const date = new Date("2025-01-15T10:30:00.000Z");
    expect(formatDate(date)).toBe("2025-01-15T10:30:00.000Z");
  });
});

describe("formatDateShort", () => {
  it("formats date in short human-readable format", () => {
    const date = new Date("2025-01-15T10:30:00.000Z");
    const result = formatDateShort(date);
    // Contains weekday abbreviation, month abbreviation, and day
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });
});

describe("formatDateFull", () => {
  it("formats date in full human-readable format", () => {
    const date = new Date("2025-01-15T10:30:00.000Z");
    const result = formatDateFull(date);
    // Contains full weekday, full month, day, and year
    expect(result).toContain("January");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });
});

describe("formatTime", () => {
  it("formats time in 12-hour format", () => {
    const date = new Date("2025-01-15T10:30:00.000Z");
    const result = formatTime(date);
    // Should contain time in 12-hour format with AM/PM
    expect(result).toMatch(/\d{1,2}:\d{2}\s*[AP]M/i);
  });
});
