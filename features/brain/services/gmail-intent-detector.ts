import type { BrainV3Intent } from "@/features/brain/types/brain-v3-types";
import {
  BUSINESS_INQUIRY_KEYWORDS,
  getSkillIntentRules,
  VIEWING_INTENT_KEYWORDS,
} from "@/features/brain/services/skill-intent-sets";
import {
  hasCustomerInquirySignals,
  isClearlyNonServiceSender,
  isNonServiceInquiry,
} from "@/features/spam-handling/services/spam-detection";
import { isIndustrySkillId } from "@/features/workspace/services/skills/all-skills";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { DEFAULT_HELPY_SKILL } from "@/features/workspace/services/workspace/skills";

export {
  VIEWING_INTENT_KEYWORDS,
  BUSINESS_INQUIRY_KEYWORDS,
  EXISTING_CUSTOMER_KEYWORDS,
  INTEREST_INQUIRY_KEYWORDS,
} from "@/features/brain/services/skill-intent-sets";

function containsAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function containsWord(text: string, words: string[]): boolean {
  return words.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, "iu").test(
      text
    );
  });
}

export type GmailIntentContext = {
  from?: string;
  subject?: string;
  snippet?: string;
  /** Aktiver HELPY-Skill — steuert Intent-Set. Default: real-estate. */
  activeSkill?: HelpySkill;
};

function shouldTreatAsSpam(text: string, context?: GmailIntentContext): boolean {
  return isNonServiceInquiry({
    titel: context?.subject,
    snippet: context?.snippet ?? text,
    from: context?.from,
    brainIntent: undefined,
    intent: undefined,
    intentLabel: undefined,
    summary: text,
  });
}

function detectSharedEarlyIntent(normalized: string): BrainV3Intent | null {
  // Bestandskunde ist skill-scoped (SKILL_INTENT_RULES) — hier nur Rechnung.
  if (containsWord(normalized, ["rechnung", "zahlung", "beleg", "invoice"])) {
    return "Rechnung";
  }

  return null;
}

function detectSharedLateIntent(normalized: string): BrainV3Intent | null {
  if (containsAny(normalized, ["rückruf", "rueckruf", "zurückrufen", "anrufen"])) {
    return "Rückruf";
  }

  if (
    containsAny(normalized, [
      "terminwunsch",
      "termin vereinbaren",
      "termin vorschlagen",
      "kalender",
      "am abend",
      "uhrzeit",
    ]) ||
    (normalized.includes("termin") &&
      !containsAny(normalized, [...BUSINESS_INQUIRY_KEYWORDS]))
  ) {
    return "Terminwunsch";
  }

  return null;
}

/** Regelbasierte Intent-Erkennung für Gmail — skill-scoped. */
export function detectGmailIntent(
  text: string,
  context?: GmailIntentContext
): BrainV3Intent {
  const normalized = text.toLowerCase();
  const from = context?.from ?? "";
  const activeSkill = context?.activeSkill ?? DEFAULT_HELPY_SKILL;
  const hasCustomerSignals = hasCustomerInquirySignals(normalized);
  const clearNonServiceSender = isClearlyNonServiceSender(from);

  if (
    shouldTreatAsSpam(text, context) &&
    !(hasCustomerSignals && !clearNonServiceSender)
  ) {
    return "Spam / Newsletter";
  }

  const early = detectSharedEarlyIntent(normalized);
  if (early) return early;

  if (
    activeSkill !== "construction" &&
    containsAny(normalized, [
      "angebotsanfrage",
      "offertanfrage",
      "offerte",
      "angebot anfordern",
      "kostenvoranschlag",
    ])
  ) {
    return "Angebotsanfrage";
  }

  if (
    activeSkill !== "consulting-legal" &&
    containsAny(normalized, ["frist", "einspruch", "stellungnahme", "deadline"])
  ) {
    return "Frist";
  }

  for (const rule of getSkillIntentRules(activeSkill)) {
    if (containsAny(normalized, rule.keywords)) {
      return rule.intent;
    }
  }

  if (
    isIndustrySkillId(activeSkill) &&
    activeSkill !== "real-estate" &&
    containsAny(normalized, ["reklamation", "beschwerde", "unzufrieden"])
  ) {
    return "Neue Anfrage";
  }

  if (
    isIndustrySkillId(activeSkill) &&
    activeSkill !== "real-estate" &&
    containsAny(normalized, ["anfrage", "information", "info"])
  ) {
    return "Neue Anfrage";
  }

  if (
    activeSkill !== "consulting-legal" &&
    containsAny(normalized, ["dokument", "anhang", "pdf", "datei", "unterlagen"])
  ) {
    return "Dokument";
  }

  const late = detectSharedLateIntent(normalized);
  if (late) return late;

  if (shouldTreatAsSpam(text, context)) {
    return "Spam / Newsletter";
  }

  return "Sonstiges / Unklar";
}
