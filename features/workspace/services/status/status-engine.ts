import {
  buildDefaultHistory,
  DEFAULT_ACTION_LABELS_BY_INTENT,
} from "@/features/workspace/services/status/mock-status";
import {
  staticIsoWithOffset,
  staticTimeFromIso,
  MOCK_REFERENCE_ISO,
} from "@/features/workspace/services/status/time-utils";
import { shouldSuppressReopenedVorgang } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import type {
  AppendHistoryInput,
  DailyStatusSummary,
  HelpyVorgangStatus,
  StatusHistoryEntry,
  VorgangStatusSnapshot,
} from "@/features/workspace/services/status/types";
import { STATUS_PANEL_MESSAGE } from "@/features/workspace/services/status/types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

const snapshots = new Map<string, VorgangStatusSnapshot>();
const seededVorgaenge = new Set<string>();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function buildSnapshotForVorgang(
  vorgang: Vorgang,
  index: number
): VorgangStatusSnapshot {
  const intent = vorgang.intent ?? vorgang.typ;
  const actionLabels = DEFAULT_ACTION_LABELS_BY_INTENT[intent] ?? ["Antwort"];
  const hasPreparedActions =
    (vorgang.preparedActions?.length ?? 0) > 0 || actionLabels.length > 0;

  let snapshot = buildDefaultHistory(
    vorgang.id,
    vorgang.receivedAt ?? MOCK_REFERENCE_ISO,
    hasPreparedActions ? actionLabels : []
  );

  if (index >= 3 && index <= 6) {
    snapshot = {
      ...snapshot,
      currentStatus: "von-helpy-vorbereitet",
      history: snapshot.history.filter(
        (entry) => entry.label !== "Wartet auf Prüfung"
      ),
    };
    return snapshot;
  }

  if (index === 7 || index === 8) {
    return {
      ...snapshot,
      currentStatus: "bestaetigt",
      history: [
        ...snapshot.history,
        {
          id: `${vorgang.id}-seed-b`,
          at: staticIsoWithOffset(vorgang.receivedAt, 5),
          time: staticTimeFromIso(vorgang.receivedAt, 5),
          label: "Bestätigt",
        },
      ],
    };
  }

  if (index === 9) {
    return {
      ...snapshot,
      currentStatus: "erledigt",
      history: [
        ...snapshot.history,
        {
          id: `${vorgang.id}-seed-b`,
          at: staticIsoWithOffset(vorgang.receivedAt, 5),
          time: staticTimeFromIso(vorgang.receivedAt, 5),
          label: "Bestätigt",
        },
        {
          id: `${vorgang.id}-seed-e`,
          at: staticIsoWithOffset(vorgang.receivedAt, 6),
          time: staticTimeFromIso(vorgang.receivedAt, 6),
          label: "Erledigt",
        },
      ],
    };
  }

  return snapshot;
}

function ensureSnapshot(vorgang: Vorgang): VorgangStatusSnapshot {
  const existing = snapshots.get(vorgang.id);
  if (existing) return existing;

  const snapshot = buildDefaultHistory(
    vorgang.id,
    vorgang.receivedAt ?? MOCK_REFERENCE_ISO,
    []
  );

  snapshots.set(vorgang.id, snapshot);
  return snapshot;
}

export function getStatusSnapshotById(
  vorgangId: string
): VorgangStatusSnapshot | null {
  return snapshots.get(vorgangId) ?? null;
}

export function getVorgangStatusSnapshot(vorgang: Vorgang): VorgangStatusSnapshot {
  return ensureSnapshot(vorgang);
}

export function getStatusHistory(vorgangId: string): StatusHistoryEntry[] {
  const snapshot = snapshots.get(vorgangId);
  return snapshot ? [...snapshot.history] : [];
}

export function setVorgangStatus(
  vorgangId: string,
  status: HelpyVorgangStatus
): void {
  const snapshot = snapshots.get(vorgangId);
  if (!snapshot) return;
  snapshots.set(vorgangId, { ...snapshot, currentStatus: status });
  notify();
}

export function appendHistoryEntry(input: AppendHistoryInput): void {
  const snapshot = snapshots.get(input.vorgangId);
  if (!snapshot) return;

  const lastAt =
    snapshot.history.at(-1)?.at ??
    staticIsoWithOffset("2026-07-07T09:00:00+02:00", 0);
  const at = input.at ?? staticIsoWithOffset(lastAt, 1);
  const entryIndex = snapshot.history.length + 1;
  const entry: StatusHistoryEntry = {
    id: `${input.vorgangId}-h${entryIndex}`,
    at,
    time: staticTimeFromIso(at),
    label: input.label,
  };

  snapshots.set(input.vorgangId, {
    vorgangId: input.vorgangId,
    currentStatus: input.status ?? snapshot.currentStatus,
    history: [...snapshot.history, entry],
  });
  notify();
}

export function recordReviewOpened(vorgangId: string): void {
  appendHistoryEntry({
    vorgangId,
    label: "In Prüfung",
    status: "in-pruefung",
  });
}

