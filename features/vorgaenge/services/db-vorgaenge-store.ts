"use client";

import { invalidateVorgaengeSummaryCaches } from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import { syncVoiceAppointmentFromDbRecord } from "@/features/voice/services/voice-db-appointment-sync";
import type { VorgangDbRecord } from "@/features/vorgaenge/types/create-vorgang-types";
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

const storageOptions = {
  storageKey: STORAGE_KEY,
} as const;

type DbVorgaengeCache = {
  vorgaenge: ListeVorgang[];
  workspaces: Record<string, WorkspaceVorgang>;
  loadedAt: string;
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

export function ingestDbVorgangBundle(input: {
  liste: ListeVorgang;
  workspace: WorkspaceVorgang;
}): void {
  const store = ensureCache();
  store.vorgaenge = [
    input.liste,
    ...store.vorgaenge.filter((item) => item.id !== input.liste.id),
  ];
  store.workspaces[input.liste.id] = input.workspace;
  store.loadedAt = new Date().toISOString();
  persist();
  initStatusForVorgaenge([input.liste]);
  notify();
}

export async function loadDbVorgaengeFromApi(): Promise<number> {
  const response = await fetch("/api/vorgaenge", { cache: "no-store" });
  if (!response.ok) return 0;

  const payload = (await response.json()) as {
    vorgaenge?: Array<{
      liste: ListeVorgang;
      workspace: WorkspaceVorgang;
      record?: VorgangDbRecord;
    }>;
  };

  const items = payload.vorgaenge ?? [];
  if (items.length === 0) return 0;

  const store = ensureCache();
  for (const item of items) {
    store.vorgaenge = [
      item.liste,
      ...store.vorgaenge.filter((entry) => entry.id !== item.liste.id),
    ];
    store.workspaces[item.liste.id] = item.workspace;

    const record = item.record;
    if (record) {
      void syncVoiceAppointmentFromDbRecord(record);
    }
  }

  store.loadedAt = new Date().toISOString();
  persist();
  initStatusForVorgaenge(store.vorgaenge);
  notify();
  return items.length;
}
