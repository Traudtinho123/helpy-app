import type {
  PortalDurationDays,
  PortalListingPayload,
  PortalObjectSnapshot,
} from "@/features/portal-publish/types/portal-publish-types";

function parseNumber(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const normalized = value.replace(/[^\d.,]/g, "").replace(/'/g, "").replace(",", ".");
  const match = normalized.match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : null;
}

function mapCategory(snapshot: PortalObjectSnapshot): PortalListingPayload["category"] {
  const haystack = `${snapshot.titel} ${snapshot.beschreibung}`.toLowerCase();
  if (/haus|villa|einfamilien|reihenhaus|doppelhaus/.test(haystack)) return "HOUSE";
  if (/gewerbe|büro|buero|laden|praxis|lager/.test(haystack)) return "COMMERCIAL";
  if (/grundstück|grundstueck|bauland|parzelle/.test(haystack)) return "PLOT";
  if (/wohnung|studio|maisonette|attika|loft|apartment/.test(haystack)) {
    return "APARTMENT";
  }
  return "APARTMENT";
}

/**
 * HELPY Objekt → Portal-Listing Mapping
 * titel→title, beschreibung→description, preis→price.value,
 * preis_typ (aus transaktion)→price.interval, zimmer→numberOfRooms,
 * flaeche/wohnflaeche→livingSpace, adresse→address, plz/ort,
 * verfuegbar_ab→availableFrom, objekt_typ→category, bilder→attachments
 */
export function mapObjectToPortalListing(
  snapshot: PortalObjectSnapshot,
  durationDays: PortalDurationDays
): PortalListingPayload {
  const isRent = snapshot.transaktion === "Miete";
  const priceValue = parseNumber(snapshot.preis);

  return {
    title: snapshot.titel.trim() || "Immobilie",
    description: snapshot.beschreibung.trim() || snapshot.titel.trim() || "",
    price: {
      value: priceValue,
      currency: "CHF",
      interval: isRent ? "MONTH" : "TOTAL",
    },
    numberOfRooms: parseNumber(snapshot.zimmer),
    livingSpace: parseNumber(snapshot.wohnflaeche),
    address: {
      street: snapshot.adresse.trim(),
      postalCode: snapshot.plz.trim(),
      locality: snapshot.ort.trim(),
      country: snapshot.land.trim() || "CH",
    },
    availableFrom: snapshot.verfuegbarkeit?.trim() || null,
    category: mapCategory(snapshot),
    transaction: isRent ? "RENT" : "BUY",
    attachments: snapshot.imageUrls
      .filter((url) => url.trim())
      .map((url, index) => ({
        url,
        title: `Bild ${index + 1}`,
        isCover: index === 0,
      })),
    durationDays,
  };
}

export function snapshotFromRealEstateObject(input: {
  objectId: string;
  titel: string;
  beschreibung: string;
  preis: string | null;
  transaktion: "Kauf" | "Miete" | null;
  zimmer: string | null;
  wohnflaeche: string | null;
  adresse: string;
  plz: string;
  ort: string;
  land: string;
  verfuegbarkeit?: string | null;
  stockwerk?: string | null;
  baujahr?: string | null;
  imageUrls: string[];
}): PortalObjectSnapshot {
  return {
    objectId: input.objectId,
    titel: input.titel,
    beschreibung: input.beschreibung,
    preis: input.preis,
    transaktion: input.transaktion,
    zimmer: input.zimmer,
    wohnflaeche: input.wohnflaeche,
    adresse: input.adresse,
    plz: input.plz,
    ort: input.ort,
    land: input.land,
    verfuegbarkeit: input.verfuegbarkeit ?? null,
    stockwerk: input.stockwerk ?? null,
    baujahr: input.baujahr ?? null,
    imageUrls: input.imageUrls,
  };
}
