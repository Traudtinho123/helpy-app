import { getDocumentsForObject } from "@/features/documents/services/document-engine";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import {
  getRealEstateObjectById,
  upsertRealEstateObject,
} from "@/features/real-estate/object/object-memory";

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/** Verknüpft Dokument-ID mit Objekt — ohne Duplikate. */
export function appendDocumentIdToObject(
  objectId: string,
  documentId: string,
  options?: { notifySubscribers?: boolean }
): RealEstateObject | null {
  const object = getRealEstateObjectById(objectId);
  if (!object || object.dokumentIds.includes(documentId)) {
    return object;
  }

  const saved = upsertRealEstateObject(
    {
      ...object,
      dokumentIds: uniqueStrings([...object.dokumentIds, documentId]),
      updatedAt: new Date().toISOString(),
    },
    { notifySubscribers: options?.notifySubscribers }
  );
  return saved;
}

/** Synchronisiert dokumentIds aus dem Dokument-Store — reine Peek/Sync, kein notify. */
export function syncObjectDocumentIds(objectId: string): RealEstateObject | null {
  const object = getRealEstateObjectById(objectId);
  if (!object) return null;

  const fromDocuments = getDocumentsForObject(objectId).map((doc) => doc.id);
  const merged = uniqueStrings([...object.dokumentIds, ...fromDocuments]).sort();
  const current = [...object.dokumentIds].sort();

  if (merged.join(",") === current.join(",")) {
    return object;
  }

  const saved = upsertRealEstateObject({
    ...object,
    dokumentIds: merged,
    updatedAt: new Date().toISOString(),
  });
  return saved;
}
