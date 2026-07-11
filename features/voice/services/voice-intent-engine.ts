import type {
  VoiceCallClassification,
  VoiceIntent,
  VoiceIntentResult,
} from "@/features/voice/types/voice-types";
import { VOICE_INTENT_LABELS } from "@/features/voice/types/voice-types";
import type { VorgangTyp } from "@/features/workspace/services/vorgaenge/types";

type IntentRule = {
  intent: VoiceIntent;
  keywords: string[];
};

const NOTFALL_KEYWORDS = [
  "dringend",
  "notfall",
  "sofort",
  "wasserschaden",
  "wasser schaden",
  "einbruch",
  "brand",
  "gasgeruch",
  "leck",
  "ueberschwemmung",
  "überschwemmung",
  "notruf",
];

const INTENT_RULES: IntentRule[] = [
  {
    intent: "rueckruf",
    keywords: [
      "rückruf",
      "rueckruf",
      "zurückrufen",
      "zurueckrufen",
      "rufen sie mich",
      "bitte anrufen",
      "mitarbeiter",
      "zurückmelden",
    ],
  },
  {
    intent: "terminwunsch",
    keywords: [
      "termin",
      "besichtigungstermin",
      "uhr",
      "morgen",
      "übermorgen",
      "naechste woche",
      "nächste woche",
      "donnerstag",
      "freitag",
      "montag",
    ],
  },
  {
    intent: "besichtigung",
    keywords: [
      "besichtigung",
      "besichtigen",
      "wohnung",
      "haus",
      "objekt",
      "immobilie",
      "zimmer",
      "mieten",
      "kaufen",
      "homegate",
      "immoscout",
    ],
  },
  {
    intent: "angebotsanfrage",
    keywords: [
      "angebot",
      "offerte",
      "kostenvoranschlag",
      "preis",
      "was kostet",
      "kosten",
    ],
  },
  {
    intent: "rechnung",
    keywords: [
      "rechnung",
      "zahlung",
      "überweisung",
      "ueberweisung",
      "beleg",
      "invoice",
      "mahnung",
    ],
  },
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectVoiceCallClassification(
  transcript: string
): VoiceCallClassification {
  const normalized = normalizeText(transcript);

  if (NOTFALL_KEYWORDS.some((keyword) => normalized.includes(normalizeText(keyword)))) {
    return "notfall";
  }

  const intent = detectVoiceIntent(transcript).intent;

  if (intent === "besichtigung" || intent === "terminwunsch") {
    return "besichtigung_anfrage";
  }
  if (intent === "rueckruf") {
    return "rueckruf_wunsch";
  }
  if (intent === "angebotsanfrage" || intent === "rechnung") {
    return "info_anfrage";
  }

  return "sonstiges";
}

export function mapVoiceClassificationToIntent(
  classification: VoiceCallClassification
): VoiceIntent {
  switch (classification) {
    case "besichtigung_anfrage":
      return "besichtigung";
    case "info_anfrage":
      return "sonstiges";
    case "rueckruf_wunsch":
    case "notfall":
      return "rueckruf";
    default:
      return "sonstiges";
  }
}

export function shouldCreateVoiceVorgang(
  classification: VoiceCallClassification
): boolean {
  return (
    classification === "besichtigung_anfrage" ||
    classification === "rueckruf_wunsch" ||
    classification === "notfall" ||
    classification === "sonstiges"
  );
}

export function shouldAutoCreateVoiceVorgang(input: {
  classification: VoiceCallClassification;
  createVorgang?: boolean;
  hasTermin: boolean;
}): boolean {
  if (input.createVorgang === false) return false;

  if (input.classification === "besichtigung_anfrage") return true;
  if (input.classification === "rueckruf_wunsch") return true;
  if (input.classification === "notfall") return true;
  if (input.classification === "info_anfrage" && input.hasTermin) return true;
  if (input.classification === "sonstiges" && input.hasTermin) return true;

  return shouldCreateVoiceVorgang(input.classification);
}

export function matchStandardResponseTrigger(
  message: string,
  triggers: Array<{ triggerText: string; responseText: string }>
): { triggerText: string; responseText: string } | null {
  const normalized = normalizeText(message);

  for (const item of triggers) {
    const trigger = normalizeText(item.triggerText);
    if (!trigger) continue;
    if (normalized.includes(trigger)) {
      return item;
    }
  }

  return null;
}

/** Regelbasierte Intent-Erkennung für Phase 1 (DE). */
export function detectVoiceIntent(transcript: string): VoiceIntentResult {
  const normalized = normalizeText(transcript);
  let bestIntent: VoiceIntent = "sonstiges";
  let bestScore = 0;
  let bestKeywords: string[] = [];

  for (const rule of INTENT_RULES) {
    const matched = rule.keywords.filter((keyword) =>
      normalized.includes(normalizeText(keyword))
    );
    if (matched.length > bestScore) {
      bestScore = matched.length;
      bestIntent = rule.intent;
      bestKeywords = matched;
    }
  }

  const confidence =
    bestScore >= 2 ? "hoch" : bestScore === 1 ? "mittel" : "niedrig";

  return {
    intent: bestIntent,
    intentLabel: VOICE_INTENT_LABELS[bestIntent],
    confidence,
    detectedKeywords: bestKeywords,
  };
}

export function mapVoiceIntentToVorgangTyp(intent: VoiceIntent): VorgangTyp {
  switch (intent) {
    case "besichtigung":
      return "anfrage";
    case "terminwunsch":
      return "terminwunsch";
    case "rueckruf":
      return "rueckruf";
    case "angebotsanfrage":
      return "angebotsanfrage";
    case "rechnung":
      return "rechnung";
    default:
      return "normale_nachricht";
  }
}

export function buildAssistantReply(intent: VoiceIntent, callerName?: string): string {
  const name = callerName?.trim();
  const prefix = name ? `Vielen Dank, ${name}. ` : "Vielen Dank. ";

  switch (intent) {
    case "besichtigung":
      return `${prefix}Ich habe Ihre Besichtigungsanfrage notiert. Unser Team meldet sich zeitnah bei Ihnen.`;
    case "terminwunsch":
      return `${prefix}Ihr Terminwunsch ist erfasst. Wir prüfen die Verfügbarkeit und melden uns zurück.`;
    case "rueckruf":
      return `${prefix}Ihr Rückrufwunsch ist notiert. Wir rufen Sie so bald wie möglich an.`;
    case "angebotsanfrage":
      return `${prefix}Ihre Angebotsanfrage wurde weitergeleitet. Sie erhalten in Kürze Rückmeldung.`;
    case "rechnung":
      return `${prefix}Ihre Anfrage zur Rechnung wurde an die zuständige Stelle weitergeleitet.`;
    default:
      return `${prefix}Ihr Anliegen wurde aufgenommen. Unser Team kümmert sich darum.`;
  }
}
