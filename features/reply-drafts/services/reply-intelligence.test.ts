import { describe, expect, it } from "vitest";
import { extractMailAnalysisRuleBased } from "@/features/reply-drafts/services/mail-analysis-extraction";
import { buildEnrichedTemplateGenerationResult } from "@/features/reply-drafts/services/reply-enriched-template";
import { lookupObjectsForMailQueries } from "@/features/reply-drafts/services/reply-object-lookup";
import { runReplyQualityCheck } from "@/features/reply-drafts/services/reply-quality-check";
import type { ReplyDraftInput } from "@/features/reply-drafts/types/reply-draft-types";

const BASE_INPUT: ReplyDraftInput = {
  vorgangId: "vorgang-test",
  skill: "real-estate",
  intent: "Besichtigung",
  intentLabel: "Besichtigung",
  priority: "mittel",
  senderName: "Thomas Müller",
  senderEmail: "thomas@example.com",
  subject: "Anfrage Seestrasse 42",
  snippet: "",
  originalFrom: "Thomas Müller <thomas@example.com>",
};

describe("mail analysis extraction", () => {
  it("erkennt informellen Ton und konkrete Fragen", () => {
    const analysis = extractMailAnalysisRuleBased({
      from: "Thomas Müller <thomas@example.com>",
      subject: "Wohnung Seestrasse 42",
      body: "Hi, ist die Wohnung an der Seestrasse 42 noch verfügbar? Was kostet die Miete?",
    });

    expect(analysis.ton).toBe("informell");
    expect(analysis.konkrete_fragen.length).toBeGreaterThanOrEqual(2);
    expect(analysis.genannte_objekte.join(" ")).toMatch(/Seestrasse 42/i);
  });

  it("erkennt englische Mails", () => {
    const analysis = extractMailAnalysisRuleBased({
      from: "John Smith <john@example.com>",
      subject: "Apartment inquiry",
      body: "Hi, is the apartment at Seestrasse 42 still available? What is the exact price?",
    });

    expect(analysis.sprache).toBe("en");
  });
});

describe("object lookup", () => {
  it("findet Objekt-Details für Seestrasse", () => {
    const lookups = lookupObjectsForMailQueries(["Seestrasse 42"]);
    expect(lookups.length).toBeGreaterThan(0);
    expect(lookups[0]?.summaryLine).toMatch(/Seestrasse 42/i);
    expect(lookups[0]?.summaryLine).toMatch(/Zimmer|CHF/i);
  });
});

describe("enriched reply generation", () => {
  it("beantwortet Objektfragen mit konkreten Details", () => {
    const result = buildEnrichedTemplateGenerationResult({
      ...BASE_INPUT,
      snippet:
        "Hi Thomas, ist die Wohnung an der Seestrasse 42 noch verfügbar? Was ist der genaue Preis?",
      gmailMessage: {
        subject: BASE_INPUT.subject,
        from: BASE_INPUT.originalFrom!,
        snippet:
          "Hi Thomas, ist die Wohnung an der Seestrasse 42 noch verfügbar? Was ist der genaue Preis?",
      },
    });

    expect(result.draftText).toMatch(/Seestrasse 42/i);
    expect(result.draftText).toMatch(/CHF|Preis|Zimmer/i);
    expect(result.variants?.short.length).toBeGreaterThan(0);
    expect(result.variants?.detailed.length).toBeGreaterThan(0);
  });

  it("nutzt du-Form bei informeller Mail", () => {
    const result = buildEnrichedTemplateGenerationResult({
      ...BASE_INPUT,
      snippet: "Hi, ist die Wohnung an der Seestrasse 42 noch verfügbar?",
      gmailMessage: {
        subject: BASE_INPUT.subject,
        from: BASE_INPUT.originalFrom!,
        snippet: "Hi, ist die Wohnung an der Seestrasse 42 noch verfügbar?",
      },
    });

    expect(result.analysis.ton).toBe("informell");
    expect(result.draftText).toMatch(/Hallo|dir|dein|Hallo Thomas/i);
  });
});

describe("reply quality check", () => {
  it("warnt bei generischer Antwort", () => {
    const warnings = runReplyQualityCheck({
      draftText:
        "Vielen Dank für Ihre Anfrage. Ich habe Ihr Anliegen zur Kenntnis genommen.",
      analysis: extractMailAnalysisRuleBased({
        from: "Anna <anna@example.com>",
        subject: "Test",
        body: "Ist die Wohnung verfügbar?",
      }),
    });

    expect(warnings.some((warning) => warning.type === "generic")).toBe(true);
  });

  it("warnt wenn Fragen offen bleiben", () => {
    const analysis = extractMailAnalysisRuleBased({
      from: "Anna <anna@example.com>",
      subject: "Fragen",
      body: "Ist die Wohnung verfügbar? Was kostet sie? Wann ist Besichtigung möglich?",
    });

    const warnings = runReplyQualityCheck({
      draftText: "Guten Tag Anna, ich melde mich bei Ihnen.",
      analysis,
    });

    expect(warnings.some((warning) => warning.type === "unanswered_question")).toBe(
      true
    );
  });
});
