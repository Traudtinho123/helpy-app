import { describe, expect, it } from "vitest";
import {
  DEFAULT_VOICE_BUSINESS_HOURS,
  isWithinBusinessHours,
  resolveBusinessHours,
} from "@/features/voice/services/voice-business-hours";

describe("voice-business-hours", () => {
  it("nutzt Default Mo–Fr 9–17", () => {
    expect(resolveBusinessHours({ businessHours: null })).toEqual(
      DEFAULT_VOICE_BUSINESS_HOURS
    );
  });

  it("erkennt Mittwoch 10:00 als innerhalb", () => {
    const wednesday = new Date("2026-07-08T08:00:00.000Z");
    expect(isWithinBusinessHours({ businessHours: null }, wednesday)).toBe(true);
  });

  it("erkennt Sonntag als ausserhalb", () => {
    const sunday = new Date("2026-07-12T08:00:00.000Z");
    expect(isWithinBusinessHours({ businessHours: null }, sunday)).toBe(false);
  });
});
