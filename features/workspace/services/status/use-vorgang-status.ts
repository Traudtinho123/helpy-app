"use client";

import { useMemo } from "react";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import {
  getVorgangStatusSnapshot,
  subscribeStatus,
} from "@/features/workspace/services/status/status-engine";
import type { VorgangStatusSnapshot } from "@/features/workspace/services/status/types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

export function useVorgangStatus(vorgang: Vorgang): VorgangStatusSnapshot {
  const revision = useStoreRevision(subscribeStatus);

  return useMemo(
    () => getVorgangStatusSnapshot(vorgang),
    [vorgang, revision]
  );
}
