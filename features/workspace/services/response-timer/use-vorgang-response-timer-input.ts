"use client";

import { useMemo } from "react";
import { useVorgangStatus } from "@/features/workspace/services/status/use-vorgang-status";
import {
  resolveVorgangResponseTimerInput,
  type ResponseTimerInput,
} from "@/features/workspace/services/response-timer/response-timer-engine";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

const EMPTY_VORGANG: Vorgang = {
  id: "__timer-empty__",
  typ: "anfrage",
  titel: "",
  emoji: "",
  kunde: "",
  quelle: "",
  prioritaet: "mittel",
  status: "neu",
  helpyEmpfehlung: "",
  receivedAt: "",
  receivedLabel: "",
};

export function useVorgangResponseTimerInput(
  vorgang: Vorgang | null | undefined
): ResponseTimerInput | null {
  const { currentStatus } = useVorgangStatus(vorgang ?? EMPTY_VORGANG);

  return useMemo(() => {
    if (!vorgang) return null;
    return resolveVorgangResponseTimerInput(vorgang, { currentStatus });
  }, [vorgang, currentStatus]);
}
