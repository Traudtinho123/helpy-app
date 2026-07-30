import {
  getRealEstateObjectById,
  upsertRealEstateObject,
} from "@/features/real-estate/object/object-memory";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import {
  createObjectImageId,
  getCoverImageUrl,
  getCoverObjectImage,
  isImageAttachment,
  sortObjectImages,
} from "@/features/real-estate/object/object-image-utils";
import type {
  ObjectImage,
  ObjectImageSource,
  ObjectImageStatus,
} from "@/features/real-estate/object/object-image-types";

export {
  buildObjectImagePlaceholderDataUrl,
  getCoverImageUrl,
  getCoverObjectImage,
  isImageAttachment,
  sortObjectImages,
} from "@/features/real-estate/object/object-image-utils";

export {
  IMAGE_ATTACHMENT_EXTENSIONS,
  IMAGE_ATTACHMENT_MIME_TYPES,
  OBJECT_IMAGE_SOURCE_LABELS,
  OBJECT_IMAGE_STATUS_LABELS,
  type ObjectImage,
  type ObjectImageSource,
  type ObjectImageStatus,
} from "@/features/real-estate/object/object-image-types";

function normalizeImages(images: ObjectImage[] | undefined): ObjectImage[] {
  return images ?? [];
}

function resolveObject(objectId: string): RealEstateObject | null {
  return getRealEstateObjectById(objectId);
}

function persistImages(
  object: RealEstateObject,
  images: ObjectImage[]
): RealEstateObject {
  const sorted = sortObjectImages(images);
  const withCover = sorted.map((image, index) => ({
    ...image,
    isCover: index === 0 && image.status === "bestätigt",
    sortOrder: index,
  }));

  return upsertRealEstateObject({
    ...object,
    images: withCover,
    updatedAt: new Date().toISOString(),
  });
}

export function getObjectImages(objectId: string): ObjectImage[] {
  const object = resolveObject(objectId);
  if (!object) return [];
  return sortObjectImages(normalizeImages(object.images));
}

export function getConfirmedObjectImages(objectId: string): ObjectImage[] {
  return getObjectImages(objectId).filter((image) => image.status === "bestätigt");
}

function buildObjectImage(input: {
  objectId: string;
  url: string;
  fileName: string;
  source: ObjectImageSource;
  status?: ObjectImageStatus;
  isCover?: boolean;
  sortOrder?: number;
}): ObjectImage {
  return {
    id: createObjectImageId(input.objectId, input.fileName),
    objectId: input.objectId,
    url: input.url,
    fileName: input.fileName,
    source: input.source,
    isCover: input.isCover ?? false,
    sortOrder: input.sortOrder ?? 0,
    createdAt: new Date().toISOString(),
    status: input.status ?? "bestätigt",
  };
}

/**
 * Fügt manuelle Objektbilder hinzu.
 * `urls` optional — wenn gesetzt (z. B. nach Supabase-Upload), werden diese
 * statt Object-URLs verwendet.
 */
export function addManualObjectImages(
  objectId: string,
  files: File[],
  urls?: string[]
): ObjectImage[] {
  const object = resolveObject(objectId);
  if (!object || files.length === 0) return [];

  const existing = normalizeImages(object.images);
  const hasCover = existing.some(
    (image) => image.isCover && image.status === "bestätigt"
  );

  const added = files.map((file, index) =>
    buildObjectImage({
      objectId,
      url: urls?.[index]?.trim() || URL.createObjectURL(file),
      fileName: file.name,
      source: "manuell hochgeladen",
      status: "bestätigt",
      isCover: !hasCover && index === 0,
      sortOrder: existing.length + index,
    })
  );

  persistImages(object, [...existing, ...added]);
  return added;
}

/** Setzt das Cover-Bild (erstes = Cover) und sortiert neu. */
export function setObjectImageAsCover(
  objectId: string,
  imageId: string
): ObjectImage[] {
  const object = resolveObject(objectId);
  if (!object) return [];

  const existing = normalizeImages(object.images);
  const target = existing.find((image) => image.id === imageId);
  if (!target || target.status !== "bestätigt") return existing;

  const rest = existing.filter((image) => image.id !== imageId);
  const next = [{ ...target, isCover: true }, ...rest];
  persistImages(object, next);
  return getObjectImages(objectId);
}

