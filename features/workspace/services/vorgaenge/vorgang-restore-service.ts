import {
  patchMailVorgangInCache,
  removeMailVorgangFromCache,
} from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

export async function restoreVorgangFromArchive(
  vorgang: Vorgang
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`/api/vorgaenge/${vorgang.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "neu", archiv_kategorie: null }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return {
      ok: false,
      error: payload?.error ?? "Vorgang konnte nicht wiederhergestellt werden.",
    };
  }

  patchMailVorgangInCache(vorgang.id, {
    status: "neu",
    archiveCategory: undefined,
    intentLabel: undefined,
  });

  return { ok: true };
}

export async function deleteArchivedVorgang(
  vorgang: Vorgang
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`/api/vorgaenge/${vorgang.id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return {
      ok: false,
      error: payload?.error ?? "Vorgang konnte nicht gelöscht werden.",
    };
  }

  removeMailVorgangFromCache(vorgang.id);
  return { ok: true };
}

export async function deleteArchivedVorgaengeOlderThanDays(
  vorgaenge: Vorgang[],
  days: number
): Promise<number> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const targets = vorgaenge.filter((item) => {
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
