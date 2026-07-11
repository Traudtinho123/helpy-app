import type { RealEstateObjectTransaction } from "@/features/real-estate/object/object-types";

export type ObjectListingPriceDisplay = {
  badge: "Miete" | "Kauf" | null;
  formattedPreis: string;
  preisSuffix: string | null;
};

function extractNumericAmount(preis: string): string | null {
  const match = preis.match(/[\d'''\s.,]+/);
  if (!match) return null;
  const digits = match[0].replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  if (Number.isNaN(value)) return null;
  return `CHF ${value.toLocaleString("de-CH")}`;
}

export function formatObjectListingPrice(
  transaktion: RealEstateObjectTransaction | null,
  preis: string | null
): ObjectListingPriceDisplay {
  if (!preis?.trim()) {
    return {
      badge: transaktion,
      formattedPreis: "Auf Anfrage",
      preisSuffix: null,
    };
  }

  const normalized = extractNumericAmount(preis) ?? preis.trim();

  if (transaktion === "Miete") {
    return {
      badge: "Miete",
      formattedPreis: normalized,
      preisSuffix: "/ Monat",
    };
  }

  if (transaktion === "Kauf") {
    return {
      badge: "Kauf",
      formattedPreis: normalized,
      preisSuffix: null,
    };
  }

  return {
    badge: null,
    formattedPreis: normalized,
    preisSuffix: null,
  };
}

export function formatObjectListingPriceLabel(
  transaktion: RealEstateObjectTransaction | null,
  preis: string | null
): string {
  const display = formatObjectListingPrice(transaktion, preis);
  if (display.preisSuffix) {
    return `${display.formattedPreis} ${display.preisSuffix}`;
  }
  return display.formattedPreis;
}
