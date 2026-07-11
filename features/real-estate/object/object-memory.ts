import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import { getMockObjectImages } from "@/features/real-estate/object/mock-object-images";
import { sortObjectImages } from "@/features/real-estate/object/object-image-utils";
import {
  readPersistentJson,
  removePersistentJson,
  writePersistentJson,
} from "@/lib/store/persistent-client-storage";

const STORAGE_KEY = "helpy-real-estate-objects-v1";
const STORAGE_OPTIONS = {
  storageKey: STORAGE_KEY,
  legacySessionKey: STORAGE_KEY,
} as const;

const objects = new Map<string, RealEstateObject>();
const vorgangIndex = new Map<string, string>();
const listeners = new Set<() => void>();
let hydrated = false;

function normalizeObject(object: RealEstateObject): RealEstateObject {
  const storedImages = object.images ?? [];
  const mockImages = getMockObjectImages(object.objectId);

  if (storedImages.length > 0) {
    return { ...object, images: sortObjectImages(storedImages) };
  }

  if (mockImages.length > 0) {
    return { ...object, images: sortObjectImages(mockImages) };
  }

  return { ...object, images: [] };
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function rebuildVorgangIndex(): void {
  vorgangIndex.clear();
  for (const object of objects.values()) {
    for (const vorgangId of object.vorgangIds) {
      vorgangIndex.set(vorgangId, object.objectId);
    }
  }
}

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  const parsed = readPersistentJson<RealEstateObject[]>(STORAGE_OPTIONS);
  if (!parsed) {
    return;
  }

  objects.clear();
  for (const object of parsed) {
    objects.set(object.objectId, normalizeObject(object));
  }
  rebuildVorgangIndex();
}

function persist(): void {
  writePersistentJson(STORAGE_OPTIONS, [...objects.values()]);
}

export function subscribeRealEstateObjects(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAllRealEstateObjects(): RealEstateObject[] {
  hydrate();
  return [...objects.values()].map((object) => normalizeObject({ ...object }));
}

export function getRealEstateObjectById(
  objectId: string
): RealEstateObject | null {
  hydrate();
  const object = objects.get(objectId);
  return object ? normalizeObject({ ...object }) : null;
}

/** Liefert einen stabilen Fingerprint ohne neues Objekt zu erzeugen. */
export function getRealEstateObjectStoreFingerprint(
  objectId: string
): string | null {
  hydrate();
  const object = objects.get(objectId);
  if (!object) return null;

  return [
    object.objectId,
    object.updatedAt,
    object.status,
    object.besichtigungIds.join(","),
    String(object.dokumentIds.length),
    String(object.interessentLinks.length),
    object.vorgangIds.join(","),
    String(object.images?.length ?? 0),
    object.images?.find((image) => image.isCover)?.id ?? "",
  ].join("::");
}

export function peekRealEstateObjectByVorgangId(
  vorgangId: string
): RealEstateObject | null {
  hydrate();
  const objectId = vorgangIndex.get(vorgangId);
  if (!objectId) return null;
  return getRealEstateObjectById(objectId);
}

export function buildObjectDedupeKey(input: {
  objektLink: string | null;
  adresse: string | null;
  titel: string | null;
  quelle: string;
}): string {
  if (input.objektLink) {
    return `link:${input.objektLink.trim().toLowerCase()}`;
  }

  const adresse = input.adresse?.trim().toLowerCase() ?? "";
  const titel = input.titel?.trim().toLowerCase() ?? "";
  return `addr:${input.quelle}:${adresse}:${titel}`;
}

export function findExistingRealEstateObject(input: {
  objektLink: string | null;
  adresse: string | null;
  titel: string | null;
  quelle: string;
}): RealEstateObject | null {
  hydrate();
  const key = buildObjectDedupeKey(input);

  for (const object of objects.values()) {
    const objectKey = buildObjectDedupeKey({
      objektLink: object.objektLink,
      adresse: object.adresse,
      titel: object.titel,
      quelle: object.quelle,
    });
    if (objectKey === key) {
      return { ...object };
    }
  }

  return null;
}

type UpsertRealEstateObjectOptions = {
  /** Default true. Set false when seeding during render (avoids subscriber setState). */
  notifySubscribers?: boolean;
};

export function upsertRealEstateObject(
  object: RealEstateObject,
  options?: UpsertRealEstateObjectOptions
): RealEstateObject {
  hydrate();
  const normalized = normalizeObject(object);
  objects.set(normalized.objectId, normalized);
  rebuildVorgangIndex();
  persist();
  if (options?.notifySubscribers !== false) {
    notify();
  }
  return { ...normalized };
}

export function clearRealEstateObjectStore(): void {
  objects.clear();
  vorgangIndex.clear();
  hydrated = false;
  removePersistentJson(STORAGE_OPTIONS);
  notify();
}

/** Nur für Tests: simuliert Reload/Login ohne localStorage zu leeren. */
export function simulateRealEstateObjectStoreReloadForTests(): void {
  hydrated = false;
  objects.clear();
  vorgangIndex.clear();
  hydrate();
}
