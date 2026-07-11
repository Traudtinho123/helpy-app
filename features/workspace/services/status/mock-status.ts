import type {
  HelpyVorgangStatus,
  StatusHistoryEntry,
  VorgangStatusSnapshot,
} from "@/features/workspace/services/status/types";
import {
  staticIsoWithOffset,
  staticTimeFromIso,
} from "@/features/workspace/services/status/time-utils";

export function buildDefaultHistory(
  vorgangId: string,
  receivedAt: string,
  actionLabels: string[] = []
): VorgangStatusSnapshot {
  const entries: StatusHistoryEntry[] = [
    {
      id: `${vorgangId}-h1`,
      at: staticIsoWithOffset(receivedAt, 0),
      time: staticTimeFromIso(receivedAt, 0),
      label: "Eingang erkannt",
    },
    {
      id: `${vorgangId}-h2`,
      at: staticIsoWithOffset(receivedAt, 1),
      time: staticTimeFromIso(receivedAt, 1),
      label: "Von HELPY vorbereitet",
    },
  ];

  if (actionLabels[0]) {
    entries.push({
      id: `${vorgangId}-h3`,
      at: staticIsoWithOffset(receivedAt, 2),
      time: staticTimeFromIso(receivedAt, 2),
      label: `${actionLabels[0]} vorbereitet`,
    });
    entries.push({
      id: `${vorgangId}-h4`,
      at: staticIsoWithOffset(receivedAt, 4),
      time: staticTimeFromIso(receivedAt, 4),
      label: "Wartet auf Prüfung",
    });
  }

  return {
    vorgangId,
    currentStatus: actionLabels.length
      ? "wartet-auf-rueckmeldung"
      : "von-helpy-vorbereitet",
    history: entries,
  };
}

export const DEFAULT_ACTION_LABELS_BY_INTENT: Record<string, string[]> = {
  angebotsanfrage: ["Antwort"],
  immobilienanfrage: ["Besichtigung"],
  besichtigung: ["Besichtigung"],
  rueckruf: ["Rückruf"],
  offertanfrage: ["Offerte"],
  mandatsanfrage: ["Erstgespräch"],
  frist: ["Frist"],
  terminwunsch: ["Termin"],
  normale_nachricht: ["Antwort"],
};

export function resolveInitialStatus(
  hasActions: boolean
): HelpyVorgangStatus {
  return hasActions ? "wartet-auf-rueckmeldung" : "von-helpy-vorbereitet";
}
