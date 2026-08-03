import {
  isPersistedVorgangId,
  patchVorgangInAllStores,
  resolvePersistedVorgangId,
} from "@/features/workspace/services/vorgaenge/vorgang-store-mutations";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

/** Lokaler Store + DB-Status nach erfolgreichem Gmail/Outlook-Versand. */
export async function persistReplySentVorgangStatus(
  vorgang: Vorgang
): Promise<void> {
  patchVorgangInAllStores(vorgang, { status: "wartend" });

  const persistedId = resolvePersistedVorgangId(vorgang);
  if (!persistedId || !isPersistedVorgangId(persistedId)) return;

  try {
    await fetch(`/api/vorgaenge/${persistedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "warten_auf_antwort" }),
    });
  } catch {
    // DB-Update optional — lokaler Status bleibt gültig
  }
}
