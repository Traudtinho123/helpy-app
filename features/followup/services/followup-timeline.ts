import type { FollowUpTimelineEntry } from "@/features/followup/types/followup-types";

const STORAGE_KEY = "helpy-followup-timeline-v1";

let entries: FollowUpTimelineEntry[] = [];
let hydrated = false;

function hydrate(): void {
  if (typeof window === "undefined" || hydrated) return;
  hydrated = true;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      entries = JSON.parse(raw) as FollowUpTimelineEntry[];
    }
  } catch {
    entries = [];
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function appendEntry(entry: FollowUpTimelineEntry): void {
  hydrate();
  entries = [entry, ...entries].slice(0, 50);
  persist();
}

export function recordFollowUpStarted(input: {
  followUpId: string;
  vorgangId: string;
  customerName: string;
}): void {
  appendEntry({
    id: `${input.followUpId}-started`,
    followUpId: input.followUpId,
    vorgangId: input.vorgangId,
    at: new Date().toISOString(),
    label: "Warten auf Antwort",
    detail: `Nachricht an ${input.customerName} versendet — HELPY überwacht die Rückmeldung.`,
  });
}

export function recordFollowUpStepRecommended(input: {
  followUpId: string;
  vorgangId: string;
  recommendation: string;
  preparedActionLabel: string | null;
}): void {
  appendEntry({
    id: `${input.followUpId}-step-${Date.now()}`,
    followUpId: input.followUpId,
    vorgangId: input.vorgangId,
    at: new Date().toISOString(),
    label: "Empfohlene Aktion",
    detail: input.preparedActionLabel
      ? `${input.recommendation} · ${input.preparedActionLabel}`
      : input.recommendation,
  });
}

export function recordFollowUpClosed(input: {
  followUpId: string;
  vorgangId: string;
}): void {
  appendEntry({
    id: `${input.followUpId}-closed`,
    followUpId: input.followUpId,
    vorgangId: input.vorgangId,
    at: new Date().toISOString(),
    label: "Follow-up abgeschlossen",
    detail: "Du hast den Vorgang zur Prüfung abgeschlossen. Nichts wurde automatisch ausgeführt.",
  });
}

export function getFollowUpTimelineForVorgang(
  vorgangId: string
): FollowUpTimelineEntry[] {
  hydrate();
  return entries
    .filter((entry) => entry.vorgangId === vorgangId)
    .map((entry) => ({ ...entry }));
}
