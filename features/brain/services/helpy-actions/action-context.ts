import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

function normalizePhone(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "—" || trimmed === "-") return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  return digits.length >= 6 ? trimmed : null;
}

function formatObjectAddress(
  adresse: string,
  plz: string,
  ort: string
): string | null {
  const parts = [adresse.trim(), [plz.trim(), ort.trim()].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return parts.length >= 5 ? parts : null;
}

export function resolveVorgangRouteAddress(vorgang: Vorgang): string | null {
  const linkedObject = peekRealEstateObjectByVorgangId(vorgang.id);
  if (linkedObject) {
    const formatted = formatObjectAddress(
      linkedObject.adresse,
      linkedObject.plz,
      linkedObject.ort
    );
    if (formatted) return formatted;
  }

  const customerAddress = vorgang.kunde.adresse?.trim();
  if (customerAddress && customerAddress !== "—") {
    return customerAddress;
  }

  const terminOrt = vorgang.termine.find((termin) => termin.ort?.trim())?.ort?.trim();
  if (terminOrt) return terminOrt;

  return null;
}

export function resolveVorgangPhone(vorgang: Vorgang): string | null {
  return normalizePhone(vorgang.kunde.telefon);
}

export function buildGoogleMapsUrl(address: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

export function buildTelUrl(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}
