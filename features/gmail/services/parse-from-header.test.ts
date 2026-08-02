import { describe, expect, it } from "vitest";
import { parseEmailFrom, parseFrom } from "@/features/gmail/services/parse-from-header";

describe("parseEmailFrom", () => {
  it("parses DocuSign noreply", () => {
    expect(parseEmailFrom("DocuSign <noreply@docusign.net>")).toEqual({
      name: "DocuSign",
      email: "noreply@docusign.net",
    });
  });

  it("parses quoted Mediamarkt sender", () => {
    expect(parseEmailFrom('"Mediamarkt" <info@mediamarkt.ch>')).toEqual({
      name: "Mediamarkt",
      email: "info@mediamarkt.ch",
    });
  });

  it("parses bare email", () => {
    expect(parseEmailFrom("thomas@gmail.com")).toEqual({
      name: "thomas",
      email: "thomas@gmail.com",
    });
  });

  it("returns System for empty header", () => {
    expect(parseFrom("")).toEqual({ name: "System", email: "" });
  });
});
