import { mapVorgangDbRecordToBundle } from "@/features/vorgaenge/services/vorgang-db-mapper";
import type { VorgangDbRecord } from "@/features/vorgaenge/types/create-vorgang-types";
import {
  countArchivedVorgaengeOlderThan,
  patchVorgangInAllStores,
  removeLocalArchivedVorgaengeOlderThan,
  removeVorgangFromAllStores,
  resolvePersistedVorgangId,
} from "@/features/workspace/services/vorgaenge/vorgang-store-mutations";
import { invalidateVorgaengeSummaryCaches } from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

async function persistVorgangPatch(
  vorgang: Vorgang,
  body: Record<string, unknown>
): Promise<boolean> {
  const persistedId = resolvePersistedVorgangId(vorgang);
  if (!persistedId) return false;

  const response = await fetch(`/api/vorgaenge/${persistedId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) return false;

  const payload = (await response.json().catch(() => null)) as {
    vorgang?: { id: string };
  } | null;

  if (payload?.vorgang) {
    const bundle = mapVorgangDbRecordToBundle(payload.vorgang as VorgangDbRecord);
    patchVorgangInAllStores(vorgang, bundle.liste);
  }

  return true;
}

async function persistVorgangDelete(vorgang: Vorgang): Promise<boolean> {
  const persistedId = resolvePersistedVorgangId(vorgang);
  if (!persistedId) return false;

  const response = await fetch(`/api/vorgaenge/${persistedId}`, {
    method: "DELETE",
  });

  return response.ok;
}

export async function restoreVorgangFromArchive(
  vorgang: Vorgang
): Promise<{ ok: boolean; error?: string }> {
  const changed = patchVorgangInAllStores(vorgang, {
    status: "neu",
    archiveCategory: undefined,
    intentLabel: undefined,
  });

  void persistVorgangPatch(vorgang, {
    status: "neu",
    archiv_kategorie: null,
  });

  invalidateVorgaengeSummaryCaches();

  if (!changed) {
    return {
      ok: false,
      error: "Vorgang konnte nicht wiederhergestellt werden.",
    };
  }

  return { ok: true };
}

export async function deleteArchivedVorgang(
  vorgang: Vorgang
): Promise<{ ok: boolean; error?: string }> {
  const changed = removeVorgangFromAllStores(vorgang);
  void persistVorgangDelete(vorgang);
  invalidateVorgaengeSummaryCaches();

  if (!changed) {
    return {
      ok: false,
      error: "Vorgang konnte nicht gelöscht werden.",
    };
  }

  return { ok: true };
}

export async function restoreVorgaengeFromArchive(
  vorgaenge: Vorgang[]
): Promise<{ count: number }> {
  let count = 0;
  for (const vorgang of vorgaenge) {
    const result = await restoreVorgangFromArchive(vorgang);
    if (result.ok) count += 1;
  }
  return { count };
}

export async function deleteArchivedVorgaenge(
  vorgaenge: Vorgang[]
): Promise<{ count: number }> {
  let count = 0;
  for (const vorgang of vorgaenge) {
    const result = await deleteArchivedVorgang(vorgang);
    if (result.ok) count += 1;
  }
  return { count };
}

export async function deleteArchivedVorgaengeOlderThanDays(
  vorgaenge: Vorgang[],
  days: number
): Promise<number> {
  const expectedCount = countArchivedVorgaengeOlderThan(vorgaenge, days);

  try {
    const response = await fetch("/api/vorgaenge/archive/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });

    if (response.ok) {
      const payload = (await response.json()) as { deleted?: number };
      const removed = removeLocalArchivedVorgaengeOlderThan(days);
      invalidateVorgaengeSummaryCaches();
      return payload.deleted ?? removed ?? expectedCount;
    }
  } catch {
    // Fallback: lokale Löschung + Einzel-DELETEs
  }

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const targets = vorgaenge.filter((item) => {
    if (item.status !== "zu_archivieren") return false;
    const received = Date.parse(item.receivedAt);
    return !Number.isNaN(received) && received < cutoff;
  });

  let deleted = 0;
  for (const item of targets) {
    const result = await deleteArchivedVorgang(item);
    if (result.ok) deleted += 1;
  }

  return deleted;
}

export { countArchivedVorgaengeOlderThan };