export function recordDocumentRecognized(
  vorgangId: string,
  fileName: string
): void {
  const snapshot = snapshots.get(vorgangId);
  if (!snapshot) return;

  const label = `Dokument erkannt: ${fileName}`;
  if (snapshot.history.some((entry) => entry.label === label)) return;

  appendHistoryEntry({
    vorgangId,
    label,
    status: snapshot.currentStatus,
  });
}

export function recordReviewConfirmed(vorgangId: string): void {
  appendHistoryEntry({
    vorgangId,
    label: "Bestätigt",
    status: "bestaetigt",
  });
}

export function recordGmailReplySent(vorgangId: string): void {
  appendHistoryEntry({
    vorgangId,
    label: "Warten auf Antwort",
    status: "wartet-auf-rueckmeldung",
  });
}

export function recordAppointmentConfirmed(
  vorgangId: string,
  platform: "apple" | "google"
): void {
  appendHistoryEntry({
    vorgangId,
    label: "Termin bestätigt",
    status: "bestaetigt",
  });
  appendHistoryEntry({
    vorgangId,
    label:
      platform === "apple"
        ? "Besichtigung wurde im Apple Kalender gespeichert."
        : "Termin wurde im Google Kalender gespeichert.",
    status: "bestaetigt",
  });
}

export function recordViewingSavedToCalendar(
  vorgangId: string,
  platform: "apple" | "google"
): void {
  appendHistoryEntry({
    vorgangId,
    label: "Termin bestätigt",
    status: "bestaetigt",
  });
  appendHistoryEntry({
    vorgangId,
    label: "Besichtigung wurde im Kalender gespeichert.",
    status: "bestaetigt",
  });
}

export function recordVorgangErledigt(vorgangId: string): void {
  appendHistoryEntry({
    vorgangId,
    label: "Erledigt",
    status: "erledigt",
  });
}

export function getDailyStatusSummary(vorgaenge: Vorgang[]): DailyStatusSummary {
  let vorbereitet = 0;
  let wartenAufPruefung = 0;
  let bestaetigt = 0;
  let erledigt = 0;

  for (const vorgang of vorgaenge) {
    const waitingForCustomerReply =
      !shouldSuppressReopenedVorgang(vorgang) &&
      vorgang.latestMessageDirection === "outgoing";

    if (waitingForCustomerReply) {
      continue;
    }

    const isErledigt =
      shouldSuppressReopenedVorgang(vorgang) ||
      vorgang.status === "erledigt" ||
      getVorgangStatusSnapshot(vorgang).currentStatus === "erledigt";

    if (isErledigt) {
      erledigt += 1;
      continue;
    }

    const { currentStatus, history } = getVorgangStatusSnapshot(vorgang);
    const wasPrepared = history.some(
      (entry) => entry.label === "Von HELPY vorbereitet"
    );

    if (wasPrepared) {
      vorbereitet += 1;
    }
    if (
      currentStatus === "in-pruefung" ||
      currentStatus === "wartet-auf-rueckmeldung"
    ) {
      wartenAufPruefung += 1;
    }
    if (currentStatus === "bestaetigt") {
      bestaetigt += 1;
    }
  }

  return {
    vorbereitet,
    wartenAufPruefung,
    bestaetigt,
    erledigt,
    introMessage: STATUS_PANEL_MESSAGE,
  };
}

function seedGmailVorgangStatuses(vorgaenge: Vorgang[]): void {
  for (const vorgang of vorgaenge) {
    if (seededVorgaenge.has(vorgang.id)) continue;

    const snapshot = buildDefaultHistory(vorgang.id, vorgang.receivedAt ?? MOCK_REFERENCE_ISO, [
      vorgang.helpyEmpfehlung,
    ]);

    snapshots.set(vorgang.id, {
      ...snapshot,
      currentStatus: "von-helpy-vorbereitet",
    });
    seededVorgaenge.add(vorgang.id);
  }
}

export function initGmailVorgangStatuses(vorgaenge: Vorgang[]): void {
  const seededBefore = seededVorgaenge.size;
  seedGmailVorgangStatuses(vorgaenge);
  if (seededVorgaenge.size > seededBefore) {
    notify();
  }
}

/** Default-Status setzen ohne Listener — sicher während Render/Import. */
export function seedGmailVorgangStatusesSilent(vorgaenge: Vorgang[]): void {
  seedGmailVorgangStatuses(vorgaenge);
}

export function initStatusForVorgaenge(vorgaenge: Vorgang[]): void {
  vorgaenge.forEach((vorgang, index) => {
    if (seededVorgaenge.has(vorgang.id)) return;

    snapshots.set(vorgang.id, buildSnapshotForVorgang(vorgang, index));
    seededVorgaenge.add(vorgang.id);
  });
}

export function resetStatusStore(): void {
  snapshots.clear();
  seededVorgaenge.clear();
  notify();
}
