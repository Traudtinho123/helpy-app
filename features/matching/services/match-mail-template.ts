import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import { formatObjectListingPriceLabel } from "@/features/portfolio/services/object-pricing-utils";

export type MatchMailInput = {
  object: RealEstateObject;
  kundeName: string;
  brokerName?: string;
  viewingSlots?: string[];
};

export function buildMatchMailDraft(input: MatchMailInput): {
  subject: string;
  body: string;
} {
  const { object, kundeName, brokerName = "Ihr Makler-Team", viewingSlots } = input;
  const price = formatObjectListingPriceLabel(object.transaktion, object.preis);
  const slots =
    viewingSlots ??
    [
      "Dienstag, 14:00–15:00 Uhr",
      "Mittwoch, 10:00–11:00 Uhr",
      "Donnerstag, 17:00–18:00 Uhr",
    ];

  const subject = `Passendes Objekt: ${object.titel} in ${object.ort}`;

  const body = `Guten Tag ${kundeName},

wir haben ein Objekt gefunden, das zu Ihrem Suchprofil passt:

🏠 ${object.titel}
📍 ${object.adresse}, ${object.plz} ${object.ort}
💰 ${price}
🛏 ${object.zimmer ?? "—"} Zimmer · ${object.wohnflaeche ?? "—"} m²

${object.beschreibung ? `${object.beschreibung.slice(0, 300)}${object.beschreibung.length > 300 ? "…" : ""}\n\n` : ""}Mögliche Besichtigungstermine:
${slots.map((slot) => `• ${slot}`).join("\n")}

Bitte teilen Sie uns mit, welcher Termin für Sie am besten passt — oder ob Sie weitere Informationen wünschen.

Freundliche Grüsse
${brokerName}`;

  return { subject, body };
}
