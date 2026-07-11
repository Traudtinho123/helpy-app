import type { BrainIntent, IntentDetectionInput } from "@/features/brain/services/brain-v2/types";

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function detectIntent(event: IntentDetectionInput): BrainIntent {
  const text = `${event.title} ${JSON.stringify(event.payload)}`.toLowerCase();

  switch (event.type) {
    case "neue-immobilienanfrage":
      return containsAny(text, ["besichtigung", "besichtigen"])
        ? "besichtigung"
        : "immobilienanfrage";

    case "neue-offertanfrage":
      return "offertanfrage";

    case "neue-whatsapp-nachricht":
      return containsAny(text, ["rückruf", "zurückruf", "anruf"])
        ? "rueckruf"
        : "normale_nachricht";

    case "neuer-kalendereintrag":
      return containsAny(text, ["besichtigung"])
        ? "besichtigung"
        : "terminwunsch";

    case "terminaenderung":
      return "terminwunsch";

    case "frist-erkannt":
      return "frist";

    case "neue-datei":
      return "dokument";

    case "neue-facebook-lead":
      return "immobilienanfrage";

    case "neues-kontaktformular":
      if (containsAny(text, ["mandat", "beratung", "kanzlei", "recht"])) {
        return "mandatsanfrage";
      }
      if (containsAny(text, ["angebot", "offerte"])) {
        return "angebotsanfrage";
      }
      return "mandatsanfrage";

    case "neue-email":
    default:
      if (containsAny(text, ["rechnung", "zahlung", "beleg"])) {
        return "rechnung";
      }
      if (containsAny(text, ["angebot", "angebotsanfrage", "offerte"])) {
        return "angebotsanfrage";
      }
      if (containsAny(text, ["besichtigung", "immobilie", "wohnung", "objekt"])) {
        return containsAny(text, ["besichtigung"])
          ? "besichtigung"
          : "immobilienanfrage";
      }
      if (containsAny(text, ["frist", "einspruch", "stellungnahme"])) {
        return "frist";
      }
      if (containsAny(text, ["termin", "kalender"])) {
        return "terminwunsch";
      }
      if (containsAny(text, ["rückruf", "anruf"])) {
        return "rueckruf";
      }
      if (containsAny(text, ["pdf", "anhang", "dokument", "datei"])) {
        return "dokument";
      }
      return "normale_nachricht";
  }
}

export function getIntentEmoji(intent: BrainIntent): string {
  const map: Record<BrainIntent, string> = {
    angebotsanfrage: "📄",
    immobilienanfrage: "🏡",
    besichtigung: "🔑",
    rueckruf: "📞",
    terminwunsch: "📅",
    frist: "⚠",
    rechnung: "🧾",
    dokument: "📎",
    mandatsanfrage: "⚖",
    offertanfrage: "🔨",
    normale_nachricht: "📨",
  };
  return map[intent];
}
