import { PLATFORM_INQUIRY_MISSING } from "@/features/brain/types/platform-inquiry-types";
import type { PreparedDocument } from "@/features/documents/services/types";
import { HELPY_PREPARED_LABEL } from "@/features/review/services/safety/review-mode";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

const MISSING = "Bitte ergänzen";

function readContextValue(
  lines: string[] | undefined,
  prefix: string
): string | null {
  if (!lines) return null;
  const line = lines.find((entry) => entry.startsWith(`${prefix}:`));
  if (!line) return null;
  const value = line.slice(prefix.length + 1).trim();
  return value && value !== PLATFORM_INQUIRY_MISSING ? value : null;
}

function resolveSkill(vorgang: Vorgang): PreparedDocument["skill"] {
  if (
    vorgang.skill === "real-estate" ||
    vorgang.skill === "construction" ||
    vorgang.skill === "consulting-legal"
  ) {
    return vorgang.skill;
  }
  return "real-estate";
}

/** Erstellt einen Exposé-Entwurf aus erkannten Vorgangsdaten. */
export function prepareExposeFromVorgang(vorgang: Vorgang): PreparedDocument {
  const objekt = readContextValue(vorgang.detectedContext, "Objekt") ?? MISSING;
  const adresse = readContextValue(vorgang.detectedContext, "Adresse") ?? MISSING;
  const preis =
    readContextValue(vorgang.detectedContext, "Preis") ??
    readContextValue(vorgang.detectedContext, "Miete") ??
    MISSING;
  const beschreibung = vorgang.summary ?? vorgang.snippet ?? MISSING;
  const kontakt = vorgang.kunde || MISSING;
  const linkedObject = peekRealEstateObjectByVorgangId(vorgang.id);

  return {
    id: `expose-${vorgang.id}`,
    typeId: "expose",
    skill: resolveSkill(vorgang),
    typeLabel: "Exposé",
    title: objekt !== MISSING ? `Exposé — ${objekt}` : `Exposé — ${vorgang.titel}`,
    customer: kontakt,
    vorgangId: vorgang.id,
    vorgangTitle: vorgang.titel,
    objectId: linkedObject?.objectId,
    status: "zur-pruefung",
    category: "helpy-vorbereitet",
    lastEdited: vorgang.receivedLabel,
    helpyHint: HELPY_PREPARED_LABEL,
    preparedByHelpy: true,
    previewSections: [
      {
        heading: "Objekt",
        content: objekt,
      },
      {
        heading: "Adresse",
        content: adresse,
      },
      {
        heading: "Bilder",
        content: "Platzhalter — Bitte ergänzen",
      },
      {
        heading: "Preis / Miete",
        content: preis,
      },
      {
        heading: "Beschreibung",
        content: beschreibung,
      },
      {
        heading: "Kontaktperson",
        content: kontakt,
      },
      {
        heading: "Status",
        content: "Von HELPY vorbereitet",
      },
    ],
  };
}
