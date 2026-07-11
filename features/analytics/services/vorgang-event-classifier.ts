import { readPlatformContextValue } from "@/features/brain/services/platform-inquiry-context";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import type { MailProvider } from "@/lib/database/types";

export type VorgangEventClassification = {
  provider: MailProvider;
  providerThreadId: string;
  vorgangId: string;
  typ: string;
  intent: string | null;
  intentLabel: string | null;
  kundeName: string | null;
  prioritaet: string | null;
  isAppointmentRequest: boolean;
  isNewInquiry: boolean;
  receivedAt: string;
};

function matchesIntent(vorgang: Vorgang, keys: string[]): boolean {
  const haystack = [vorgang.intent, vorgang.intentLabel, vorgang.typ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return keys.some((key) => haystack.includes(key.toLowerCase()));
}

export function isAppointmentRequestVorgang(vorgang: Vorgang): boolean {
  const besichtigung = readPlatformContextValue(
    vorgang.detectedContext,
    "Besichtigung"
  );
  if (besichtigung) return true;
  return matchesIntent(vorgang, ["termin", "besichtigung", "terminwunsch"]);
}

export function isNewInquiryVorgang(vorgang: Vorgang): boolean {
  return (
    vorgang.typ === "anfrage" ||
    matchesIntent(vorgang, [
      "neue anfrage",
      "neuer_kunde",
      "neuer kunde",
      "interessent",
      "immobilien",
      "immobilienanfrage",
    ])
  );
}

function resolveReceivedAt(vorgang: Vorgang): string | null {
  const candidate =
    vorgang.emailDate ??
    vorgang.receivedAt ??
    vorgang.latestMessageAt ??
    null;
  if (!candidate) return null;
  const parsed = Date.parse(candidate);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function resolveProvider(vorgang: Vorgang): MailProvider | null {
  if (vorgang.mailProvider === "gmail" || vorgang.mailProvider === "outlook") {
    return vorgang.mailProvider;
  }
  if (vorgang.quelle.toLowerCase().includes("outlook")) return "outlook";
  if (vorgang.quelle.toLowerCase().includes("gmail")) return "gmail";
  return null;
}

export function classifyVorgangForAnalytics(
  vorgang: Vorgang
): VorgangEventClassification | null {
  const provider = resolveProvider(vorgang);
  const providerThreadId = vorgang.threadId ?? vorgang.id;
  const receivedAt = resolveReceivedAt(vorgang);

  if (!provider || !providerThreadId || !receivedAt) {
    return null;
  }

  return {
    provider,
    providerThreadId,
    vorgangId: vorgang.id,
    typ: vorgang.typ,
    intent: vorgang.intent ?? null,
    intentLabel: vorgang.intentLabel ?? null,
    kundeName: vorgang.kunde ?? null,
    prioritaet: vorgang.prioritaet ?? null,
    isAppointmentRequest: isAppointmentRequestVorgang(vorgang),
    isNewInquiry: isNewInquiryVorgang(vorgang),
    receivedAt,
  };
}
