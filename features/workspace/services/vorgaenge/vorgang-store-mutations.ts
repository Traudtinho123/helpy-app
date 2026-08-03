import {
  getDbVorgaenge,
  patchDbVorgangInCache,
  removeDbVorgangFromCache,
} from "@/features/vorgaenge/services/db-vorgaenge-store";
import {
  getGmailVorgaenge,
  patchMailVorgangInCache,
  removeMailVorgangFromCache,
} from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import {
  getOutlookVorgaenge,
  patchOutlookVorgangInCache,
  removeOutlookVorgangFromCache,
} from "@/features/outlook/services/outlook-vorgaenge-store";
import { getVorgangDedupeKey } from "@/features/workspace/services/vorgaenge/vorgang-deduplication";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

export function isPersistedVorgangId(id: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id
    ) || id.startsWith("dev-vorgang-")
  );
}

export function resolvePersistedVorgangId(vorgang: Vorgang): string | null {
  if (isPersistedVorgangId(vorgang.id)) return vorgang.id;

  const messageId = vorgang.sourceEventId?.trim();
  if (!messageId) return null;

  const dbMatch = getDbVorgaenge().find(
    (item) => item.sourceEventId === messageId
  );
  return dbMatch?.id ?? null;
}

export function collectRelatedVorgangStoreIds(vorgang: Vorgang): string[] {
  const ids = new Set<string>();
  if (vorgang.id?.trim()) ids.add(vorgang.id);

  const persistedId = resolvePersistedVorgangId(vorgang);
  if (persistedId) ids.add(persistedId);

  const messageId = vorgang.sourceEventId?.trim();
  if (messageId) {
    ids.add(`archive-gmail-${messageId}`);
    ids.add(`archive-outlook-${messageId}`);
  }

  const dedupeKey = getVorgangDedupeKey(vorgang);
  for (const item of [
    ...getGmailVorgaenge(),
    ...getOutlookVorgaenge(),
    ...getDbVorgaenge(),
  ]) {
    if (getVorgangDedupeKey(item) === dedupeKey) {
      ids.add(item.id);
    }
  }

  return [...ids];
}

export function patchVorgangInAllStores(
  vorgang: Vorgang,
  patch: Partial<Vorgang>
): boolean {
  let changed = false;

  for (const id of collectRelatedVorgangStoreIds(vorgang)) {
    if (patchMailVorgangInCache(id, patch)) changed = true;
    if (patchOutlookVorgangInCache(id, patch)) changed = true;
    if (patchDbVorgangInCache(id, patch)) changed = true;
  }

  return changed;
}

export function removeVorgangFromAllStores(vorgang: Vorgang): boolean {
  let changed = false;

  for (const id of collectRelatedVorgangStoreIds(vorgang)) {
    if (removeMailVorgangFromCache(id)) changed = true;
    if (removeOutlookVorgangFromCache(id)) changed = true;
    if (removeDbVorgangFromCache(id)) changed = true;
  }

  return changed;
}

export function removeLocalArchivedVorgaengeOlderThan(days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const seen = new Set<string>();
  let removed = 0;

  for (const item of [
    ...getGmailVorgaenge(),
    ...getOutlookVorgaenge(),
    ...getDbVorgaenge(),
  ]) {
    if (item.status !== "zu_archivieren") continue;
    const received = Date.parse(item.receivedAt);
    if (Number.isNaN(received) || received >= cutoff) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    if (removeVorgangFromAllStores(item)) removed += 1;
  }

  return removed;
}

export function countArchivedVorgaengeOlderThan(
  vorgaenge: Vorgang[],
  days: number
): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const seen = new Set<string>();

  return vorgaenge.filter((item) => {
    if (item.status !== "zu_archivieren") return false;
    const received = Date.parse(item.receivedAt);
    if (Number.isNaN(received) || received >= cutoff) return false;
    const key = getVorgangDedupeKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).length;
}
