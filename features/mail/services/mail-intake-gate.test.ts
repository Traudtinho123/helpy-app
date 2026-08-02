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

  it("rejects developer account notification", () => {
    const decision = evaluateMailIntake({
      from: "Google Developers <noreply@google.com>",
      subject: "Your developer account is ready",
      snippet: "Your developer account is ready to use",
    });
    expect(decision.shouldCreateVorgang).toBe(false);
  });

  it("rejects failed production deploy mail", () => {
    const decision = evaluateMailIntake({
      from: "Vercel <notifications@vercel.com>",
      subject: "Failed production deployment",
      snippet: "Your deployment failed",
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

  it("rejects TV marketing subject", () => {
    const decision = evaluateMailIntake({
      from: "Shop <news@example.com>",
      subject: "Dieser Fernseher stellt alles auf den Kopf",
      snippet: "Jetzt kaufen",
    });
    expect(decision.shouldCreateVorgang).toBe(false);
  });

  it("rejects travel newsletter subject", () => {
    const decision = evaluateMailIntake({
      from: "Reisen <news@travel-offers.com>",
      subject: "Urlaubsfavoriten mit direkter Strandlage 🌴",
      snippet: "Jetzt buchen",
    });
    expect(decision.shouldCreateVorgang).toBe(false);
  });

  it("rejects System placeholder sender", () => {
    const decision = evaluateMailIntake({
      from: "",
      subject: "Some marketing mail",
      snippet: "Buy now",
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
