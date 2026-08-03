"use client";

import { invalidateVorgaengeSummaryCaches } from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import { syncVoiceAppointmentFromDbRecord } from "@/features/voice/services/voice-db-appointment-sync";
import type { VorgangDbRecord } from "@/features/vorgaenge/types/create-vorgang-types";
import { seedPersistedMailMessageIdsFromListe } from "@/features/vorgaenge/services/mail-vorgang-persist-dedup";
import {
  deduplicateVorgaenge,
  sortDeduplicatedVorgaenge,
} from "@/features/workspace/services/vorgaenge/vorgang-deduplication";
import { applyCompletedDisplayState } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import { initStatusForVorgaenge } from "@/features/workspace/services/status";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";
import { readPersistentJson, writePersistentJson } from "@/lib/store/persistent-client-storage";

const STORAGE_KEY = "helpy-db-vorgaenge";
const DB_LIST_PAGE_SIZE = 50;

const storageOptions = {
  storageKey: STORAGE_KEY,
} as const;

type DbVorgaengeCache = {
  vorgaenge: ListeVorgang[];
  workspaces: Record<string, WorkspaceVorgang>;
  loadedAt: string;
};

type DbVorgangApiItem = {
  liste: ListeVorgang;
  workspace: WorkspaceVorgang;
  record?: VorgangDbRecord;
};

const listeners = new Set<() => void>();
let cache: DbVorgaengeCache | null = null;

function notify(): void {
  invalidateVorgaengeSummaryCaches();
  listeners.forEach((listener) => listener());
}

function hydrateFromStorage(): void {
  if (typeof window === "undefined" || cache) return;
  const parsed = readPersistentJson<DbVorgaengeCache>(storageOptions);
  if (!parsed) return;
  const { vorgaenge } = deduplicateVorgaenge(parsed.vorgaenge);
  cache = { ...parsed, vorgaenge };
  initStatusForVorgaenge(vorgaenge);
  seedPersistedMailMessageIdsFromListe(vorgaenge);
}

function persist(): void {
  if (typeof window === "undefined" || !cache) return;
  writePersistentJson(storageOptions, cache);
}

function ensureCache(): DbVorgaengeCache {
  hydrateFromStorage();
  if (!cache) {
    cache = {
      vorgaenge: [],
      workspaces: {},
      loadedAt: new Date().toISOString(),
    };
  }
  return cache;
}

function upsertDbVorgangItems(items: DbVorgangApiItem[]): void {
  if (items.length === 0) return;

  const store = ensureCache();
  const byId = new Map(store.vorgaenge.map((entry) => [entry.id, entry]));

  for (const item of items) {
    byId.set(item.liste.id, item.liste);
    store.workspaces[item.liste.id] = item.workspace;
  }

  store.vorgaenge = sortDeduplicatedVorgaenge([...byId.values()]);
  store.loadedAt = new Date().toISOString();
  seedPersistedMailMessageIdsFromListe(items.map((item) => item.liste));
}

export function subscribeDbVorgaenge(listener: () => void): () => void {
  ensureCache();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDbVorgaenge(): ListeVorgang[] {
  const { vorgaenge } = deduplicateVorgaenge(ensureCache().vorgaenge);
  return sortDeduplicatedVorgaenge(
    vorgaenge.map((item) => applyCompletedDisplayState(item))
  );
}

export function getDbListeVorgang(id: string): ListeVorgang | null {
  return getDbVorgaenge().find((item) => item.id === id) ?? null;
}

export function getDbWorkspaceVorgang(id: string): WorkspaceVorgang | null {
  ensureCache();
  return cache?.workspaces[id] ?? null;
}

export function patchDbVorgangInCache(
  vorgangId: string,
  patch: Partial<ListeVorgang>
): boolean {
  const store = ensureCache();
  let changed = false;

  store.vorgaenge = store.vorgaenge.map((item) => {
    if (item.id !== vorgangId) return item;
    changed = true;
    return { ...item, ...patch };
  });

  if (!changed) return false;

  const workspace = store.workspaces[vorgangId];
  if (workspace && patch.titel) {
    store.workspaces[vorgangId] = {
      ...workspace,
      aufgabe: { ...workspace.aufgabe, titel: patch.titel },
    };
  }

  store.loadedAt = new Date().toISOString();
  persist();
  notify();
  return true;
}

export function removeDbVorgangFromCache(vorgangId: string): boolean {
  const store = ensureCache();
  const next = store.vorgaenge.filter((item) => item.id !== vorgangId);
  if (next.length === store.vorgaenge.length) return false;

  store.vorgaenge = next;
  delete store.workspaces[vorgangId];
  store.loadedAt = new Date().toISOString();
  persist();
  notify();
  return true;
}

export function ingestDbVorgangBundle(input: {
  liste: ListeVorgang;
  workspace: WorkspaceVorgang;
}): void {
  upsertDbVorgangItems([input]);
  persist();
  initStatusForVorgaenge([input.liste]);
  notify();
}

async function fetchDbVorgaengePage(cursor: string | null): Promise<{
  items: DbVorgangApiItem[];
  nextCursor: string | null;
}> {
  const query = new URLSearchParams({
    view: "list",
    limit: String(DB_LIST_PAGE_SIZE),
  });
  if (cursor) {
    query.set("cursor", cursor);
  }

  const response = await fetch(`/api/vorgaenge?${query.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    return { items: [], nextCursor: null };
  }

  const payload = (await response.json()) as {
    vorgaenge?: DbVorgangApiItem[];
    nextCursor?: string | null;
  };

  return {
    items: payload.vorgaenge ?? [],
    nextCursor: payload.nextCursor ?? null,
  };
}

export async function loadDbVorgaengeFromApi(): Promise<number> {
  let cursor: string | null = null;
  let total = 0;
  let firstPage = true;

  do {
    const { items, nextCursor } = await fetchDbVorgaengePage(cursor);
    if (items.length === 0) break;

    upsertDbVorgangItems(items);

    for (const item of items) {
      if (item.record) {
        void syncVoiceAppointmentFromDbRecord(item.record);
      }
    }

    total += items.length;
    cursor = nextCursor;

    if (firstPage) {
      initStatusForVorgaenge(ensureCache().vorgaenge);
      persist();
      notify();
      firstPage = false;
    }
  } while (cursor);

  if (!firstPage) {
    initStatusForVorgaenge(ensureCache().vorgaenge);
    persist();
    notify();
  }

  return total;
}
