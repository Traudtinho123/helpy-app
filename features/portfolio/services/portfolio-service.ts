import type { PreparedDocument } from "@/features/documents/services/types";
import { getDocumentsForObject } from "@/features/documents/services/document-engine";
import {
  buildObjectDedupeKey,
  findExistingRealEstateObject,
  getAllRealEstateObjects,
  getRealEstateObjectById,
  upsertRealEstateObject,
  subscribeRealEstateObjects,
} from "@/features/real-estate/object/object-memory";
import { subscribeAppointmentSuggestion } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import { subscribeDocuments } from "@/features/documents/services/document-engine";
import {
  REAL_ESTATE_OBJECT_STATUS_LABELS,
} from "@/features/real-estate/object/object-types";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import {
  MOCK_PORTFOLIO_DISPLAY_COUNTS,
  MOCK_PORTFOLIO_ENRICHMENT,
  MOCK_PORTFOLIO_OBJECTS,
} from "@/features/portfolio/mock/mock-portfolio-data";
import type {
  ObjektakteDetail,
  ObjektEnrichment,
  ObjektInteressent,
  PortfolioObjectSummary,
} from "@/features/portfolio/types/objekt-portfolio-types";
import {
  getCoverImageUrl,
  sortObjectImages,
} from "@/features/real-estate/object/object-image-utils";
import { getMockObjectImages } from "@/features/real-estate/object/mock-object-images";
import {
  formatObjectListingPrice,
  formatObjectListingPriceLabel,
} from "@/features/portfolio/services/object-pricing-utils";

let portfolioSeeded = false;

export function resolvePortfolioObjectImages(object: RealEstateObject) {
  if (object.images.length > 0) {
    return sortObjectImages(object.images);
  }
  return sortObjectImages(getMockObjectImages(object.objectId));
}

function objectDedupeKey(object: RealEstateObject): string {
  return buildObjectDedupeKey({
    objektLink: object.objektLink,
    adresse: object.adresse,
    titel: object.titel,
    quelle: object.quelle,
  });
}

function mergeInteressentLinksFromEnrichment(
  object: RealEstateObject,
  enrichment: ObjektEnrichment | undefined
): ObjektInteressent[] {
  if (object.interessentLinks.length > 0) {
    return object.interessentLinks.map((link) => ({
      vorgangId: link.vorgangId,
      name: link.name,
      email: link.email,
      status: "Im Vorgang",
      letzteAktivitaet: formatLetzteAktivitaet(object.updatedAt),
    }));
  }

  return enrichment?.interessenten ?? [];
}

