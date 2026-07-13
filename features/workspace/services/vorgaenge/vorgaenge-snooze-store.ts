import {
  readPersistentJson,
  writePersistentJson,
} from "@/lib/store/persistent-client-storage";

const STORAGE_KEY = "helpy-snoozed-vorgaenge-v1";
const STORAGE_OPTIONS = {
  storageKey: STORAGE_KEY,
  legacySessionKey: STORAGE_KEY,
} as const;

export type SnoozeDuration = "1h" | "1d";

type SnoozeRecord = {
  vorgangId: string;
  until: string;
  snoozedAt: string;
};

const snoozedById = new Map<string, SnoozeRecord>();
const listeners = new Set<() => void>();
let hydrated = false;

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  const parsed = readPersistentJson<SnoozeRecord[]>(STORAGE_OPTIONS);
  if (!parsed) return;

  snoozedById.clear();
  const now = Date.now();
  for (const entry of parsed) {
    if (Date.parse(entry.until) > now) {
      snoozedById.set(entry.vorgangId, entry);
    }
  }
}

function persist(): void {
  writePersistentJson(
    STORAGE_OPTIONS,
    [...snoozedById.values()].filter(
      (entry) => Date.parse(entry.until) > Date.now()
    )
  );
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function durationToMs(duration: SnoozeDuration): number {
  return duration === "1h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
}

export function subscribeSnoozedVorgaenge(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isVorgangSnoozed(vorgangId: string): boolean {
  hydrate();
  const record = snoozedById.get(vorgangId);
  if (!record) return false;
  if (Date.parse(record.until) <= Date.now()) {
    snoozedById.delete(vorgangId);
    persist();
    return false;
  }
  return true;
}

export function snoozeVorgang(
  vorgangId: string,
  duration: SnoozeDuration = "1h"
): void {
  hydrate();
  const now = new Date();
  const until = new Date(now.getTime() + durationToMs(duration));
  snoozedById.set(vorgangId, {
    vorgangId,
    until: until.toISOString(),
    snoozedAt: now.toISOString(),
  });
  persist();
  notify();
}

export function clearSnooze(vorgangId: string): void {
  hydrate();
  if (!snoozedById.delete(vorgangId)) return;
  persist();
  notify();
}

export function filterNotSnoozed<T extends { id: string }>(vorgaenge: T[]): T[] {
  hydrate();
  if (snoozedById.size === 0) return vorgaenge;
  const now = Date.now();
  return vorgaenge.filter((item) => {
    const record = snoozedById.get(item.id);
    if (!record) return true;
    return Date.parse(record.until) <= now;
  });
}
