import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";

const persistedMailMessageIds = new Set<string>();

export function rememberPersistedMailMessageId(
  messageId: string | null | undefined
): void {
  const normalized = messageId?.trim();
  if (!normalized) return;
  persistedMailMessageIds.add(normalized);
}

export function hasPersistedMailMessageId(
  messageId: string | null | undefined
): boolean {
  const normalized = messageId?.trim();
  if (!normalized) return false;
  return persistedMailMessageIds.has(normalized);
}

export function seedPersistedMailMessageIdsFromListe(
  vorgaenge: ListeVorgang[]
): void {
  for (const vorgang of vorgaenge) {
    rememberPersistedMailMessageId(vorgang.sourceEventId);
  }
}
