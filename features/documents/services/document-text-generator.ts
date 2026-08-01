import { readPlatformContextValue } from "@/features/brain/services/platform-inquiry-context";
import type { DocumentPreviewSection } from "@/features/documents/services/types";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import { resolveVorgangSender } from "@/features/workspace/services/vorgaenge/resolve-vorgang-sender";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { getCompanyProfile } from "@/lib/company/company-profile-service";

export type CreateDocumentKind = "angebot" | "offerte" | "expose";

function readContext(
  lines: string[] | undefined,
  prefix: string
): string | null {
  return readPlatformContextValue(lines, prefix);
}

function objectLine(object: RealEstateObject | null | undefined): string {
  if (!object) return "";
  return `${object.titel}\n${object.adresse}, ${object.plz} ${object.ort}\n${object.preis ?? "Preis auf Anfrage"}`;
}

/** Regelbasierte HELPY-Texte — strukturiert wie KI-Vorschlag, ohne externen API-Call. */
export function generateDocumentPreviewSections(input: {
  kind: CreateDocumentKind;
  vorgang: Vorgang;
  object?: RealEstateObject | null;
}): DocumentPreviewSection[] {
  const profile = getCompanyProfile();
  const sender = resolveVorgangSender(input.vorgang);
  const objekt =
    readContext(input.vorgang.detectedContext, "Objekt") ??
    input.object?.titel ??
    input.vorgang.titel;
  const adresse =
    readContext(input.vorgang.detectedContext, "Adresse") ??
    (input.object
      ? `${input.object.adresse}, ${input.object.plz} ${input.object.ort}`
      : "—");
  const preis =
    readContext(input.vorgang.detectedContext, "Preis") ??
    readContext(input.vorgang.detectedContext, "Miete") ??
    input.object?.preis ??
    "Auf Anfrage";
  const anfrage =
    input.vorgang.summary ??
    input.vorgang.snippet ??
    readContext(input.vorgang.detectedContext, "Nachricht") ??
    "—";

  if (input.kind === "expose") {
    return [
      { heading: "Objekt", content: objekt },
      { heading: "Adresse", content: adresse },
      {
        heading: "Beschreibung",
        content: `${objekt} in ${adresse}.\n\n${input.object?.beschreibung ?? anfrage}`,
      },
      { heading: "Preis / Miete", content: preis },
      {
        heading: "Ausstattung",
        content:
          input.object?.beschreibung ??
          "Helles, gepflegtes Objekt — Details bitte bei Besichtigung.",
      },
      {
        heading: "Kontakt",
        content: `${profile.companyName}\n${profile.phone}\n${profile.email}`,
      },
    ];
  }

  if (input.kind === "offerte") {
    return [
      {
        heading: "Leistungsumfang",
        content: `Offerte für ${sender.name} bezüglich ${objekt}.\n\n${anfrage}\n\nUmfang gemäss Besichtigung und Vereinbarung.`,
      },
      {
        heading: "Kalkulation",
        content: "Pauschalangebot gemäss Besichtigung — Positionen bitte prüfen.",
      },
      {
        heading: "Gültigkeit",
        content: "30 Tage ab Ausstellungsdatum",
      },
      {
        heading: "Zahlungsbedingungen",
        content: profile.paymentTerms || "30 Tage netto",
      },
    ];
  }

  return [
    {
      heading: "Leistung",
      content: `Sehr geehrte/r ${sender.name},\n\nvielen Dank für Ihre Anfrage zu ${objekt}. Gerne unterbreiten wir Ihnen folgendes Angebot:\n\n${anfrage}`,
    },
    {
      heading: "Vergütung",
      content: preis !== "Auf Anfrage" ? preis : "Gemäss separater Vereinbarung",
    },
    {
      heading: "Gültigkeit",
      content: "30 Tage ab Ausstellungsdatum",
    },
    {
      heading: "Nächste Schritte",
      content: `Bei Rückfragen erreichen Sie uns unter ${profile.phone} oder ${profile.email}.`,
    },
  ];
}
