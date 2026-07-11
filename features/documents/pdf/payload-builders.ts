import type { PreparedDocument } from "@/features/documents/services/types";
import type { Offer } from "@/features/offers/mock/mock-offers";
import { getOfferDocument } from "@/features/offers/mock/offer-preview";
import type {
  AngebotPayload,
  BesichtigungsterminPayload,
  ExposePayload,
  OffertePayload,
  ProfessionalDocumentPayload,
} from "@/features/documents/pdf/types";
import { getCompanyProfile } from "@/lib/company/company-profile";

function sectionMap(document: PreparedDocument): Record<string, string> {
  const map: Record<string, string> = {};
  for (const section of document.previewSections) {
    if (section.heading) {
      map[section.heading.toLowerCase()] = section.content;
    }
  }
  return map;
}

function findSection(
  map: Record<string, string>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const hit = Object.entries(map).find(([heading]) =>
      heading.includes(key.toLowerCase())
    );
    if (hit) return hit[1];
  }
  return undefined;
}

export function buildAngebotPayloadFromOffer(offer: Offer): AngebotPayload {
  const document = getOfferDocument(offer);
  return {
    kind: "angebot",
    documentNumber: offer.number,
    title: offer.title,
    issuedAt: offer.createdAt,
    validUntil: offer.deadline,
    customer: {
      company: offer.customer.company,
      name: offer.customer.contact,
      email: offer.customer.email,
      address: offer.customer.address,
    },
    intro: document.intro,
    lineItems: offer.lineItems.map((item, index) => ({
      id: item.id,
      position: index + 1,
      quantity: item.quantity,
      description: item.description,
      unitPrice: item.unitPrice,
    })),
    vatRate: offer.vatRate,
    paymentTerms: document.paymentTerms,
    closing: document.closing,
  };
}

export function buildOffertePayloadFromOffer(offer: Offer): OffertePayload {
  const document = getOfferDocument(offer);
  const profile = getCompanyProfile();
  return {
    kind: "offerte",
    referenceNumber: offer.number.startsWith("O-")
      ? offer.number
      : `O-${offer.number}`,
    title: offer.title,
    issuedAt: offer.createdAt,
    validUntil: offer.deadline,
    customer: {
      company: offer.customer.company,
      name: offer.customer.contact,
      email: offer.customer.email,
      address: offer.customer.address,
    },
    projectDescription: document.intro,
    lineItems: offer.lineItems.map((item, index) => ({
      id: item.id,
      position: index + 1,
      quantity: item.quantity,
      description: item.description,
      unitPrice: item.unitPrice,
      detail: undefined,
    })),
    vatRate: offer.vatRate,
    paymentTerms: document.paymentTerms,
    legalNotice:
      "Diese Offerte ist nach Annahme verbindlich. Änderungen bedürfen der Schriftform. Es gelten die AGB des Anbieters.",
    closing: document.closing || profile.companySignature,
  };
}