function formatLetzteAktivitaet(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Heute, ${time}`;
  }

  return date.toLocaleDateString("de-CH");
}

function resolveDisplayCounts(
  object: RealEstateObject,
  enrichment: ObjektEnrichment | undefined,
  dokumenteCount: number
): {
  interessentenCount: number;
  besichtigungenCount: number;
  dokumenteCount: number;
  letzteAktivitaet: string;
} {
  const mockCounts = MOCK_PORTFOLIO_DISPLAY_COUNTS[object.objectId];
  const fromHelpy =
    object.vorgangIds.length > 0 || object.interessentLinks.length > 0;
  const interessentenFromObject = object.interessentLinks.length;
  const interessentenFromEnrichment = enrichment?.interessenten.length ?? 0;
  const besichtigungenFromObject = object.besichtigungIds.length;
  const besichtigungenFromEnrichment = enrichment?.besichtigungen.length ?? 0;
  const dokumenteFromObject = object.dokumentIds.length;
  const resolvedDokumente = Math.max(
    dokumenteCount,
    dokumenteFromObject,
    mockCounts?.dokumente && !fromHelpy ? mockCounts.dokumente : 0
  );

  return {
    interessentenCount:
      interessentenFromObject ||
      (fromHelpy ? 0 : interessentenFromEnrichment) ||
      mockCounts?.interessenten ||
      0,
    besichtigungenCount:
      besichtigungenFromObject ||
      (fromHelpy ? 0 : besichtigungenFromEnrichment) ||
      mockCounts?.besichtigungen ||
      0,
    dokumenteCount: resolvedDokumente,
    letzteAktivitaet: fromHelpy
      ? formatLetzteAktivitaet(object.updatedAt)
      : mockCounts?.letzteAktivitaet ?? formatLetzteAktivitaet(object.updatedAt),
  };
}

function buildHelpySummary(
  interessentenCount: number,
  besichtigungenCount: number,
  dokumenteCount: number
): string {
  const parts: string[] = [];

  if (interessentenCount > 0) {
    parts.push(
      `${interessentenCount} ${interessentenCount === 1 ? "Interessent" : "Interessenten"}`
    );
  }
  if (besichtigungenCount > 0) {
    parts.push(
      `${besichtigungenCount} ${besichtigungenCount === 1 ? "Besichtigung" : "Besichtigungen"}`
    );
  }
  if (dokumenteCount > 0) {
    parts.push(
      `${dokumenteCount} ${dokumenteCount === 1 ? "Dokument" : "Dokumente"}`
    );
  }

  if (parts.length === 0) {
    return "HELPY bereitet die Objektakte vor, sobald Anfragen eingehen.";
  }

  return `Dieses Objekt hat ${parts.join(", ")}.`;
}

function buildDefaultEnrichment(object: RealEstateObject): ObjektEnrichment {
  const interessenten = mergeInteressentLinksFromEnrichment(object, undefined);

  return {
    baujahr: object.baujahr ?? "—",
    verfuegbarkeit: object.verfuegbarkeit ?? "Auf Anfrage",
    interessenten,
    besichtigungen: object.besichtigungIds.map((id, index) => ({
      id,
      datum: "—",
      uhrzeit: "—",
      interessent: interessenten[index]?.name ?? "Interessent",
      status: "Geplant",
      kalenderquelle: "Kalender",
    })),
    kommunikation: interessenten.slice(0, 2).map((interessent, index) => ({
      id: `kom-auto-${object.objectId}-${index}`,
      quelle: object.quelle,
      betreff: `Anfrage zu ${object.titel}`,
      kunde: interessent.name,
      datum: interessent.letzteAktivitaet,
      status: "Neu",
    })),
    helpyWissen: [
      interessenten.length > 0
        ? "Interessenten haben sich zu diesem Objekt gemeldet."
        : "Noch keine Muster erkannt — HELPY lernt mit jeder Anfrage.",
    ],
  };
}

/** Stellt Mock-Portfolio bereit, wenn noch keine erkannten Objekte vorhanden sind. */
export function ensurePortfolioSeed(): void {
  if (typeof window === "undefined" || portfolioSeeded) return;
  portfolioSeeded = true;

  const existing = getAllRealEstateObjects();
  const existingIds = new Set(existing.map((object) => object.objectId));
  const existingKeys = new Set(existing.map(objectDedupeKey));

  for (const mock of MOCK_PORTFOLIO_OBJECTS) {
    // Bearbeitete Mock-Objekte (z. B. neuer Titel) nicht erneut aus Seed überschreiben.
    if (existingIds.has(mock.objectId)) continue;

    const key = objectDedupeKey(mock);
    if (existingKeys.has(key)) continue;

    const duplicate = findExistingRealEstateObject({
      objektLink: mock.objektLink,
      adresse: mock.adresse,
      titel: mock.titel,
      quelle: mock.quelle,
    });

    if (duplicate) continue;

    // Silent upsert: getObjektakteDetail runs in useMemo during render.
    upsertRealEstateObject(mock, { notifySubscribers: false });
    existingIds.add(mock.objectId);
    existingKeys.add(key);
  }
}

function mergePortfolioObjects(
  realObjects: RealEstateObject[],
  mockObjects: RealEstateObject[]
): RealEstateObject[] {
  const storedIds = new Set(realObjects.map((object) => object.objectId));
  const byKey = new Map<string, RealEstateObject>();

  for (const object of realObjects) {
    byKey.set(objectDedupeKey(object), object);
  }

  for (const mock of mockObjects) {
    if (storedIds.has(mock.objectId)) continue;
    const key = objectDedupeKey(mock);
    if (!byKey.has(key)) {
      byKey.set(key, mock);
    }
  }

  return [...byKey.values()].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

export function getPortfolioObjects(): RealEstateObject[] {
  ensurePortfolioSeed();
  const real = getAllRealEstateObjects();
  return mergePortfolioObjects(real, MOCK_PORTFOLIO_OBJECTS);
}

export function buildPortfolioSummary(object: RealEstateObject): PortfolioObjectSummary {
  const enrichment = MOCK_PORTFOLIO_ENRICHMENT[object.objectId];
  const dokumente = getDocumentsForObject(object.objectId);
  const counts = resolveDisplayCounts(object, enrichment, dokumente.length);
  const fromHelpy = object.vorgangIds.length > 0 || object.interessentLinks.length > 0;
  const images = resolvePortfolioObjectImages(object);
  const priceDisplay = formatObjectListingPrice(object.transaktion, object.preis);

  return {
    objectId: object.objectId,
    titel: object.titel,
    adresse: object.adresse,
    plz: object.plz,
    ort: object.ort,
    preis: formatObjectListingPriceLabel(object.transaktion, object.preis),
    transaktion: object.transaktion,
    listingBadge: priceDisplay.badge,
    formattedPreis: priceDisplay.formattedPreis,
    status: object.status,
    statusLabel: REAL_ESTATE_OBJECT_STATUS_LABELS[object.status],
    quelle: object.quelle,
    interessentenCount: counts.interessentenCount,
    besichtigungenCount: counts.besichtigungenCount,
    dokumenteCount: counts.dokumenteCount,
    letzteAktivitaet: counts.letzteAktivitaet,
    fromHelpy,
    coverImageUrl: getCoverImageUrl(images),
    imagesCount: images.filter((image) => image.status === "bestätigt").length,
  };
}

export function getPortfolioSummaries(): PortfolioObjectSummary[] {
  return getPortfolioObjects().map(buildPortfolioSummary);
}

export { getObjektPath } from "@/features/portfolio/services/object-navigation";

function buildMockDokumente(object: RealEstateObject): PreparedDocument[] {
  const templates: Array<{ typeId: PreparedDocument["typeId"]; typeLabel: string; title: string }> = [
    { typeId: "expose", typeLabel: "Exposé", title: `Exposé — ${object.titel}` },
    { typeId: "besichtigungsprotokoll", typeLabel: "Grundriss", title: `Grundriss — ${object.titel}` },
    { typeId: "kaufinteressenten-zusammenfassung", typeLabel: "Bilder", title: `Bilder — ${object.titel}` },
    { typeId: "reservationsbestaetigung", typeLabel: "Vertrag", title: `Vertragsentwurf — ${object.titel}` },
  ];

  return templates.map((template, index) => ({
    id: `mock-doc-${object.objectId}-${index}`,
    typeId: template.typeId,
    skill: "real-estate" as const,
    typeLabel: template.typeLabel,
    title: template.title,
    customer: "Interessent",
    objectId: object.objectId,
    status: "zur-pruefung" as const,
    category: "helpy-vorbereitet" as const,
    lastEdited: formatLetzteAktivitaet(object.updatedAt),
    helpyHint: "Von HELPY vorbereitet",
    preparedByHelpy: true,
    previewSections: [{ content: template.title }],
  }));
}

function buildBesichtigungenFromObject(
  object: RealEstateObject,
  interessenten: ObjektInteressent[]
): ObjektEnrichment["besichtigungen"] {
  return object.besichtigungIds.map((id, index) => ({
    id,
    datum: "—",
    uhrzeit: "—",
    interessent: interessenten[index]?.name ?? "Interessent",
    status: "Geplant",
    kalenderquelle: "Kalender",
  }));
}

export function getObjektakteDetail(objectId: string): ObjektakteDetail | null {
  ensurePortfolioSeed();

  const object =
    getRealEstateObjectById(objectId) ??
    MOCK_PORTFOLIO_OBJECTS.find((item) => item.objectId === objectId) ??
    null;

  if (!object) return null;

  const enrichment =
    MOCK_PORTFOLIO_ENRICHMENT[object.objectId] ?? buildDefaultEnrichment(object);
  const storeDokumente = getDocumentsForObject(object.objectId);
  const dokumente =
    storeDokumente.length > 0 ? storeDokumente : buildMockDokumente(object);
  const counts = resolveDisplayCounts(object, enrichment, dokumente.length);
  const interessenten = mergeInteressentLinksFromEnrichment(object, enrichment);
  const images = resolvePortfolioObjectImages(object);
  const besichtigungenFromObject = buildBesichtigungenFromObject(object, interessenten);
  const besichtigungen =
    besichtigungenFromObject.length > 0
      ? besichtigungenFromObject
      : enrichment.besichtigungen;

  return {
    object,
    summary: buildHelpySummary(
      counts.interessentenCount,
      counts.besichtigungenCount,
      counts.dokumenteCount
    ),
    baujahr: object.baujahr ?? enrichment.baujahr,
    verfuegbarkeit: object.verfuegbarkeit ?? enrichment.verfuegbarkeit,
    interessenten:
      interessenten.length > 0 ? interessenten : enrichment.interessenten,
    besichtigungen,
    dokumente,
    kommunikation: enrichment.kommunikation,
    helpyWissen: enrichment.helpyWissen,
    interessentenCount: counts.interessentenCount,
    besichtigungenCount: counts.besichtigungenCount,
    dokumenteCount: counts.dokumenteCount,
    letzteAktivitaet: counts.letzteAktivitaet,
    images,
  };
}

export const EMPTY_PORTFOLIO_SUMMARIES: readonly PortfolioObjectSummary[] = [];

type PortfolioSummariesCache = {
  fingerprint: string;
  value: readonly PortfolioObjectSummary[];
};

let portfolioSummariesCache: PortfolioSummariesCache | null = null;

function buildSummariesFingerprint(summaries: PortfolioObjectSummary[]): string {
  return summaries
    .map(
      (item) =>
        `${item.objectId}:${item.titel}:${item.status}:${item.letzteAktivitaet}:${item.interessentenCount}:${item.besichtigungenCount}:${item.dokumenteCount}:${item.coverImageUrl ?? ""}:${item.imagesCount}:${item.transaktion ?? ""}:${item.formattedPreis}`
    )
    .join("|");
}

export function getStablePortfolioSummariesSnapshot(): readonly PortfolioObjectSummary[] {
  ensurePortfolioSeed();
  const next = getPortfolioSummaries();

  if (next.length === 0) {
    if (portfolioSummariesCache?.value !== EMPTY_PORTFOLIO_SUMMARIES) {
      portfolioSummariesCache = { fingerprint: "", value: EMPTY_PORTFOLIO_SUMMARIES };
    }
    return EMPTY_PORTFOLIO_SUMMARIES;
  }

  const fingerprint = buildSummariesFingerprint(next);

  if (portfolioSummariesCache?.fingerprint === fingerprint) {
    return portfolioSummariesCache.value;
  }

  const value = Object.freeze([...next]) as readonly PortfolioObjectSummary[];
  portfolioSummariesCache = { fingerprint, value };
  return value;
}

export function invalidatePortfolioSummariesCache(): void {
  portfolioSummariesCache = null;
}

/** Kombiniert Objekt-, Dokument- und Termin-Stores für Portfolio-Revision. */
export function subscribePortfolioStores(listener: () => void): () => void {
  const unsubs = [
    subscribeRealEstateObjects(listener),
    subscribeDocuments(listener),
    subscribeAppointmentSuggestion(listener),
  ];
  return () => unsubs.forEach((unsub) => unsub());
}

export function getServerPortfolioSummariesSnapshot(): readonly PortfolioObjectSummary[] {
  return EMPTY_PORTFOLIO_SUMMARIES;
}
