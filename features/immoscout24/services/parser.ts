import type {
  ImmoScout24InquiryType,
  ImmoScout24Priority,
  ImmoScout24InquiryStatus,
  ImmoScout24RawInquiry,
  NormalizedImmoScout24Inquiry,
} from "@/features/immoscout24/services/types";

function detectTypes(raw: ImmoScout24RawInquiry): ImmoScout24InquiryType[] {
  const types: ImmoScout24InquiryType[] = ["neu"];
  const text = `${raw.inquiryType} ${raw.message ?? ""}`.toLowerCase();

  if (text.includes("besichtigung") || text.includes("viewing")) {
    types.push("besichtigung");
  }
  if (text.includes("kauf") || text.includes("buy")) {
    types.push("kauf");
  }
  if (text.includes("miet") || text.includes("rent")) {
    types.push("miete");
  }
  if (text.includes("rückruf") || text.includes("anruf") || text.includes("call")) {
    types.push("rueckruf");
  }

  return [...new Set(types)];
}

function mapPriority(types: ImmoScout24InquiryType[]): ImmoScout24Priority {
  if (types.includes("besichtigung") || types.includes("rueckruf")) return "hoch";
  if (types.includes("kauf")) return "mittel";
  return "niedrig";
}

function mapStatus(_raw: ImmoScout24RawInquiry): ImmoScout24InquiryStatus {
  return "neu";
}

/** Mappt rohe ImmoScout24-Daten → normalisierte Domain-Typen. */
export function parseImmoScout24Inquiry(
  raw: ImmoScout24RawInquiry
): NormalizedImmoScout24Inquiry {
  const detectedTypes = detectTypes(raw);

  return {
    id: raw.id,
    name: raw.contactName,
    objekt: raw.listingTitle,
    kauf: detectedTypes.includes("kauf"),
    miete: detectedTypes.includes("miete"),
    besichtigung: detectedTypes.includes("besichtigung"),
    telefon: raw.phone ?? "",
    email: raw.email ?? "",
    wunschdatum: raw.preferredDate ?? "—",
    prioritaet: mapPriority(detectedTypes),
    status: mapStatus(raw),
    receivedAt: raw.createdAt,
    message: raw.message,
    detectedTypes,
  };
}

export function parseImmoScout24Inquiries(
  rawItems: ImmoScout24RawInquiry[]
): NormalizedImmoScout24Inquiry[] {
  return rawItems.map(parseImmoScout24Inquiry);
}