/** Reihenfolge ändern — imageIds in gewünschter Reihenfolge. */
export function reorderObjectImages(
  objectId: string,
  imageIds: string[]
): ObjectImage[] {
  const object = resolveObject(objectId);
  if (!object) return [];

  const existing = normalizeImages(object.images);
  const byId = new Map(existing.map((image) => [image.id, image]));
  const ordered: ObjectImage[] = [];

  for (const id of imageIds) {
    const image = byId.get(id);
    if (image) {
      ordered.push(image);
      byId.delete(id);
    }
  }

  for (const image of existing) {
    if (byId.has(image.id)) ordered.push(image);
  }

  persistImages(object, ordered);
  return getObjectImages(objectId);
}

export function removeObjectImage(
  objectId: string,
  imageId: string
): ObjectImage[] {
  const object = resolveObject(objectId);
  if (!object) return [];

  const next = normalizeImages(object.images).filter(
    (image) => image.id !== imageId
  );
  persistImages(object, next);
  return getObjectImages(objectId);
}

export function confirmObjectImage(
  objectId: string,
  imageId: string
): ObjectImage | null {
  const object = resolveObject(objectId);
  if (!object) return null;

  let confirmed: ObjectImage | null = null;
  const next = normalizeImages(object.images).map((image) => {
    if (image.id !== imageId) return image;
    confirmed = { ...image, status: "bestätigt" as const };
    return confirmed;
  });

  if (!confirmed) return null;
  persistImages(object, next);
  return confirmed;
}

/** Gmail-Anhang als Objektbild vorschlagen — Nutzer muss bestätigen. */
export function suggestGmailAttachmentAsObjectImage(input: {
  objectId: string;
  vorgangId: string;
  fileName: string;
  url: string;
  mimeType?: string | null;
}): ObjectImage | null {
  if (!isImageAttachment(input.fileName, input.mimeType)) return null;

  const object = resolveObject(input.objectId);
  if (!object) return null;

  const existing = normalizeImages(object.images);
  const duplicate = existing.some(
    (image) =>
      image.fileName.toLowerCase() === input.fileName.toLowerCase() &&
      image.source === "Gmail Anhang"
  );
  if (duplicate) return null;

  const suggestion = buildObjectImage({
    objectId: input.objectId,
    url: input.url,
    fileName: input.fileName,
    source: "Gmail Anhang",
    status: "helpy-erkannt",
    isCover: false,
    sortOrder: existing.length,
  });

  persistImages(object, [...existing, suggestion]);
  return suggestion;
}

/**
 * Plattform-Import (ImmoScout24, Homegate, Newhome):
 * Nur URLs übernehmen, die von der API oder dem Import geliefert wurden — kein Scraping.
 */
export function importPlatformObjectImages(
  objectId: string,
  entries: Array<{ url: string; fileName: string; source: ObjectImageSource }>
): ObjectImage[] {
  const object = resolveObject(objectId);
  if (!object || entries.length === 0) return [];

  const allowedSources: ObjectImageSource[] = [
    "ImmoScout24",
    "Homegate",
    "Newhome",
  ];

  const existing = normalizeImages(object.images);
  const hasCover = existing.some(
    (image) => image.isCover && image.status === "bestätigt"
  );

  const imported = entries
    .filter((entry) => allowedSources.includes(entry.source) && entry.url.trim())
    .map((entry, index) =>
      buildObjectImage({
        objectId,
        url: entry.url,
        fileName: entry.fileName,
        source: entry.source,
        status: "bestätigt",
        isCover: !hasCover && index === 0,
        sortOrder: existing.length + index,
      })
    );

  if (imported.length === 0) return [];

  persistImages(object, [...existing, ...imported]);
  return imported;
}

export function mapPlatformSourceToImageSource(
  quelle: string
): ObjectImageSource | null {
  const normalized = quelle.toLowerCase();
  if (normalized.includes("immoscout")) return "ImmoScout24";
  if (normalized.includes("homegate")) return "Homegate";
  if (normalized.includes("newhome")) return "Newhome";
  return null;
}
