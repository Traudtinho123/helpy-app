import { extractViewingDetails } from "@/features/brain/services/viewing-extraction";
import type { BrainV3Result } from "@/features/brain/types/brain-v3-types";
import { extractSenderName } from "@/features/brain/services/brain-result-to-vorgang";
import type {
  MailAnalysisExtraction,
  MailDringlichkeit,
  MailSprache,
  MailTon,
} from "@/features/reply-drafts/types/mail-analysis-types";

export type MailAnalysisInput = {
  from: string;
  subject: string;
  body: string;
  brainResult?: BrainV3Result;
};

const GENERIC_PHRASES = [
  "vielen dank für ihre anfrage",
  "vielen dank für deine anfrage",
  "thank you for your inquiry",
  "merci pour votre message",
];

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function detectLanguage(text: string): MailSprache {
  const sample = text.slice(0, 1200).toLowerCase();
  const englishHits = (sample.match(
    /\b(the|and|please|would|could|available|apartment|property|regarding)\b/g
  )?.length ?? 0);
  const frenchHits = (sample.match(
    /\b(bonjour|merci|appartement|disponible|cordialement|madame|monsieur)\b/g
  )?.length ?? 0);
  const germanHits = (sample.match(
    /\b(und|ich|wir|bitte|wohnung|zimmer|besichtigung|grüsse|grüße)\b/g
  )?.length ?? 0);

  if (englishHits >= 4 && englishHits > germanHits && englishHits >= frenchHits) {
    return "en";
  }
  if (frenchHits >= 3 && frenchHits > germanHits) {
    return "fr";
  }
  return "de";
}

function detectTone(text: string, language: MailSprache): MailTon {
  const sample = text.toLowerCase();
  if (
    /\b(hi|hey|hallo)\b/.test(sample) ||
    /\b(du|dein|deine|dir|dich)\b/.test(sample)
  ) {
    return "informell";
  }
  if (language !== "de") return "formell";
  if (/\b(sie|ihr|ihnen)\b/.test(sample) || /sehr geehrte/i.test(sample)) {
    return "formell";
  }
  return "formell";
}

function extractQuestions(text: string): string[] {
  const questions = new Set<string>();

  const explicit = text.match(/[^.!?\n]*\?+/g) ?? [];
  for (const raw of explicit) {
    const cleaned = normalizeText(raw.replace(/\?+$/, "?"));
    if (cleaned.length >= 8) questions.add(cleaned);
  }

  const implicitPatterns = [
    /(?:könnten sie|können sie|könntest du|kannst du|bitte)[^.!?\n]{8,120}/gi,
    /(?:ist|sind|gibt es|haben sie)[^.!?\n]{8,120}(?:\?|\.)/gi,
    /(?:what is|is the|are there|could you)[^.!?\n]{8,120}(?:\?|\.)/gi,
    /(?:est-ce que|avez-vous|pourriez-vous)[^.!?\n]{8,120}(?:\?|\.)/gi,
  ];

  for (const pattern of implicitPatterns) {
    for (const match of text.match(pattern) ?? []) {
      const cleaned = normalizeText(match);
      if (cleaned.length >= 12) questions.add(cleaned);
    }
  }

  return [...questions].slice(0, 6);
}

