import { describe, expect, it } from "vitest";
import { analyzeGmailMessage } from "@/features/brain/services/brain-v3";
import { detectGmailIntent } from "@/features/brain/services/gmail-intent-detector";
import { mapBrainResultToVorgang } from "@/features/brain/services/brain-result-to-vorgang";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

function sample(partial: {
  id?: string;
  subject: string;
  from?: string;
  snippet: string;
}) {
  return {
    id: partial.id ?? "msg-1",
    threadId: "thread-1",
    subject: partial.subject,
    from: partial.from ?? "Max Mustermann <max@example.com>",
    snippet: partial.snippet,
    date: "2026-07-09T10:00:00.000Z",
  };
}

function classify(
  skill: HelpySkill,
  subject: string,
  snippet: string,
  from?: string
) {
  return analyzeGmailMessage(sample({ subject, snippet, from }), {
    activeSkill: skill,
  });
}

describe("skill-scoped intent classification", () => {
  describe("real-estate (regression)", () => {
    it("detects Besichtigung", () => {
      const result = classify(
        "real-estate",
        "Besichtigungstermin",
        "Können wir die Wohnung besichtigen?"
      );
      expect(result.intent).toBe("Besichtigung");
      expect(result.skill).toBe("HELPY Real Estate");
      expect(result.priority).toBe("hoch");
      expect(mapBrainResultToVorgang(result).typ).toBe("anfrage");
    });

    it("detects Interessentenanfrage", () => {
      const result = classify(
        "real-estate",
        "Interesse an Objekt",
        "Ich interessiere mich für das Exposé und bitte um Rückmeldung."
      );
      expect(result.intent).toBe("Interessentenanfrage");
      expect(result.skill).toBe("HELPY Real Estate");
      expect(mapBrainResultToVorgang(result).typ).toBe("anfrage");
    });

    it("detects Bestandskunde via Mietvertrag", () => {
      const result = classify(
        "real-estate",
        "Nebenkosten",
        "Zu unserem Mietvertrag: die Nebenkostenabrechnung fehlt."
      );
      expect(result.intent).toBe("Bestandskunden-Kommunikation");
    });

    it("detects Geschäftsanfrage", () => {
      const result = classify(
        "real-estate",
        "Kooperation",
        "Wir bieten Facility-Service und suchen eine Partnerschaft."
      );
      expect(result.intent).toBe("Geschäftsanfrage");
    });

    it("does not force RE skill from Besichtigung when Construction is active", () => {
      // RE keywords still match if present in construction set? Viewing is RE-only.
      // With construction active, "besichtigung" is not in construction rules → Unklar/Termin.
      const intent = detectGmailIntent(
        "besichtigungstermin wohnung besichtigen",
        { activeSkill: "construction" }
      );
      expect(intent).not.toBe("Interessentenanfrage");
      // Construction has no Besichtigung rule — should not invent RE intent.
      expect(intent).not.toBe("Besichtigung");
    });

    it("platform mail still forces Real Estate", () => {
      const result = classify(
        "construction",
        "Anfrage zu Ihrer Immobilie",
        "Ein Interessent möchte mehr Informationen.",
        "ImmoScout24 <noreply@immobilienscout24.de>"
      );
      expect(result.skill).toBe("HELPY Real Estate");
      expect(["Besichtigung", "Interessentenanfrage"]).toContain(result.intent);
    });
  });

  describe("construction", () => {
    it("detects Angebotsanfrage / Offerte", () => {
      const result = classify(
        "construction",
        "Kostenvoranschlag",
        "Bitte senden Sie uns eine Offerte für die Sanierung."
      );
      expect(result.intent).toBe("Angebotsanfrage");
      expect(result.skill).toBe("HELPY Construction");
    });

    it("detects Vor-Ort-Termin", () => {
      const result = classify(
        "construction",
        "Aufmaß",
        "Können wir einen Vor-Ort-Termin für das Aufmaß vereinbaren?"
      );
      expect(result.intent).toBe("Vor-Ort-Termin");
      expect(result.priority).toBe("hoch");
    });

    it("detects Materialanfrage", () => {
      const result = classify(
        "construction",
        "Material",
        "Wir brauchen eine Materialliste und Lieferung für die Baustelle."
      );
      expect(result.intent).toBe("Materialanfrage");
    });

    it("detects Auftragsanfrage", () => {
      const result = classify(
        "construction",
        "Neues Projekt",
        "Anfrage zur Montage und Renovierung auf der Baustelle."
      );
      expect(result.intent).toBe("Auftragsanfrage");
      expect(mapBrainResultToVorgang(result).typ).toBe("anfrage");
    });

    it("does not steal Auftragsanfrage via RE reparatur Bestandskunde", () => {
      const result = classify(
        "construction",
        "Reparatur an der Baustelle",
        "Bitte um Auftrag für die Reparatur und Montage."
      );
      expect(result.intent).toBe("Auftragsanfrage");
      expect(result.intent).not.toBe("Bestandskunden-Kommunikation");
    });
  });

  describe("consulting-legal", () => {
    it("detects Mandatsanfrage", () => {
      const result = classify(
        "consulting-legal",
        "Rechtsberatung",
        "Wir möchten ein Mandat für Rechtsberatung anfragen."
      );
      expect(result.intent).toBe("Mandatsanfrage");
      expect(result.skill).toBe("HELPY Consulting & Legal");
    });

    it("detects Erstgespräch", () => {
      const result = classify(
        "consulting-legal",
        "Kennenlernen",
        "Können wir ein Erstgespräch bzw. Beratungsgespräch vereinbaren?"
      );
      expect(result.intent).toBe("Erstgespräch");
    });

    it("detects Frist", () => {
      const result = classify(
        "consulting-legal",
        "Stellungnahme",
        "Die Frist für die Stellungnahme endet morgen."
      );
      expect(result.intent).toBe("Frist");
    });
  });

  describe("neutral typ naming", () => {
    it("maps inquiry intents to anfrage (not immobilien_anfrage)", () => {
      const result = classify(
        "real-estate",
        "Besichtigung",
        "Bitte um Besichtigungstermin für die Wohnung."
      );
      const vorgang = mapBrainResultToVorgang(result);
      expect(vorgang.typ).toBe("anfrage");
      expect(vorgang.typ).not.toBe("immobilien_anfrage");
    });
  });
});
