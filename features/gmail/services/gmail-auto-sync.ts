import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

export type GmailAutoSyncStatus = "idle" | "syncing" | "synced";

export type GmailAutoSyncState = {
  status: GmailAutoSyncStatus;
  lastSyncedAt: number | null;
  lastNewCount: number;
  panelMessage: string | null;
  tokenMissing: boolean;
};

const statusListeners = new Set<() => void>();
const panelListeners = new Set<() => void>();

let state: GmailAutoSyncState = {
  status: "idle",
  lastSyncedAt: null,
  lastNewCount: 0,
  panelMessage: null,
  tokenMissing: false,
};

const GMAIL_AUTO_SYNC_SERVER_SNAPSHOT: GmailAutoSyncState = {
  status: "idle",
  lastSyncedAt: null,
  lastNewCount: 0,
  panelMessage: null,
  tokenMissing: false,
};

function notifyStatus(): void {
  statusListeners.forEach((listener) => listener());
}

function notifyPanel(): void {
  panelListeners.forEach((listener) => listener());
}

export function subscribeGmailAutoSync(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

export function subscribeGmailAutoSyncPanel(listener: () => void): () => void {
  panelListeners.add(listener);
  return () => panelListeners.delete(listener);
}

export function getGmailAutoSyncState(): GmailAutoSyncState {
  return state;
}

export function getGmailAutoSyncServerSnapshot(): GmailAutoSyncState {
  return GMAIL_AUTO_SYNC_SERVER_SNAPSHOT;
}

export function markGmailAutoSyncStart(): void {
  state = {
    ...state,
    status: "syncing",
    tokenMissing: false,
  };
  notifyStatus();
}

export function markGmailAutoSyncComplete(result: {
  newCount: number;
  newVorgaenge?: Vorgang[];
}): void {
  const nextPanelMessage =
    result.newCount > 0
      ? buildAutoSyncPanelMessage(result.newCount, result.newVorgaenge ?? [])
      : state.panelMessage;
  const panelChanged = nextPanelMessage !== state.panelMessage;

  state = {
    status: "synced",
    lastSyncedAt: Date.now(),
    lastNewCount: result.newCount,
    panelMessage: nextPanelMessage,
    tokenMissing: false,
  };

  notifyStatus();
  if (panelChanged) {
    notifyPanel();
  }
}

export function markGmailAutoSyncError(): void {
  state = {
    ...state,
    status: "synced",
    lastSyncedAt: Date.now(),
    tokenMissing: false,
  };
  notifyStatus();
}

export function markGmailAutoSyncTokenMissing(): void {
  state = {
    ...state,
    status: "synced",
    tokenMissing: true,
  };
  notifyStatus();
}

function isCustomerInquiry(vorgang: Vorgang): boolean {
  if (shouldPrepareArchive(vorgang)) return false;

  const haystack = [vorgang.intent, vorgang.intentLabel, vorgang.typ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return [
    "neue anfrage",
    "neuer_kunde",
    "neuer kunde",
    "interessent",
    "immobilien",
    "angebotsanfrage",
    "besichtigung",
    "terminwunsch",
    "rueckruf",
    "rückruf",
    "mandat",
    "frist",
  ].some((key) => haystack.includes(key));
}

export function buildAutoSyncPanelMessage(
  newCount: number,
  newVorgaenge: Vorgang[]
): string {
  const serviceItems = newVorgaenge.filter((item) => !shouldPrepareArchive(item));
  const customerInquiries = serviceItems.filter(isCustomerInquiry);

  if (customerInquiries.length === 1 && newCount === 1) {
    return "Ich habe eine neue Kundenanfrage gefunden.";
  }

  if (newCount === 1) {
    return "Ich habe 1 neue Nachricht analysiert.";
  }

  return `Ich habe ${newCount} neue Nachrichten analysiert.`;
}

export function formatGmailSyncStatusLabel(
  syncState: GmailAutoSyncState,
  now = Date.now()
): string {
  if (syncState.status === "syncing") {
    return "Synchronisiere...";
  }

  if (syncState.tokenMissing) {
    return "Gmail Verbindung prüfen";
  }

  if (syncState.lastSyncedAt) {
    const secondsSinceSync = Math.max(
      0,
      Math.floor((now - syncState.lastSyncedAt) / 1000)
    );

    if (syncState.lastNewCount > 0 && secondsSinceSync < 15) {
      return syncState.lastNewCount === 1
        ? "Neue Nachricht gefunden"
        : `${syncState.lastNewCount} neue Nachrichten gefunden`;
    }

    if (secondsSinceSync < 10) {
      return "Zuletzt synchronisiert";
    }

    if (secondsSinceSync < 60) {
      return `Zuletzt synchronisiert vor ${secondsSinceSync} Sekunden`;
    }

    const minutes = Math.floor(secondsSinceSync / 60);
    if (minutes === 1) {
      return "Zuletzt synchronisiert vor 1 Minute";
    }

    return `Zuletzt synchronisiert vor ${minutes} Minuten`;
  }

  return "Gmail Verbindung prüfen";
}
