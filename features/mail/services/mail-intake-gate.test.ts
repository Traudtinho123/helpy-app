import { describe, expect, it } from "vitest";
import { evaluateMailIntake } from "@/features/mail/services/mail-intake-gate";

describe("mail intake gate", () => {
  it("rejects DocuSign code mail", () => {
    const decision = evaluateMailIntake({
      from: "DocuSign <noreply@docusign.net>",
      subject: "Your code is 456925",
      snippet: "Your code is 456925",
    });
    expect(decision.shouldCreateVorgang).toBe(false);
  });

  it("rejects marketing newsletter", () => {
    const decision = evaluateMailIntake({
      from: '"Mediamarkt" <info@mediamarkt.ch>',
      subject: "mediamarkt.ch - POWERPAY",
      snippet: "Exklusives Angebot nur heute",
    });
    expect(decision.shouldCreateVorgang).toBe(false);
  });

  it("allows real customer inquiry", () => {
    const decision = evaluateMailIntake({
      from: "Thomas Müller <thomas@gmail.com>",
      subject: "Besichtigungstermin Wohnung",
      snippet: "Ich interessiere mich für die Wohnung und hätte gerne einen Termin.",
    });
    expect(decision.shouldCreateVorgang).toBe(true);
  });
});
