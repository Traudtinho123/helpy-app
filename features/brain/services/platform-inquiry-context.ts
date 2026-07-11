import { PLATFORM_INQUIRY_MISSING } from "@/features/brain/types/platform-inquiry-types";
import { isPlatformRealEstateVorgang } from "@/features/brain/services/platform-email-detector";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";

export function readPlatformContextValue(
  lines: string[] | undefined,
  prefix: string
): string | null {
  if (!lines) return null;
  const line = lines.find((entry) => entry.startsWith(`${prefix}:`));
  if (!line) return null;
  const value = line.slice(prefix.length + 1).trim();
  return value && value !== PLATFORM_INQUIRY_MISSING ? value : null;
}

export function resolvePlatformInteressentEmail(
  vorgang: ListeVorgang
): string | null {
  if (!isPlatformRealEstateVorgang(vorgang)) return null;
  return readPlatformContextValue(vorgang.detectedContext, "E-Mail");
}

export function resolvePlatformInteressentName(
  vorgang: ListeVorgang
): string | null {
  if (!isPlatformRealEstateVorgang(vorgang)) return null;
  return readPlatformContextValue(vorgang.detectedContext, "Interessent");
}
