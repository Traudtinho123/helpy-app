import { detectGmailIntent, VIEWING_INTENT_KEYWORDS } from "@/features/brain/services/gmail-intent-detector";
import { detectGmailPriority } from "@/features/brain/services/priority-detector";
import {
  detectPlatformEmail,
  getPlatformSourceLabel,
} from "@/features/brain/services/platform-email-detector";
import {
  buildPlatformInquirySummary,
  extractPlatformInquiry,
} from "@/features/brain/services/platform-inquiry-extractor";
import { detectRecommendation } from "@/features/brain/services/recommendation-detector";
import { detectSkill } from "@/features/brain/services/skill-detector";
import { helpySkillToBrainSkill } from "@/features/brain/services/skill-intent-sets";
import { extractViewingDetails } from "@/features/brain/services/viewing-extraction";
import {
  PLATFORM_INQUIRY_RECOMMENDATION,
} from "@/features/brain/types/platform-inquiry-types";
import type {
  BrainV3AnalysisInput,
  BrainV3Intent,
  BrainV3Result,
  BrainV3Skill,
} from "@/features/brain/types/brain-v3-types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { DEFAULT_HELPY_SKILL } from "@/features/workspace/services/workspace/skills";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";

function buildAnalysisText(input: BrainV3AnalysisInput): string {
  return `${input.subject} ${input.from} ${input.snippet}`.toLowerCase();
}

