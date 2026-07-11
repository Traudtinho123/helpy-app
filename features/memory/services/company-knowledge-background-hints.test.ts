import { beforeEach, describe, expect, it } from "vitest";
import {
  cloneCompanyKnowledge,
  createEmptyCompanyKnowledge,
} from "@/features/company-knowledge/services/company-knowledge-defaults";
import { buildCompanyKnowledgeDecisionSupplement } from "@/features/company-knowledge/services/company-knowledge-context";
import { saveCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-service";
import { buildCompanyBackgroundHints } from "@/features/memory/services/company-knowledge-background-hints";
import { buildDecisionContext } from "@/features/decision/services/decision-context";
import { evaluateDecisionRules } from "@/features/decision/services/decision-rules";
import {
  loadCompanyProfileById,
  updateLoadedCompanyProfile,
} from "@/lib/company/company-profile-service";
import { MOCK_COMPANY_PROFILE } from "@/lib/company/company-profile-types";

describe("company knowledge background hints", () => {
  beforeEach(async () => {
    loadCompanyProfileById(MOCK_COMPANY_PROFILE.companyId);
    updateLoadedCompanyProfile({
      companyName: "Traudt Immobilien GmbH",
    });
    await saveCompanyKnowledge(
      createEmptyCompanyKnowledge(MOCK_COMPANY_PROFILE.companyId, "Test"),
      "Test"
    );
  });

  it("shows viewing duration from company knowledge in HELPY erinnert sich", async () => {
    const knowledge = cloneCompanyKnowledge(
      createEmptyCompanyKnowledge(MOCK_COMPANY_PROFILE.companyId)
    );
    knowledge.appointmentDurationViewingMinutes = 60;
    knowledge.defaultBufferMinutes = 20;
    await saveCompanyKnowledge(knowledge, "Test");

    const hints = buildCompanyBackgroundHints({
      vorgangId: "v-1",
      hasAppointmentFlow: true,
    });

    const durationHint = hints.find(
      (hint) => hint.id === "company-besichtigungsdauer"
    );
    expect(durationHint?.rememberText).toContain("60 Minuten");
    expect(durationHint?.tipText).toContain("20 Minuten Puffer");
  });

  it("reflects structured reply style instead of legacy free text", async () => {
    const knowledge = cloneCompanyKnowledge(
      createEmptyCompanyKnowledge(MOCK_COMPANY_PROFILE.companyId)
    );
    knowledge.replyStyle = "short-direct";
    await saveCompanyKnowledge(knowledge, "Test");

    const hints = buildCompanyBackgroundHints({
      vorgangId: "v-2",
      hasReplyDraft: true,
    });

    const styleHint = hints.find((hint) => hint.id === "company-antwortstil");
    expect(styleHint?.rememberText).toContain("kurz und direkt");
  });

  it("summarizes business hours including closed saturday", async () => {
    const knowledge = cloneCompanyKnowledge(
      createEmptyCompanyKnowledge(MOCK_COMPANY_PROFILE.companyId)
    );
    knowledge.businessHours.saturday.closed = true;
    knowledge.businessHours.monday = {
      closed: false,
      start: "08:00",
      end: "18:00",
    };
    await saveCompanyKnowledge(knowledge, "Test");

    const hints = buildCompanyBackgroundHints({
      vorgangId: "v-3",
      hasAppointmentFlow: true,
    });

    const hoursHint = hints.find((hint) => hint.id === "company-zeiten");
    expect(hoursHint?.rememberText).toContain("Samstag geschlossen");
    expect(hoursHint?.rememberText).toContain("Montag 08:00–18:00");
  });

  it("enriches besichtigung decisions with company knowledge", async () => {
    const knowledge = cloneCompanyKnowledge(
      createEmptyCompanyKnowledge(MOCK_COMPANY_PROFILE.companyId)
    );
    knowledge.appointmentDurationViewingMinutes = 50;
    knowledge.internalRules = ["Besichtigungen nur Montag bis Freitag."];
    await saveCompanyKnowledge(knowledge, "Test");

    const supplement = buildCompanyKnowledgeDecisionSupplement({
      intent: "besichtigung",
      intentLabel: "Besichtigungswunsch",
    });

    expect(supplement).toContain("50 Minuten");
    expect(supplement).toContain("Montag bis Freitag");

    const context = buildDecisionContext({
      vorgangId: "v-4",
      skill: "real-estate",
      intent: "besichtigung",
      intentLabel: "Besichtigungswunsch",
      priority: "hoch",
      gmail: {
        subject: "Besichtigung",
        from: "Anna Müller <anna@example.com>",
      },
    });

    const outcome = evaluateDecisionRules(context);
    expect(outcome.reason).toContain("50 Minuten");
    expect(outcome.reason).toContain("Montag bis Freitag");
  });
});
