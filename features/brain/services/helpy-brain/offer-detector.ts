import type {
  BrainEmailInput,
  ErkanntesAngebot,
  OfferDetectionResult,
} from "@/features/brain/services/helpy-brain/types";

function extractArbeitsplaetze(text: string): number | undefined {
  const match = text.match(/(\d+)\s*arbeitspl/i);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

function extractPositionen(text: string): string[] {
  const positionen: string[] = [];
  const lower = text.toLowerCase();

  if (/schreibtisch/i.test(text)) positionen.push("Schreibtische");
  if (/stühle|stuhl/i.test(lower)) positionen.push("Bürostühle");
  if (/lieferung/i.test(lower)) positionen.push("Lieferung");
  if (/montage/i.test(lower)) positionen.push("Montage");
  if (/trennwand/i.test(lower)) positionen.push("Trennwände");

  return positionen;
}

function extractDeadline(text: string): string | undefined {
  if (/bis\s+freitag/i.test(text)) return "Freitag";
  if (/bis\s+montag/i.test(text)) return "Montag";
  if (/bis\s+(?:zum\s+)?(\d{1,2}\.\d{1,2}\.)/i.test(text)) {
    const match = text.match(/bis\s+(?:zum\s+)?(\d{1,2}\.\d{1,2}\.)/i);
    return match?.[1];
  }
  return undefined;
}

export function detectOffers(email: BrainEmailInput): OfferDetectionResult {
  const text = `${email.betreff ?? ""} ${email.inhalt}`;
  const lower = text.toLowerCase();

  const istAngebotsanfrage =
    /angebot/i.test(lower) ||
    /arbeitspl/i.test(lower) ||
    /angebotsanfrage/i.test(lower);

  if (!istAngebotsanfrage) {
    return { angebote: [], istAngebotsanfrage: false };
  }

  const menge = extractArbeitsplaetze(text);
  const positionen = extractPositionen(text);
  const deadline = extractDeadline(text);

  const titel =
    menge !== undefined
      ? `Büroausstattung — ${menge} Arbeitsplätze`
      : "Angebotsanfrage";

  const angebote: ErkanntesAngebot[] = [
    {
      titel,
      positionen:
        positionen.length > 0
          ? positionen
          : menge !== undefined
            ? [`${menge} Arbeitsplätze`]
            : ["Angebotspositionen offen"],
      menge,
      deadline,
      kategorie: "angebotsanfrage",
    },
  ];

  return { angebote, istAngebotsanfrage: true };
}
