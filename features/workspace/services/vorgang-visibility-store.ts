import {
  readPersistentJson,
  writePersistentJson,
} from "@/lib/store/persistent-client-storage";

const STORAGE_KEY = "helpy-hidden-vorgaenge-v1";
const STORAGE_OPTIONS = {
  storageKey: STORAGE_KEY,
  legacySessionKey: STORAGE_KEY,
} as const;

type HiddenVorgangRecord = {
  vorgangId: string;
  hiddenAt: string;
};

const hiddenById = new Map<string, string>();
const listeners = new Set<() => void>();
let hydrated = false;

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  const parsed = readPersistentJson<HiddenVorgangRecord[]>(STORAGE_OPTIONS);
  if (!parsed) return;

  hiddenById.clear();
  for (const entry of parsed) {
    hiddenById.set(entry.vorgangId, entry.hiddenAt);
  }
}

function persist(): void {
  writePersistentJson(
    STORAGE_OPTIONS,
    [...hiddenById.entries()].map(([vorgangId, hiddenAt]) => ({
      vorgangId,
      hiddenAt,
    }))
  );
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeHiddenVorgaenge(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isVorgangHidden(vorgangId: string): boolean {
  hydrate();
  return hiddenById.has(vorgangId);
}

export function getVorgangHiddenAt(vorgangId: string): string | null {
  hydrate();
  return hiddenById.get(vorgangId) ?? null;
}

export function hideVorgang(vorgangId: string): void {
  hydrate();
  hiddenById.set(vorgangId, new Date().toISOString());
  persist();
  notify();
}

export function restoreVorgang(vorgangId: string): void {
  hydrate();
  if (!hiddenById.delete(vorgangId)) return;
  persist();
  notify();
}

export function filterVisibleVorgaenge<T extends { id: string }>(vorgaenge: T[]): T[] {
  hydrate();
  if (hiddenById.size === 0) return vorgaenge;
  return vorgaenge.filter((item) => !hiddenById.has(item.id));
}
