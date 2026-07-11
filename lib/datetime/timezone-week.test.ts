import { describe, expect, it } from "vitest";
import {
  getDateKeyInTimezone,
  getWeekdayIndexInTimezone,
  startOfWeekInTimezone,
} from "@/lib/datetime/timezone-week";

describe("timezone-week", () => {
  it("startet die Woche montags in Europe/Zurich", () => {
    const wednesday = new Date("2026-07-08T12:00:00.000Z");
    const weekStart = startOfWeekInTimezone(wednesday, "Europe/Zurich");
    expect(getWeekdayIndexInTimezone(weekStart.toISOString(), "Europe/Zurich")).toBe(0);
  });

  it("formatiert Datums-Keys konsistent", () => {
    const key = getDateKeyInTimezone("2026-07-08T10:00:00.000Z", "Europe/Zurich");
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
