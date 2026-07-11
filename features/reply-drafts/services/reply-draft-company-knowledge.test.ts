import { beforeEach, describe, expect, it } from "vitest";
import { MOCK_COMPANY_KNOWLEDGE } from "@/features/company-knowledge/mock/company-knowledge-mock";
import {
  cloneCompanyKnowledge,
  createEmptyCompanyKnowledge,
} from "@/features/company-knowledge/services/company-knowledge-defaults";
import { saveCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-service";
import { evaluateReplyTemplateRules } from "@/features/reply-drafts/services/reply-template-rules";
import type { ReplyDraftInput } from "@/features/reply-drafts/types/reply-draft-types";
import {
  loadCompanyProfileById,
  updateLoadedCompanyProfile,
} from "@/lib/company/company-profile-service";
import { MOCK_COMPANY_PROFILE } from "@/lib/company/company-profile-types";

const BASE_INPUT: ReplyDraftInput = {
  vorgangId: "vorgang-reply-test",
  skill: "real-estate",
  intent: "immobilien",
  intentLabel: "Neue Anfrage",
  priority: "mittel",
  senderName: "Anna Müller",
  senderEmail: "anna@example.com",
  subject: "Anfrage Wohnung",
  snippet: "Ich interessiere mich für eine Wohnung.",
};

function longTemplateOutcome() {
  return evaluateReplyTemplateRules({
    ...BASE_INPUT,
    vorgangId: "vorgang-baseline",
  });
}

describe("reply draft company knowledge", () => {
  beforeEach(async () => {
    loadCompanyProfileById(MOCK_COMPANY_PROFILE.companyId);
    updateLoadedCompanyProfile({
      companySignature: "",
      companyName: "Traudt Immobilien GmbH",
      documentLanguage: "de",
    });
    await saveCompanyKnowledge(
      createEmptyCompanyKnowledge(MOCK_COMPANY_PROFILE.companyId, "Test"),
      "Test"
    );
  });

  it("kürzt Entwürfe bei Antwortstil kurz und direkt", async () => {
    const baseline = longTemplateOutcome();
    const baselineLength = baseline.draftText.length;

    const knowledge = cloneCompanyKnowledge(MOCK_COMPANY_KNOWLEDGE);
    knowledge.replyStyle = "short-direct";
    knowledge.replyStyleCustom = "";
    knowledge.emailSignatureOverride = "";
    await saveCompanyKnowledge(knowledge, "Test");

    const styled = evaluateReplyTemplateRules(BASE_INPUT);

    expect(styled.draftText.length).toBeLessThan(baselineLength);
    expect(styled.tone).toBe("Kurz und direkt");
  });

  it("hängt gespeicherte Signatur an den Entwurf an", () => {
    const signature =
      "Mit freundlichen Grüssen\nMartina Traut\nTraudt Immobilien GmbH";

    updateLoadedCompanyProfile({ companySignature: signature });

    const outcome = evaluateReplyTemplateRules(BASE_INPUT);

    expect(outcome.draftText).toContain("Martina Traut");
    expect(outcome.draftText).toContain("Traudt Immobilien GmbH");
    expect(outcome.draftText.endsWith(signature)).toBe(true);
  });

  it("lädt Wissen nur für die eigene companyId", async () => {
    const foreignCompanyId = "foreign-company-xyz";
    await saveCompanyKnowledge(
      {
        ...cloneCompanyKnowledge(MOCK_COMPANY_KNOWLEDGE),
        companyId: foreignCompanyId,
        replyStyle: "short-direct",
      },
      "Fremd"
    );

    loadCompanyProfileById(MOCK_COMPANY_PROFILE.companyId);
    const outcome = evaluateReplyTemplateRules(BASE_INPUT);

    expect(outcome.tone).not.toBe("Kurz und direkt");
  });

  it("fügt interne Memory-Hinweise nicht in den Kundentext ein", () => {
    const outcome = evaluateReplyTemplateRules({
      ...BASE_INPUT,
      memoryHints: ["Interner Skill-Hinweis für HELPY"],
    });

    expect(outcome.draftText).not.toMatch(/\nHinweis:/i);
    expect(outcome.draftText).not.toContain("Interner Skill-Hinweis");
  });
});
