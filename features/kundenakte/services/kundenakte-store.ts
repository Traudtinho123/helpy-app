import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";

const STORAGE_KEY = "helpy-kundenakte-v1";

const listeners = new Set<() => void>();

let records: Kundenakte[] = [];
let sessionHydrated = false;

export const EMPTY_KUNDENAKTE: Kundenakte | null = null;

const vorgangSnapshots = new Map<string, Kundenakte | null>();

function kundenakteEquals(a: Kundenakte, b: Kundenakte): boolean {
  return (
    a.id === b.id &&
    a.vorgangId === b.vorgangId &&
    a.status === b.status &&
    a.statusLabel === b.statusLabel &&
    a.name === b.name &&
    a.firma === b.firma &&
    a.email === b.email &&
    a.telefon === b.telefon &&
    a.adresse === b.adresse &&
    a.isKnownCustomer === b.isKnownCustomer &&
    a.helpyHint === b.helpyHint &&
    a.betreff === b.betreff &&
    a.zusammenfassung === b.zusammenfassung
  );
}

function syncVorgangSnapshot(vorgangId: string): void {
  const match = records.find((record) => record.vorgangId === vorgangId) ?? null;
  const cached = vorgangSnapshots.get(vorgangId);

  if (!match) {
    if (cached !== EMPTY_KUNDENAKTE) {
      vorgangSnapshots.set(vorgangId, EMPTY_KUNDENAKTE);
    }
    return;
  }

  if (cached && kundenakteEquals(cached, match)) {
    return;
  }

  vorgangSnapshots.set(vorgangId, { ...match });
}

let confirmedSnapshot: Kundenakte[] = [];
const CONFIRMED_KUNDENAKTE_SERVER_SNAPSHOT: Kundenakte[] = [];

function recomputeSnapshots(): void {
  confirmedSnapshot = records
    .filter((record) => record.status === "bestaetigt")
    .map((record) => ({ ...record }));

  for (const record of records) {
    syncVorgangSnapshot(record.vorgangId);
  }
}

function notify(): void {
  recomputeSnapshots();
  listeners.forEach((listener) => listener());
}

function hydrateFromSession(): void {
  if (typeof window === "undefined" || sessionHydrated) return;
  sessionHydrated = true;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      records = JSON.parse(raw) as Kundenakte[];
    }
  } catch {
    records = [];
  }

  recomputeSnapshots();
}

function persistToSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function subscribeKundenakte(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAllKundenakten(): Kundenakte[] {
  hydrateFromSession();
  return records.map((record) => ({ ...record }));
}

export function getConfirmedKundenaktenSnapshot(): Kundenakte[] {
  hydrateFromSession();
  return confirmedSnapshot;
}

export function getConfirmedKundenaktenServerSnapshot(): Kundenakte[] {
  return CONFIRMED_KUNDENAKTE_SERVER_SNAPSHOT;
}

export function getConfirmedKundenakten(): Kundenakte[] {
  hydrateFromSession();
  const seen = new Set<string>();
  const result: Kundenakte[] = [];

  for (const record of confirmedSnapshot) {
    const key = record.email.trim().toLowerCase() || record.id;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...record });
  }

  return result;
}

export function peekKundenakteByVorgangId(vorgangId: string): Kundenakte | null {
  hydrateFromSession();
  return records.find((record) => record.vorgangId === vorgangId) ?? null;
}

export function getKundenakteSnapshot(vorgangId: string): Kundenakte | null {
  hydrateFromSession();
  return vorgangSnapshots.get(vorgangId) ?? EMPTY_KUNDENAKTE;
}

export function getKundenakteServerSnapshot(): Kundenakte | null {
  return EMPTY_KUNDENAKTE;
}

export function upsertKundenakte(record: Kundenakte): void {
  hydrateFromSession();

  const index = records.findIndex((item) => item.vorgangId === record.vorgangId);
  if (index >= 0) {
    if (kundenakteEquals(records[index], record)) {
      return;
    }
    records[index] = record;
  } else {
    records = [record, ...records];
  }

  persistToSession();
  notify();
}

export function clearKundenakteStore(): void {
  records = [];
  sessionHydrated = false;
  vorgangSnapshots.clear();
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
  notify();
}