function extractSenderName(from: string): string {
  const withoutEmail = from.split("<")[0]?.trim() ?? from;
  return withoutEmail.replace(/^["']|["']$/g, "").trim() || from;
}

function resolveActiveSkill(explicit?: HelpySkill): HelpySkill {
  if (explicit) return explicit;
  try {
    return getCompanyProfileSnapshot().activePaidSkill ?? DEFAULT_HELPY_SKILL;
  } catch {
    return DEFAULT_HELPY_SKILL;
  }
}

function buildSummary(
  input: BrainV3AnalysisInput,
  skill: BrainV3Skill,
  intent: BrainV3Intent
): string {
  const sender = extractSenderName(input.from);
  const subject = input.subject.trim() || "eine Nachricht";
  const snippet = input.snippet.trim();

  if (intent === "Spam / Newsletter") {
    return `${sender} hat vermutlich eine Werbe- oder Newsletter-Nachricht gesendet.`;
  }

  if (intent === "Sonstiges / Unklar") {
    return `${sender} sendet eine Nachricht zu „${subject}“ — Kategorie noch unklar.`;
  }

  if (intent === "Geschäftsanfrage") {
    return `${sender} stellt eine Geschäftsanfrage (Dienstleistung/Kooperation) — ${snippet || subject}.`;
  }

  if (intent === "Bestandskunden-Kommunikation") {
    return `${sender} meldet sich zur laufenden Korrespondenz — ${snippet || subject}.`;
  }

  if (intent === "Interessentenanfrage") {
    return `${sender} fragt als Interessent zu einem Objekt an — ${snippet || subject}.`;
  }

  if (intent === "Angebotsanfrage") {
    if (skill === "HELPY Construction") {
      return `${sender} fragt ein Angebot an — ${snippet || subject}.`;
    }
    return `${sender} bittet um ein Angebot zu „${subject}“.`;
  }

  if (intent === "Besichtigung") {
    return `${sender} möchte eine Besichtigung zu „${subject}“ — ${snippet || "Terminwunsch erkannt"}.`;
  }

  if (intent === "Vor-Ort-Termin") {
    return `${sender} wünscht einen Vor-Ort-Termin — ${snippet || subject}.`;
  }

  if (intent === "Materialanfrage") {
    return `${sender} fragt zu Material/Lieferung an — ${snippet || subject}.`;
  }

  if (intent === "Auftragsanfrage") {
    return `${sender} meldet eine Auftrags- oder Baustellenanfrage — ${snippet || subject}.`;
  }

  if (intent === "Mandatsanfrage") {
    return `${sender} stellt eine Mandats- oder Beratungsanfrage — ${snippet || subject}.`;
  }

  if (intent === "Erstgespräch") {
    return `${sender} wünscht ein Erstgespräch — ${snippet || subject}.`;
  }

  if (intent === "Terminwunsch") {
    return `${sender} wünscht einen Termin — ${snippet || subject}.`;
  }

  if (intent === "Rückruf") {
    return `${sender} bittet um einen Rückruf zu „${subject}“.`;
  }

  if (intent === "Frist") {
    return `${sender} betrifft eine Frist — ${snippet || subject}.`;
  }

  if (intent === "Rechnung") {
    return `${sender} sendet eine Rechnung oder Zahlungsinformation — ${snippet || subject}.`;
  }

  if (intent === "Dokument") {
    return `${sender} sendet ein Dokument oder verweist auf Unterlagen — ${snippet || subject}.`;
  }

  if (skill === "HELPY Real Estate" && intent === "Neue Anfrage") {
    return `${sender} fragt zu einer Immobilie an — ${snippet || subject}.`;
  }

  if (skill === "HELPY Construction" && intent === "Neue Anfrage") {
    return `${sender} meldet ein Bauprojekt oder eine Anfrage — ${snippet || subject}.`;
  }

  if (skill === "HELPY Consulting & Legal" && intent === "Neue Anfrage") {
    return `${sender} stellt eine Beratungs- oder Mandatsanfrage — ${snippet || subject}.`;
  }

  if (intent === "Neue Anfrage") {
    return `${sender} sendet eine neue Anfrage zu „${subject}“.`;
  }

  return `${sender} sendet eine Nachricht zu „${subject}“ — ${snippet || "Inhalt wird geprüft"}.`;
}

export type AnalyzeGmailMessageOptions = {
  /** Aktiver HELPY-Skill (Company-Profil). Steuert Intent-Set. */
  activeSkill?: HelpySkill;
};

/** Analysiert eine Gmail-Nachricht und erzeugt ein HELPY-Ergebnis. */
export function analyzeGmailMessage(
  input: BrainV3AnalysisInput,
  options?: AnalyzeGmailMessageOptions
): BrainV3Result {
  const activeSkill = resolveActiveSkill(options?.activeSkill);
  const text = buildAnalysisText(input);
  const detectedPlatform = detectPlatformEmail(
    input.from,
    input.subject,
    input.snippet
  );
  const platformInquiry = detectedPlatform
    ? extractPlatformInquiry(input.from, input.subject, input.snippet)
    : undefined;

  let skill = detectSkill(text);
  let intent = detectGmailIntent(text, {
    from: input.from,
    subject: input.subject,
    snippet: input.snippet,
    activeSkill,
  });
  let priority = detectGmailPriority(text, intent);

  // Plattform-Mails (ImmoScout etc.) sind Real-Estate-Anfragen — nur hier RE erzwingen.
  if (detectedPlatform) {
    skill = "HELPY Real Estate";
    const haystack = `${input.subject} ${input.snippet}`.toLowerCase();
    const viewingSignal = VIEWING_INTENT_KEYWORDS.some((keyword) =>
      haystack.includes(keyword)
    );
    intent = viewingSignal ? "Besichtigung" : "Interessentenanfrage";
    priority = "hoch";
  } else {
    // Kein Hard-Override mehr auf RE: aktiver Skill hat Vorrang, Text-Skill nur als Hinweis.
    skill = helpySkillToBrainSkill(activeSkill);
    if (
      intent === "Besichtigung" ||
      intent === "Interessentenanfrage" ||
      intent === "Vor-Ort-Termin" ||
      intent === "Materialanfrage" ||
      intent === "Auftragsanfrage" ||
      intent === "Mandatsanfrage" ||
      intent === "Erstgespräch"
    ) {
      priority = "hoch";
    }
  }

  let recommendedAction = detectRecommendation(intent, skill);
  let summary = buildSummary(input, skill, intent);

  const viewingExtraction =
    intent === "Besichtigung" || intent === "Vor-Ort-Termin"
      ? extractViewingDetails({
          from: input.from,
          subject: input.subject,
          snippet: input.snippet,
          platformInquiry,
        })
      : undefined;

  if (detectedPlatform && platformInquiry) {
    const quelle = getPlatformSourceLabel(detectedPlatform);
    recommendedAction = PLATFORM_INQUIRY_RECOMMENDATION;
    summary = buildPlatformInquirySummary(platformInquiry, quelle);
  } else if (viewingExtraction?.objectHint && intent === "Besichtigung") {
    summary = `${extractSenderName(input.from)} möchte eine Besichtigung zu „${viewingExtraction.objectHint}“${
      viewingExtraction.preferredDateLabel
        ? ` am ${viewingExtraction.preferredDateLabel}`
        : ""
    }${
      viewingExtraction.preferredTimeWindow
        ? ` (${viewingExtraction.preferredTimeWindow})`
        : ""
    }.`;
  }

  return {
    id: `brain-v3-${input.id}`,
    source: "gmail",
    originalEmailId: input.id,
    threadId: input.threadId,
    subject: input.subject,
    from: input.from,
    skill,
    intent,
    priority,
    summary,
    recommendedAction,
    status: "Von HELPY vorbereitet",
    createdAt: new Date().toISOString(),
    detectedPlatform: detectedPlatform ?? undefined,
    platformInquiry,
    viewingExtraction,
  };
}

export function analyzeGmailMessages(
  messages: BrainV3AnalysisInput[],
  options?: AnalyzeGmailMessageOptions
): BrainV3Result[] {
  return messages.map((message) => analyzeGmailMessage(message, options));
}

export {
  mapBrainResultToVorgang,
  mapBrainResultsToVorgaenge,
} from "@/features/brain/services/brain-result-to-vorgang";
