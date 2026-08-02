import { describe, expect, it } from "vitest";
import {
  detectSystemMail,
  isKnownSystemDomain,
  isNoreplyAddress,
} from "@/features/mail/services/system-mail-detector";

describe("system mail detector", () => {
  it("detects DocuSign verification mail", () => {
    const result = detectSystemMail({
      from: "DocuSign <noreply@docusign.com>",
      subject: "Your code is 456925",
      snippet: "Your code is 456925",
    });

    expect(result.isSystemMail).toBe(true);
    expect(result.category).toBe("verification");
  });

  it("detects noreply system domains", () => {
    expect(isNoreplyAddress("noreply@docusign.com")).toBe(true);
    expect(isKnownSystemDomain("system@stripe.com")).toBe(true);
  });

  it("detects own sent mail", () => {
    const result = detectSystemMail({
      from: "viktor@example.com",
      subject: "Follow up",
      sourceAccountEmail: "viktor@example.com",
      direction: "outgoing",
    });

    expect(result.isSystemMail).toBe(true);
    expect(result.category).toBe("own_sent");
  });

  it("allows real customer inquiry", () => {
    const result = detectSystemMail({
      from: "Thomas Müller <thomas@gmail.com>",
      subject: "Besichtigungstermin Wohnung",
      snippet: "Ich interessiere mich für die Wohnung und hätte gerne einen Termin.",
    });

    expect(result.isSystemMail).toBe(false);
  });

  it("detects newsletter headers", () => {
    const result = detectSystemMail({
      from: "News <news@example.com>",
      subject: "Weekly update",
      listUnsubscribe: "<mailto:unsubscribe@example.com>",
    });

    expect(result.isSystemMail).toBe(true);
    expect(result.category).toBe("newsletter");
  });
});
