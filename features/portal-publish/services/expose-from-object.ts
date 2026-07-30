import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import { getConfirmedObjectImages } from "@/features/real-estate/object/object-image-service";
import { sortObjectImages } from "@/features/real-estate/object/object-image-utils";
import type { ExposePayload } from "@/features/documents/pdf/types";
import { formatObjectListingPriceLabel } from "@/features/portfolio/services/object-pricing-utils";
import { resolveCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-context";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";

/** Baut ein Exposé-PDF-Payload direkt aus dem Objekt — Fallback für manuellen Portal-Upload. */
export function buildExposePayloadFromObject(
  object: RealEstateObject
): ExposePayload {
  const profile = getCompanyProfileSnapshot();
  const resolved = resolveCompanyKnowledge(profile);
  const images = sortObjectImages(getConfirmedObjectImages(object.objectId));
  const priceLabel = formatObjectListingPriceLabel(
    object.transaktion,
    object.preis
  );

  const highlights: ExposePayload["highlights"] = [];
  if (object.zimmer) {
    highlights.push({ label: "Zimmer", value: object.zimmer });
  }
  if (object.wohnflaeche) {
    highlights.push({ label: "Wohnfläche", value: object.wohnflaeche });
  }
  if (object.stockwerk) {
    highlights.push({ label: "Stockwerk", value: object.stockwerk });
  }
  if (object.baujahr) {
    highlights.push({ label: "Baujahr", value: object.baujahr });
  }
  if (object.verfuegbarkeit) {
    highlights.push({ label: "Verfügbar", value: object.verfuegbarkeit });
  }
  if (object.transaktion) {
    highlights.push({ label: "Art", value: object.transaktion });
  }
  if (highlights.length === 0) {
    highlights.push(
      { label: "Objekt", value: "Details prüfen" },
      { label: "Status", value: "Vorbereitet" }
    );
  }

  return {
    kind: "expose",
    title: object.titel,
    subtitle: object.transaktion
      ? `${object.transaktion} · ${object.plz} ${object.ort}`
      : `${object.plz} ${object.ort}`,
    address: object.adresse,
    cityLine: `${object.plz} ${object.ort}, ${object.land || "Schweiz"}`,
    priceLabel,
    transactionLabel: object.transaktion ?? undefined,
    description:
      object.beschreibung?.trim() ||
      `${object.titel} in ${object.ort}. Weitere Details folgen im Exposé.`,
    locationText: `${object.adresse}, ${object.plz} ${object.ort}. Zentrale Lage mit guter Anbindung.`,
    highlights,
    imageUrls: images.map((image) => image.url).slice(0, 8),
    contact: {
      company: resolved.companyName,
      name: resolved.companyName,
      email: resolved.generalEmail,
      phone: resolved.phone,
      address: resolved.address,
    },
  };
}
