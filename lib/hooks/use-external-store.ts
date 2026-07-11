"use client";

import { useSyncExternalStore } from "react";

/**
 * Nur für echte Live-Stores (Gmail-Sync, Notifications, Workspace-Context, …).
 *
 * NICHT verwenden für Detailseiten (Objektakte, Kundenakte, Dokumente, …).
 * Dort: `useStoreRevision` + `useMemo` (siehe docs/store-stability.md).
 *
 * getSnapshot MUSS stabile Referenzen liefern — keine map/filter/sort/spread pro Aufruf.
 */
export function useExternalStore<T>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T
): T {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot ?? getSnapshot
  );
}
