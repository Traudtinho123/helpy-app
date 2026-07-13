import { describe, expect, it } from "vitest";
import {
  pickPreferredViewingSlots,
  scoreViewingSlot,
} from "@/features/appointment-suggestions/services/viewing-slot-picker";

describe("viewing slot picker", () => {
  it("prefers morning and afternoon slots over lunch", () => {
    expect(scoreViewingSlot("2026-07-15", { start: "10:00", end: "11:00", label: "10:00–11:00" })).toBeGreaterThan(
      scoreViewingSlot("2026-07-15", { start: "12:30", end: "13:30", label: "12:30–13:30" })
    );
  });

  it("picks up to 3 slots across 2 days", () => {
    const picked = pickPreferredViewingSlots(
      {
        "2026-07-15": [
          { start: "10:00", end: "11:00", label: "10:00–11:00" },
          { start: "14:00", end: "15:00", label: "14:00–15:00" },
        ],
        "2026-07-17": [
          { start: "10:00", end: "11:00", label: "10:00–11:00" },
          { start: "15:00", end: "16:00", label: "15:00–16:00" },
        ],
        "2026-07-18": [
          { start: "09:00", end: "10:00", label: "09:00–10:00" },
        ],
      },
      {
        maxSlots: 3,
        maxDays: 2,
        minLeadHours: 0,
        now: new Date("2026-07-13T08:00:00"),
      }
    );

    expect(picked).toHaveLength(3);
    const uniqueDays = new Set(picked.map((item) => item.date));
    expect(uniqueDays.size).toBeLessThanOrEqual(2);
  });
});
