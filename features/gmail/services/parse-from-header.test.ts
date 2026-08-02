import { describe, expect, it } from "vitest";
import { parseFrom } from "@/features/gmail/services/parse-from-header";

describe("parseFrom", () => {
  it("parses named sender with angle brackets", () => {
    expect(parseFrom("DocuSign <noreply@docusign.com>")).toEqual({
      name: "DocuSign",
      email: "noreply@docusign.com",
    });
  });

  it("parses person sender", () => {
    expect(parseFrom("Thomas Müller <thomas@gmail.com>")).toEqual({
      name: "Thomas Müller",
      email: "thomas@gmail.com",
    });
  });

  it("parses bare email", () => {
    expect(parseFrom("thomas@gmail.com")).toEqual({
      name: "thomas",
      email: "thomas@gmail.com",
    });
  });

  it("returns unknown for empty header", () => {
    expect(parseFrom("")).toEqual({ name: "Unbekannt", email: "" });
  });
});
