import { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

/** Parst Gmail-/Outlook-Datumswerte zuverlässig als ISO-UTC. */
export function normalizeMailTimestampToIso(
  value: string | null | undefined
): string | null {
  if (!value?.trim()) return null;

  const parsed = Date.parse(value.trim());
  if (Number.isNaN(parsed)) return null;

  return new Date(parsed).toISOString();
}

/**
 * Eingangszeitpunkt der Kundenanfrage — immer aus Mail-Metadaten (Gmail/Outlook),
 * nie aus HELPY-Verarbeitungszeit.
 */
export function resolveVorgangInquiryReceivedAt(
  vorgang: Vorgang
): string | null {
  if (isHelpyReportVorgang(vorgang)) return null;

  // Bereits geantwortet — wir warten auf den Kunden, nicht umgekehrt.
  if (vorgang.latestMessageDirection === "outgoing") return null;

  const candidates: Array<string | null | undefined> = [];

  if (vorgang.latestMessageDirection === "incoming") {
    candidates.push(vorgang.latestMessageAt);
  }

  candidates.push(vorgang.emailDate, vorgang.receivedAt);

  for (const raw of candidates) {
    const iso = normalizeMailTimestampToIso(raw);
    if (iso) return iso;
  }

  return null;
}
