import type { ObjectDossier } from "@/features/real-estate/dossier/object-dossier-types";
import {
  readPersistentJson,
  writePersistentJson,
} from "@/lib/store/persistent-client-storage";

const STORAGE_KEY = "helpy-object-dossiers-v1";
const STORAGE_OPTIONS = {
  storageKey: STORAGE_KEY,
  legacySessionKey: STORAGE_KEY,
} as const;

const dossiers = new Map<string, ObjectDossier>();
const listeners = new Set<() => void>();
let hydrated = false;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  const parsed = readPersistentJson<ObjectDossier[]>(STORAGE_OPTIONS);
  if (!parsed) return;

  dossiers.clear();
  for (const dossier of parsed) {
    dossiers.set(dossier.objectId, dossier);
  }
}

function persist(): void {
  writePersistentJson(STORAGE_OPTIONS, [...dossiers.values()]);
}

export function subscribeObjectDossiers(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getObjectDossier(objectId: string): ObjectDossier | null {
  hydrate();
  const dossier = dossiers.get(objectId);
  return dossier ? { ...dossier } : null;
}

export function hasFinalObjectDossier(objectId: string): boolean {
  const dossier = getObjectDossier(objectId);
  return dossier?.status === "final";
}

export function upsertObjectDossier(
  objectId: string,
  patch: Partial<ObjectDossier>
): ObjectDossier {
  hydrate();
  const now = new Date().toISOString();
  const existing = dossiers.get(objectId);

  const next: ObjectDossier = {
    ...(existing ?? {
      objectId,
      status: "draft",
      updatedAt: now,
      titel: "",
      adresse: "",
      plz: "",
      ort: "",
      land: "Schweiz",
      objectType: "Wohnung",
      transaktion: "—",
      preisLabel: "—",
      eckdaten: [],
      description: "",
      descriptionAiGenerated: false,
      highlights: [],
      highlightsAiGenerated: false,
      contactBlock: "",
      nextStepActions: [],
      contactAiGenerated: false,
    }),
    ...patch,
    objectId,
    updatedAt: now,
  };

  dossiers.set(objectId, next);
  persist();
  notify();
  return { ...next };
}

export function confirmObjectDossier(objectId: string): ObjectDossier | null {
  const dossier = getObjectDossier(objectId);
  if (!dossier) return null;

  return upsertObjectDossier(objectId, {
    status: "final",
    confirmedAt: new Date().toISOString(),
  });
}

export function deleteObjectDossier(objectId: string): void {
  hydrate();
  if (!dossiers.delete(objectId)) return;
  persist();
  notify();
}

/** Nur für Tests — leert den In-Memory-Store und localStorage. */
export function clearObjectDossierStoreForTests(): void {
  dossiers.clear();
  hydrated = true;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
  notify();
}
