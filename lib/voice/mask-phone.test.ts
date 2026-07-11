import { describe, expect, it } from "vitest";
import { maskPhoneNumber } from "@/lib/voice/mask-phone";

describe("maskPhoneNumber", () => {
  it("maskiert Schweizer Nummern", () => {
    expect(maskPhoneNumber("+41791234567")).toBe("+41 ** *** ** 4567");
  });

  it("gibt Unbekannt für leere Werte zurück", () => {
    expect(maskPhoneNumber(null)).toBe("Unbekannt");
  });
});
