"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getFollowUpServerSnapshot,
  getFollowUpSnapshot,
  getOpenFollowUpsServerSnapshot,
  getOpenFollowUpsSnapshot,
  subscribeFollowUp,
} from "@/features/followup/services/followup-store";
import type { FollowUp } from "@/features/followup/types/followup-types";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";

/**
 * sessionStorage-backed stores must return the server snapshot until after
 * mount — `typeof window` is already true on the client's first render and
 * would otherwise hydrate from storage before React can match SSR HTML.
 */
function useClientStoreReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return ready;
}

export function useFollowUp(vorgangId: string): FollowUp | null {
  const revision = useStoreRevision(subscribeFollowUp);
  const ready = useClientStoreReady();

  return useMemo(() => {
    if (!ready) {
      return getFollowUpServerSnapshot();
    }
    return getFollowUpSnapshot(vorgangId);
  }, [ready, revision, vorgangId]);
}

export function useOpenFollowUps() {
  const revision = useStoreRevision(subscribeFollowUp);
  const ready = useClientStoreReady();

  return useMemo(() => {
    if (!ready) {
      return getOpenFollowUpsServerSnapshot();
    }
    return getOpenFollowUpsSnapshot();
  }, [ready, revision]);
}