function parseMoneyish(text: string | undefined): number {
  if (!text) return 0;
  const match = text.replace(/\./g, "").replace(",", ".").match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export function buildPayloadFromPreparedDocument(
  document: PreparedDocument
): ProfessionalDocumentPayload | null {
  const map = sectionMap(document);
  const profile = getCompanyProfile();

  if (document.typeId === "angebot") {
    const leistung =
      findSection(map, "leistung", "umfang") ??
      document.previewSections[0]?.content ??
      document.title;
    const verguetung = findSection(map, "vergütung", "preis", "kondition");
    return {
      kind: "angebot",
      documentNumber: `A-${document.id.toUpperCase()}`,
      title: document.title,
      issuedAt: document.lastEdited,
      validUntil: findSection(map, "gültigkeit", "frist") ?? "30 Tage",
      customer: { name: document.customer },
      intro: leistung,
      lineItems: [
        {
          id: `${document.id}-1`,
          position: 1,
          quantity: 1,
          description: leistung.slice(0, 120),
          unitPrice: parseMoneyish(verguetung) || 0,
        },
      ],
      vatRate: profile.defaultVatRate,
      paymentTerms: profile.paymentTerms,
      closing: profile.companySignature,
    };
  }

  if (document.typeId === "offerte") {
    const scope =
      findSection(map, "leistung", "umfang") ??
      document.previewSections[0]?.content ??
      document.title;
    const kalkulation = findSection(map, "kalkulation", "preis");
    return {
      kind: "offerte",
      referenceNumber: `OFF-${document.id.toUpperCase()}`,
      title: document.title,
      issuedAt: document.lastEdited,
      validUntil: findSection(map, "gültigkeit") ?? "30 Tage",
      customer: { name: document.customer },
      projectDescription: scope,
      lineItems: [
        {
          id: `${document.id}-1`,
          quantity: 1,
          description: "Leistung gemäss Offerte",
          unitPrice: parseMoneyish(kalkulation) || 0,
          detail: kalkulation ?? scope,
        },
      ],
      vatRate: profile.defaultVatRate,
      paymentTerms: profile.paymentTerms,
      legalNotice:
        "Diese Offerte ist nach Annahme verbindlich. Änderungen bedürfen der Schriftform.",
      closing: profile.companySignature,
    };
  }

  if (document.typeId === "expose") {
    const highlights: ExposePayload["highlights"] = [];
    const overview =
      findSection(map, "objekt", "übersicht") ??
      document.previewSections[0]?.content ??
      "";
    const zimmer = overview.match(/(\d+)\s*Zimmer/i)?.[1];
    const area = overview.match(/([\d.,]+)\s*m²/i)?.[1];
    const year = overview.match(/Baujahr\s*(\d{4})/i)?.[1];
    if (zimmer) highlights.push({ label: "Zimmer", value: zimmer });
    if (area) highlights.push({ label: "Wohnfläche", value: `${area} m²` });
    if (year) highlights.push({ label: "Baujahr", value: year });
    if (highlights.length === 0) {
      highlights.push(
        { label: "Objekt", value: "Details prüfen" },
        { label: "Status", value: "Vorbereitet" }
      );
    }

    return {
      kind: "expose",
      title: document.title.replace(/^Exposé\s*[—–-]\s*/i, ""),
      address:
        findSection(map, "adresse", "lage")?.split("\n")[0] ??
        document.customer,
      cityLine: "",
      priceLabel:
        findSection(map, "preis", "miete", "angebotspreis") ?? "Preis auf Anfrage",
      description:
        findSection(map, "beschreibung", "ausstattung", "lage") ?? overview,
      locationText:
        findSection(map, "lage") ??
        "Lagebeschreibung bitte im Exposé ergänzen.",
      highlights,
      imageUrls: [],
      contact: {
        name: profile.companyName,
        email: profile.email,
        phone: profile.phone,
      },
    };
  }

  if (document.typeId === "besichtigungstermin") {
    const termindaten = findSection(map, "termin", "datum") ?? "";
    const dateMatch = termindaten.match(
      /(\d{1,2}\.\d{1,2}\.\d{2,4})/
    );
    const timeMatch = termindaten.match(/(\d{1,2}[:.]\d{2})\s*Uhr?/i);
    return {
      kind: "besichtigungstermin",
      title: document.title,
      dateLabel: dateMatch?.[1] ?? document.lastEdited,
      timeLabel: timeMatch ? `${timeMatch[1].replace(".", ":")} Uhr` : "Uhrzeit folgt",
      objectTitle:
        findSection(map, "objekt", "treffpunkt") ?? document.title,
      address:
        findSection(map, "adresse", "treffpunkt", "ort") ??
        "Adresse bitte ergänzen",
      directionsHint: findSection(map, "anfahrt", "hinweis"),
      visitor: { name: document.customer },
      contact: {
        name: profile.companyName,
        email: profile.email,
        phone: profile.phone,
      },
      checklist: [
        "Personalausweis",
        "Finanzierungsnachweis (falls vorhanden)",
        "Notizen / Fragen zum Objekt",
      ],
      notes: findSection(map, "hinweis", "notiz", "rückmeldung"),
    } satisfies BesichtigungsterminPayload;
  }

  return null;
}

export function canGeneratePdfForDocument(document: PreparedDocument): boolean {
  return (
    document.typeId === "angebot" ||
    document.typeId === "offerte" ||
    document.typeId === "expose" ||
    document.typeId === "besichtigungstermin"
  );
}
