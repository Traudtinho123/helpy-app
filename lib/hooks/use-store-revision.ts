"use client";

import { useEffect, useState } from "react";

/**
 * Detailseiten-Pattern: Store-Änderungen über Revision + useMemo,
 * statt useSyncExternalStore / useExternalStore.
 *
 * Der Subscribe-Callback erhöht nur einen Zähler; Daten werden
 * in useMemo aus dem Store gelesen (getSnapshot-Regeln gelten dort nicht).
 */
export function useStoreRevision(
  subscribe: (onStoreChange: () => void) => () => void
): number {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    return subscribe(() => {
      setRevision((value) => value + 1);
    });
  }, [subscribe]);

  return revision;
}
