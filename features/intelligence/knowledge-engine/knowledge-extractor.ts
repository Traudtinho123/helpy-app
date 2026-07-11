import type { CustomerPreferredContact } from "@/features/intelligence/types/intelligence-types";

export type ExtractedCustomerKnowledge = {
  preferences: string[];
  budget: string | null;
  communicationStyle: string | null;
  preferredContact: CustomerPreferredContact | null;
  importantFacts: string[];
  panelLabels: string[];
};

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function formatBudget(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return raw.trim();
  const formatted = Number(digits).toLocaleString("de-CH");
  return `${formatted} CHF`;
}

/** Regelbasierte Extraktion — keine LLM-Integration. */
export function extractCustomerKnowledgeFromText(
  text: string
): ExtractedCustomerKnowledge {
  const normalized = normalizeText(text.toLowerCase());
  const preferences: string[] = [];
  const importantFacts: string[] = [];
  const panelLabels: string[] = [];
  let budget: string | null = null;
  let communicationStyle: string | null = null;
  let preferredContact: CustomerPreferredContact | null = null;

  if (/\b(hund|hündin|katze|haustier|tier)\b/.test(normalized)) {
    preferences.push("Haustier vorhanden");
    panelLabels.push("Haustier erkannt");
  }

  if (
    /nur\s+(telefonisch|telefon|anruf|per\s+telefon)/.test(normalized) ||
    /bitte\s+(nur\s+)?(anrufen|telefonieren)/.test(normalized) ||
    /(rückruf|zurückrufen|anrufen)/.test(normalized)
  ) {
    preferredContact = "Telefon";
    communicationStyle = "Bevorzugt telefonisch";
    panelLabels.push("Telefon bevorzugt");
  }

  if (
    /(nur\s+)?(per\s+)?e-?mail/.test(normalized) ||
    /schriftlich\s+(kontaktieren|antworten)/.test(normalized)
  ) {
    preferredContact = preferredContact ?? "E-Mail";
    communicationStyle = communicationStyle ?? "Bevorzugt E-Mail";
    if (!panelLabels.includes("Telefon bevorzugt")) {
      panelLabels.push("E-Mail bevorzugt");
    }
  }

  if (/whatsapp/.test(normalized)) {
    preferredContact = "WhatsApp";
    panelLabels.push("WhatsApp bevorzugt");
  }

  const budgetMatch =
    text.match(/budget\s*[:\s]*([\d.'\s]+(?:chf|eur|€|fr\.?)?)/i) ??
    text.match(/([\d.'\s]{4,})\s*(?:chf|eur|€|fr\.?)/i);

  if (budgetMatch?.[1]) {
    budget = formatBudget(budgetMatch[1]);
    panelLabels.push("Budget erkannt");
  }

  const monthMatch = text.match(
    /(?:umzug|ziehen|einziehen)[^.!\n]{0,40}(januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)/i
  );
  if (monthMatch?.[1]) {
    const month =
      monthMatch[1].charAt(0).toUpperCase() + monthMatch[1].slice(1).toLowerCase();
    importantFacts.push(`Umzug ${month}`);
    panelLabels.push(`Umzug ${month}`);
  }

  if (/dringend|so schnell wie möglich|schnellstmöglich/.test(normalized)) {
    preferences.push("Dringlichkeit hoch");
    communicationStyle = communicationStyle ?? "Kurze, direkte Antworten";
    panelLabels.push("Dringlichkeit erkannt");
  }

  if (/familie|kinder|schulalter/.test(normalized)) {
    preferences.push("Familie mit Kindern");
    panelLabels.push("Familie erkannt");
  }

  if (/finanzierung|hypothek|eigenkapital/.test(normalized)) {
    importantFacts.push("Finanzierung relevant");
    panelLabels.push("Finanzierung erwähnt");
  }

  if (/rollstuhl|barrierefrei|lift/.test(normalized)) {
    preferences.push("Barrierefreiheit wichtig");
    panelLabels.push("Barrierefreiheit relevant");
  }

  if (
    /nachmittag|nach 14|ab 14|13:\d{2}|14:\d{2}|15:\d{2}|16:\d{2}/.test(normalized)
  ) {
    preferences.push("Bevorzugt Termine am Nachmittag");
    panelLabels.push("Nachmittag bevorzugt");
  }

  if (/garage|parkplatz|stellplatz/.test(normalized)) {
    preferences.push("Sucht Wohnung mit Garage/Parkplatz");
    panelLabels.push("Garage gesucht");
  }

  if (
    /antwortet\s+(meist\s+)?schnell|schnelle\s+rückmeldung|zeitnah\s+antworten/.test(
      normalized
    )
  ) {
    communicationStyle = communicationStyle ?? "Antwortet meist schnell";
    panelLabels.push("Schnelle Antworten");
  }

  return {
    preferences: uniqueStrings(preferences),
    budget,
    communicationStyle,
    preferredContact,
    importantFacts: uniqueStrings(importantFacts),
    panelLabels: uniqueStrings(panelLabels),
  };
}
