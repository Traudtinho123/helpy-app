import type { KundenakteTimelineEntry } from "@/features/kundenakte/types/kundenakte-types";

const STORAGE_KEY = "helpy-kundenakte-timeline-v1";

let entries: KundenakteTimelineEntry[] = [];
let hydrated = false;

function hydrate(): void {
  if (typeof window === "undefined" || hydrated) return;
  hydrated = true;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      entries = JSON.parse(raw) as KundenakteTimelineEntry[];
    }
  } catch {
    entries = [];
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function appendEntry(entry: KundenakteTimelineEntry): void {
  hydrate();
  entries = [entry, ...entries].slice(0, 100);
  persist();
}

export function recordKundenaktePrepared(input: {
  kundenakteId: string;
  vorgangId: string;
  customerName: string;
}): void {
  appendEntry({
    id: `${input.kundenakteId}-prepared`,
    kundenakteId: input.kundenakteId,
    vorgangId: input.vorgangId,
    at: new Date().toISOString(),
    label: "Kundenakte vorbereitet",
    detail: `Kundenakte für ${input.customerName} vorbereitet — bitte prüfen.`,
  });
}

export function recordKundenakteConfirmed(input: {
  kundenakteId: string;
  vorgangId: string;
}): void {
  appendEntry({
    id: `${input.kundenakteId}-confirmed`,
    kundenakteId: input.kundenakteId,
    vorgangId: input.vorgangId,
    at: new Date().toISOString(),
    label: "Kundenakte bestätigt",
    detail: "Kundenakte wurde bestätigt.",
  });
}

export function getKundenakteTimelineForVorgang(
  vorgangId: string
): KundenakteTimelineEntry[] {
  hydrate();
  return entries
    .filter((entry) => entry.vorgangId === vorgangId)
    .map((entry) => ({ ...entry }));
}
