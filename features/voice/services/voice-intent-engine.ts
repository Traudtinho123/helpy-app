import type {
  VoiceIntent,
  VoiceIntentResult,
} from "@/features/voice/types/voice-types";
import { VOICE_INTENT_LABELS } from "@/features/voice/types/voice-types";
import type { VorgangTyp } from "@/features/workspace/services/vorgaenge/types";

type IntentRule = {
  intent: VoiceIntent;
  keywords: string[];
};

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
