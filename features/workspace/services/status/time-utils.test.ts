import { describe, expect, it } from "vitest";
import {
  staticIsoWithOffset,
  staticTimeFromIso,
} from "@/features/workspace/services/status/time-utils";

describe("staticIsoWithOffset", () => {
  it("toleriert fehlendes ISO", () => {
    expect(staticIsoWithOffset("", 1)).toMatch(/T\d{2}:\d{2}:00/);
    expect(staticTimeFromIso("")).toBe("12:00");
  });

  it("parst ISO mit Millisekunden und Z", () => {
    const result = staticIsoWithOffset("2026-07-09T18:20:07.123Z", 2);
    expect(result).toBe("2026-07-09T18:22:00Z");
  });
});