function extractNamedObjects(
  subject: string,
  body: string,
  viewingObjectHint: string | null,
  brainResult?: BrainV3Result
): string[] {
  const objects = new Set<string>();
  const haystack = `${subject}\n${body}`;

  if (viewingObjectHint) objects.add(viewingObjectHint);

  const platformName = brainResult?.platformInquiry?.objektname;
  if (platformName && platformName !== "—") objects.add(platformName);

  const platformAddress = brainResult?.platformInquiry?.objektadresse;
  if (platformAddress && platformAddress !== "—") objects.add(platformAddress);

  const streetMatches =
    haystack.match(
      /\b([A-ZÄÖÜ][a-zäöüß]+(?:straße|strasse|weg|gasse|platz|str\.)\s*\d+[a-zA-Z]?)\b/g
    ) ?? [];
  streetMatches.forEach((match) => objects.add(match.trim()));

  const quoted = haystack.match(/[„"']([^„"']{4,80})[“"']/g) ?? [];
  quoted.forEach((match) => {
    const inner = match.replace(/^[„"']|[“"']$/g, "").trim();
    if (inner.length >= 4) objects.add(inner);
  });

  return [...objects].slice(0, 5);
}

function extractMentionedDates(text: string): string[] {
  const dates = new Set<string>();
  const patterns = [
    /\b(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/gi,
    /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\b(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/gi,
    /\b\d{1,2}\.\s?\d{1,2}\.(?:\s?\d{2,4})?\b/g,
    /\b(?:nächste woche|naechste woche|diese woche|morgen|übermorgen|next week|tomorrow)\b/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.match(pattern) ?? []) {
      dates.add(normalizeText(match));
    }
  }

  return [...dates].slice(0, 5);
}

function inferAnliegen(
  subject: string,
  body: string,
  brainResult?: BrainV3Result
): string {
  if (brainResult?.summary?.trim()) {
    return brainResult.summary.trim();
  }

  const firstMeaningful =
    body
      .split(/\n+/)
      .map((line) => line.trim())
      .find((line) => line.length >= 20 && !/^>{1,2}/.test(line)) ?? "";

  if (firstMeaningful) return firstMeaningful.slice(0, 180);
  return subject.trim() || "Allgemeine Anfrage";
}

function inferDesiredAction(
  text: string,
  intent?: string
): string | null {
  const haystack = `${intent ?? ""} ${text}`.toLowerCase();
  if (/besichtigung|viewing|visite/.test(haystack)) return "Termin vereinbaren";
  if (/angebot|offerte|quote|devis/.test(haystack)) return "Angebot erstellen";
  if (/rückruf|rueckruf|callback|call back/.test(haystack)) return "Rückruf";
  if (/verfügbar|verfuegbar|available|disponible/.test(haystack)) {
    return "Verfügbarkeit klären";
  }
  return null;
}

function inferUrgency(text: string): MailDringlichkeit {
  const lower = text.toLowerCase();
  if (/dringend|sofort|asap|urgent|eilig|heute noch/.test(lower)) {
    return "hoch";
  }
  return "normal";
}

export function extractMailAnalysisRuleBased(
  input: MailAnalysisInput
): MailAnalysisExtraction {
  const body = normalizeText(`${input.subject}\n\n${input.body}`);
  const viewing = extractViewingDetails({
    from: input.from,
    subject: input.subject,
    snippet: input.body,
    platformInquiry: input.brainResult?.platformInquiry,
  });

  const sprache = detectLanguage(body);
  const ton = detectTone(body, sprache);
  const genannte_daten = [
    ...extractMentionedDates(body),
    ...(viewing.preferredDateLabel ? [viewing.preferredDateLabel] : []),
    ...(viewing.preferredTimeWindow ? [viewing.preferredTimeWindow] : []),
  ];

  return {
    absender_name: viewing.contactName ?? extractSenderName(input.from),
    sprache,
    ton,
    anliegen: inferAnliegen(input.subject, input.body, input.brainResult),
    konkrete_fragen: extractQuestions(body),
    gewuenschte_aktion:
      inferDesiredAction(body, input.brainResult?.intent) ??
      (viewing.preferredDate ? "Termin vereinbaren" : null),
    genannte_objekte: extractNamedObjects(
      input.subject,
      input.body,
      viewing.objectHint,
      input.brainResult
    ),
    genannte_daten: [...new Set(genannte_daten)],
    dringlichkeit:
      viewing.urgency === "hoch" ? "hoch" : inferUrgency(body),
  };
}

export function isGenericReplyPhrase(text: string): boolean {
  const normalized = text.toLowerCase();
  return GENERIC_PHRASES.some((phrase) => normalized.includes(phrase));
}

export const MAIL_ANALYSIS_EXTRACTION_PROMPT = `Analysiere die eingehende E-Mail und antworte NUR als JSON:
{
  "absender_name": "string",
  "sprache": "de" | "en" | "fr",
  "ton": "formell" | "informell",
  "anliegen": "string",
  "konkrete_fragen": ["string"],
  "gewuenschte_aktion": "string | null",
  "genannte_objekte": ["string"],
  "genannte_daten": ["string"],
  "dringlichkeit": "normal" | "hoch"
}`;
