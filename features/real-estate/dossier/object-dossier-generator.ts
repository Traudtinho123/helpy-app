import { resolveCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-context";
import { resolveReplyStyleLabel } from "@/features/company-knowledge/services/company-knowledge-context";
import type { ObjectDossier } from "@/features/real-estate/dossier/object-dossier-types";
import { upsertObjectDossier } from "@/features/real-estate/dossier/object-dossier-store";
import { getRealEstateObjectById } from "@/features/real-estate/object/object-memory";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import { formatObjectListingPriceLabel } from "@/features/portfolio/services/object-pricing-utils";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";
import type { DocumentLanguage } from "@/lib/company/company-profile-types";

function inferObjectType(object: RealEstateObject): string {
  const haystack = `${object.titel} ${object.beschreibung}`.toLowerCase();
  if (/gewerbe|büro|laden|commercial|retail/.test(haystack)) return "Gewerbe";
  if (/haus|villa|einfamilien|chalet|detached/.test(haystack)) return "Haus";
  return "Wohnung";
}

function applyReplyStyleToText(text: string, styleLabel: string): string {
  const normalized = styleLabel.toLowerCase();
  if (normalized.includes("kurz") || normalized.includes("direct")) {
    return text.replace(/\s+/g, " ").trim();
  }
  if (normalized.includes("ausführ") || normalized.includes("advisory")) {
    return `${text} Wir gehen gerne auf individuelle Fragen ein und beraten Sie persönlich.`;
  }
  return text;
}

function buildDescriptionParagraphs(
  object: RealEstateObject,
  language: DocumentLanguage,
  styleLabel: string
): string {
  const type = inferObjectType(object);
  const price = formatObjectListingPriceLabel(object.transaktion, object.preis);
  const area = object.wohnflaeche ?? "—";
  const rooms = object.zimmer ?? "—";
  const floor = object.stockwerk ?? "—";
  const year = object.baujahr ?? "—";
  const availability = object.verfuegbarkeit ?? "nach Vereinbarung";

  const baseDe = [
    `${object.titel} ist eine ${type.toLowerCase()} in ${object.adresse}, ${object.plz} ${object.ort}. Mit ${rooms} Zimmern und ${area} Wohnfläche bietet die Liegenschaft eine klare Ausgangslage für Interessenten, die ${object.transaktion === "Miete" ? "eine Mietwohnung" : "eine Eigentumsimmobilie"} in dieser Lage suchen.`,
    `Die Lage in ${object.ort} verbindet Alltagsnähe mit einer attraktiven Wohn- bzw. Geschäftsumgebung. Stockwerk ${floor}, Baujahr ${year} und Verfügbarkeit ab ${availability} runden das Profil ab.`,
    object.beschreibung.trim()
      ? object.beschreibung.trim()
      : `Besonderheiten: helle Räume, gepflegter Zustand und ein attraktives Preis-Leistungs-Verhältnis bei ${price}. Gerne stellen wir weitere Unterlagen und Besichtigungstermine bereit.`,
  ];

  const baseEn = [
    `${object.titel} is a ${type.toLowerCase()} located at ${object.adresse}, ${object.plz} ${object.ort}. With ${rooms} rooms and ${area} of living space, it offers a solid starting point for buyers or tenants looking in this area.`,
    `The location in ${object.ort} combines everyday convenience with an attractive residential environment. Floor ${floor}, year built ${year}, available from ${availability}.`,
    object.beschreibung.trim() ||
      `Highlights include bright rooms and an attractive price point at ${price}. We are happy to provide further documents and viewing appointments.`,
  ];

  const baseFr = [
    `${object.titel} est un(e) ${type.toLowerCase()} situé(e) à ${object.adresse}, ${object.plz} ${object.ort}. Avec ${rooms} pièces et ${area} de surface, le bien convient aux personnes recherchant une solution ${object.transaktion === "Miete" ? "locative" : "d'achat"} dans ce quartier.`,
    `L'emplacement à ${object.ort} allie proximité du quotidien et cadre de vie agréable. Étage ${floor}, année ${year}, disponibilité ${availability}.`,
    object.beschreibung.trim() ||
      `Atouts: pièces lumineuses et rapport qualité-prix intéressant à ${price}. Nous transmettons volontiers les documents et proposons des visites.`,
  ];

  const paragraphs =
    language === "en" ? baseEn : language === "fr" ? baseFr : baseDe;

  return paragraphs
    .map((paragraph) => applyReplyStyleToText(paragraph, styleLabel))
    .join("\n\n");
}

function buildHighlights(object: RealEstateObject): string[] {
  const highlights: string[] = [];

  if (object.wohnflaeche) highlights.push(`${object.wohnflaeche} Wohnfläche`);
  if (object.zimmer) highlights.push(`${object.zimmer} Zimmer`);
  if (object.stockwerk) highlights.push(`Stockwerk ${object.stockwerk}`);
  if (object.baujahr) highlights.push(`Baujahr ${object.baujahr}`);
  if (object.verfuegbarkeit) highlights.push(`Verfügbar ab ${object.verfuegbarkeit}`);
  if (object.transaktion && object.preis) {
    highlights.push(`${object.transaktion}: ${object.preis}`);
  }
  if (object.adresse && object.ort) {
    highlights.push(`Zentrale Lage in ${object.ort}`);
  }

  while (highlights.length < 4) {
    highlights.push("Individuelle Besichtigung auf Anfrage möglich");
    if (highlights.length >= 4) break;
  }

  return highlights.slice(0, 6);
}

function buildContactBlock(
  language: DocumentLanguage,
  companyName: string,
  phone: string,
  email: string,
  website: string,
  address: string
): string {
  const lines = [companyName, address, phone, email, website].filter(Boolean);

  if (language === "en") {
    return [`Contact ${companyName}`, ...lines.slice(1)].join("\n");
  }
  if (language === "fr") {
    return [`Contact ${companyName}`, ...lines.slice(1)].join("\n");
  }
  return [`Kontakt ${companyName}`, ...lines.slice(1)].join("\n");
}

function buildNextStepActions(language: DocumentLanguage): string[] {
  if (language === "en") {
    return [
      "Request a viewing appointment",
      "Request additional documents",
      "Clarify financing or rental terms",
    ];
  }
  if (language === "fr") {
    return [
      "Demander une visite",
      "Demander les documents",
      "Clarifier les conditions financières",
    ];
  }
  return [
    "Besichtigung anfragen",
    "Unterlagen anfordern",
    "Finanzierung bzw. Mietkonditionen klären",
  ];
}

export function generateObjectDossier(objectId: string): ObjectDossier | null {
  const object = getRealEstateObjectById(objectId);
  if (!object) return null;

  const profile = getCompanyProfileSnapshot();
  const resolved = resolveCompanyKnowledge(profile);
  const styleLabel = resolveReplyStyleLabel(resolved);
  const language = profile.documentLanguage ?? "de";
  const preisLabel = formatObjectListingPriceLabel(object.transaktion, object.preis);

  const eckdaten = [
    { label: "Typ", value: inferObjectType(object) },
    { label: "Zimmer", value: object.zimmer ?? "—" },
    { label: "Wohnfläche", value: object.wohnflaeche ?? "—" },
    { label: "Stockwerk", value: object.stockwerk ?? "—" },
    { label: "Baujahr", value: object.baujahr ?? "—" },
    { label: "Verfügbarkeit", value: object.verfuegbarkeit ?? "—" },
  ];

  return upsertObjectDossier(objectId, {
    status: "draft",
    titel: object.titel,
    adresse: object.adresse,
    plz: object.plz,
    ort: object.ort,
    land: object.land,
    objectType: inferObjectType(object),
    transaktion: object.transaktion ?? "—",
    preisLabel,
    eckdaten,
    description: buildDescriptionParagraphs(object, language, styleLabel),
    descriptionAiGenerated: true,
    highlights: buildHighlights(object),
    highlightsAiGenerated: true,
    contactBlock: buildContactBlock(
      language,
      resolved.companyName,
      resolved.phone,
      resolved.generalEmail,
      resolved.website,
      resolved.address
    ),
    nextStepActions: buildNextStepActions(language),
    contactAiGenerated: true,
  });
}
