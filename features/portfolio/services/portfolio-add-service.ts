import type { ObjectImage } from "@/features/real-estate/object/object-image-types";
import {
  getRealEstateObjectById,
  upsertRealEstateObject,
} from "@/features/real-estate/object/object-memory";
import type {
  RealEstateObject,
  RealEstateObjectStatus,
  RealEstateObjectTransaction,
} from "@/features/real-estate/object/object-types";
import { invalidatePortfolioSummariesCache } from "@/features/portfolio/services/portfolio-service";

export type AddPortfolioObjectInput = {
  titel: string;
  adresse: string;
  plz: string;
  ort: string;
  land: string;
  transaktion: RealEstateObjectTransaction;
  preis: string;
  zimmer: string;
  wohnflaeche: string;
  stockwerk: string;
  baujahr: string;
  verfuegbarkeit: string;
  beschreibung: string;
  status: RealEstateObjectStatus;
  coverPreviewUrl?: string | null;
  coverFileName?: string | null;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildObjectId(input: AddPortfolioObjectInput): string {
  const base = slugify(`${input.adresse}-${input.plz}-${input.ort}`) || "objekt";
  return `obj-manuell-${base}-${Date.now()}`;
}

function buildCoverImage(
  objectId: string,
  previewUrl: string,
  fileName: string
): ObjectImage {
  const now = new Date().toISOString();
  return {
    id: `${objectId}-cover`,
    objectId,
    url: previewUrl,
    fileName,
    source: "manuell hochgeladen",
    isCover: true,
    sortOrder: 0,
    createdAt: now,
    status: "bestätigt",
  };
}

/** Mock-Speicherung — Objekt erscheint sofort in der Liste. */
export function addPortfolioObject(input: AddPortfolioObjectInput): RealEstateObject {
  const now = new Date().toISOString();
  const objectId = buildObjectId(input);
  const images =
    input.coverPreviewUrl && input.coverFileName
      ? [
          buildCoverImage(
            objectId,
            input.coverPreviewUrl,
            input.coverFileName
          ),
        ]
      : [];

  const object: RealEstateObject = {
    objectId,
    quelle: "Website Anfrage",
    adresse: input.adresse.trim(),
    plz: input.plz.trim(),
    ort: input.ort.trim(),
    land: input.land.trim() || "Schweiz",
    titel: input.titel.trim(),
    beschreibung: input.beschreibung.trim(),
    transaktion: input.transaktion,
    preis: input.preis.trim() || null,
    zimmer: input.zimmer.trim() || null,
    wohnflaeche: input.wohnflaeche.trim() || null,
    stockwerk: input.stockwerk.trim() || null,
    baujahr: input.baujahr.trim() || null,
    verfuegbarkeit: input.verfuegbarkeit.trim() || null,
    objektLink: null,
    status: input.status,
    aktiv: input.status === "aktiv" || input.status === "reserviert",
    interessentLinks: [],
    vorgangIds: [],
    besichtigungIds: [],
    dokumentIds: [],
    images,
    createdAt: now,
    updatedAt: now,
  };

  const saved = upsertRealEstateObject(object);
  invalidatePortfolioSummariesCache();
  return saved;
}

export function updatePortfolioObjectTitle(
  objectId: string,
  titel: string
): RealEstateObject | null {
  const existing = getRealEstateObjectById(objectId);
  if (!existing) return null;

  const nextTitle = titel.trim();
  if (!nextTitle) return null;

  if (existing.titel === nextTitle) {
    return existing;
  }

  const saved = upsertRealEstateObject({
    ...existing,
    titel: nextTitle,
    updatedAt: new Date().toISOString(),
  });
  invalidatePortfolioSummariesCache();
  return saved;
}
