import { getVorgangStatusSnapshot } from "@/features/workspace/services/status/status-engine";
import { shouldSuppressReopenedVorgang } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import {
  isVorgangActiveOpen,
  isVorgangAwaitingCustomerReply,
} from "@/features/workspace/services/vorgaenge/vorgang-thread-status";
import type { Vorgang, VorgangStatus } from "@/features/workspace/services/vorgaenge/types";

export {
  isVorgangActiveOpen,
  isVorgangAwaitingCustomerReply,
  getEffectiveVorgangPriority,
} from "@/features/workspace/services/vorgaenge/vorgang-thread-status";

/** Einheitlicher Effektiv-Status für Filter, Counts und UI. */
export function getEffectiveVorgangStatus(vorgang: Vorgang): VorgangStatus {
  if (shouldSuppressReopenedVorgang(vorgang)) {
    // Erledigt + Antwort vom Unternehmen → „Warten auf Antwort“, nicht wieder aktiv.
    if (vorgang.latestMessageDirection === "outgoing") {
      return "wartend";
    }
    return "erledigt";
  }

  if (isVorgangAwaitingCustomerReply(vorgang)) {
    return "wartend";
  }

  if (vorgang.status === "erledigt") {
    return "erledigt";
  }

  const { currentStatus } = getVorgangStatusSnapshot(vorgang);
  if (currentStatus === "erledigt") {
    return "erledigt";
  }
  if (currentStatus === "wartet-auf-rueckmeldung") {
    return "wartend";
  }

  return vorgang.status;
}

export function isVorgangErledigt(vorgang: Vorgang): boolean {
  return getEffectiveVorgangStatus(vorgang) === "erledigt";
}
