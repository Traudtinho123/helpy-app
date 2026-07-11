"use client";

import { useMemo } from "react";
import {
  getConfirmedKundenaktenServerSnapshot,
  getConfirmedKundenaktenSnapshot,
  getKundenakteSnapshot,
  subscribeKundenakte,
} from "@/features/kundenakte/services/kundenakte-store";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";

export function useKundenakte(vorgangId: string): Kundenakte | null {
  const revision = useStoreRevision(subscribeKundenakte);

  return useMemo(
    () => getKundenakteSnapshot(vorgangId),
    [vorgangId, revision]
  );
}

export function useConfirmedKundenakten(): Kundenakte[] {
  const revision = useStoreRevision(subscribeKundenakte);

  return useMemo(() => {
    if (typeof window === "undefined") {
      return getConfirmedKundenaktenServerSnapshot();
    }
    return getConfirmedKundenaktenSnapshot();
  }, [revision]);
}
