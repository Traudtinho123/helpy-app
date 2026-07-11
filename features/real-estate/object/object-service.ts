import {
  getMailListeVorgang,
  getMailWorkspaceVorgang,
} from "@/features/mail/unified-mail-source-service";
import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import { applyPipelineTrigger } from "@/features/crm/pipeline/pipeline-engine";
import { upsertPreparedDocument } from "@/features/documents/services/document-engine";
import type { PreparedDocument } from "@/features/documents/services/types";
import { HELPY_PREPARED_LABEL } from "@/features/review/services/safety/review-mode";
import {
  detectRealEstatePlatformSource,
  extractRealEstateObjectFields,
  hasRecognizedObjectData,
} from "@/features/real-estate/object/object-detector";
import {
  buildObjectDedupeKey,
  findExistingRealEstateObject,
  getRealEstateObjectById,
  getRealEstateObjectStoreFingerprint,
  peekRealEstateObjectByVorgangId,
  subscribeRealEstateObjects,
  upsertRealEstateObject,
} from "@/features/real-estate/object/object-memory";
import type {
  RealEstateObject,
  RealEstateObjectInteressentLink,
  RealEstateObjectSource,
} from "@/features/real-estate/object/object-types";
import {
  REAL_ESTATE_OBJECT_STATUS_LABELS,
} from "@/features/real-estate/object/object-types";
import { invalidatePortfolioSummariesCache } from "@/features/portfolio/services/portfolio-service";
import { processBackgroundMemoryEvent } from "@/features/memory/services/background-memory-engine";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

export {
  HELPY_BUTTON_OBJEKT_OEFFNEN,
  HELPY_OBJECT_CARD_HINT,
  HELPY_OBJECT_CARD_TITLE,
} from "@/features/real-estate/object/object-types";

export {
  getAllRealEstateObjects,
  getRealEstateObjectById,
  peekRealEstateObjectByVorgangId,
  subscribeRealEstateObjects,
} from "@/features/real-estate/object/object-memory";

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function mergeInteressentLinks(
  existing: RealEstateObjectInteressentLink[],
  next: RealEstateObjectInteressentLink
): RealEstateObjectInteressentLink[] {
  const filtered = existing.filter(
    (link) =>
      !(
        link.vorgangId === next.vorgangId ||
        (link.email && next.email && link.email.toLowerCase() === next.email.toLowerCase())
      )
  );
  return [next, ...filtered];
}

function buildObjectDocument(
  object: RealEstateObject,
  typeId: PreparedDocument["typeId"],
  typeLabel: string,
  titleSuffix: string
): PreparedDocument {
  return {
    id: `obj-doc-${typeId}-${object.objectId}`,
    typeId,
    skill: "real-estate",
    typeLabel,
    title: `${titleSuffix} — ${object.titel}`,
    customer: object.interessentLinks[0]?.name ?? "Interessent",
    vorgangId: object.vorgangIds[0],
    vorgangTitle: object.titel,
    objectId: object.objectId,
    status: "zur-pruefung",
    category: "helpy-vorbereitet",
    lastEdited: new Date().toLocaleDateString("de-CH"),
    helpyHint: HELPY_PREPARED_LABEL,
    preparedByHelpy: true,
    previewSections: [
      { heading: "Objekt", content: object.titel },
      {
        heading: "Adresse",
        content: [object.adresse, object.plz, object.ort, object.land]
          .filter(Boolean)
          .join(", "),
      },
      { heading: "Preis / Miete", content: object.preis ?? "Bitte ergänzen" },
      { heading: "Quelle", content: object.quelle },
      { heading: "Status", content: REAL_ESTATE_OBJECT_STATUS_LABELS[object.status] },
    ],
  };
}

export type PrepareRealEstateObjectOptions = {
  /** Default true. False during session/bootstrap seed (render-safe). */
  notifySubscribers?: boolean;
};

function ensureObjectDocuments(
  object: RealEstateObject,
  options?: PrepareRealEstateObjectOptions
): string[] {
  const documents: PreparedDocument[] = [
    buildObjectDocument(object, "expose", "Exposé", "Exposé"),
    buildObjectDocument(object, "offerte", "Offerte", "Offerte"),
    buildObjectDocument(object, "reservationsbestaetigung", "Vertrag", "Vertrag"),
  ];

  for (const document of documents) {
    upsertPreparedDocument(document, {
      notifySubscribers: options?.notifySubscribers,
    });
  }

  for (const vorgangId of object.vorgangIds) {
    applyPipelineTrigger(vorgangId, "offerte-erstellt");
  }

  return documents.map((document) => document.id);
}

function resolveInteressentFromBundle(
  bundle: GmailVorgangBundle
): RealEstateObjectInteressentLink {
  const context = bundle.liste.detectedContext ?? [];
  const emailLine = context.find((line) => line.startsWith("E-Mail:"));
  const nameLine = context.find((line) => line.startsWith("Interessent:"));

  const email =
    emailLine?.slice("E-Mail:".length).trim() ||
    bundle.workspace.kunde.email ||
    "—";
  const name =
    nameLine?.slice("Interessent:".length).trim() ||
    bundle.workspace.kunde.ansprechpartner ||
    bundle.workspace.kunde.firmenname ||
    "Interessent";

  return {
    vorgangId: bundle.liste.id,
    email,
    name,
  };
}

function buildObjectRecord(
  bundle: GmailVorgangBundle,
  quelle: RealEstateObjectSource,
  existing: RealEstateObject | null
): RealEstateObject | null {
  const fields = extractRealEstateObjectFields({
    from: bundle.message.from,
    subject: bundle.message.subject,
    snippet: bundle.message.snippet,
    quelle,
    detectedContext: bundle.liste.detectedContext,
  });

  if (!hasRecognizedObjectData(fields)) return null;

  const dedupeKey = buildObjectDedupeKey({
    objektLink: fields.objektLink,
    adresse: fields.adresse,
    titel: fields.titel,
    quelle,
  });
  const objectId = existing?.objectId ?? dedupeKey.replace(/[^a-z0-9-]+/gi, "-");
  const interessent = resolveInteressentFromBundle(bundle);
  const now = new Date().toISOString();

  return {
    objectId,
    quelle,
    adresse: fields.adresse ?? existing?.adresse ?? "—",
    plz: fields.plz ?? existing?.plz ?? "—",
    ort: fields.ort ?? existing?.ort ?? "—",
    land: fields.land ?? existing?.land ?? "Schweiz",
    titel: fields.titel ?? existing?.titel ?? bundle.liste.titel,
    beschreibung:
      fields.beschreibung ?? existing?.beschreibung ?? bundle.liste.summary ?? "—",
    transaktion: fields.transaktion ?? existing?.transaktion ?? null,
    preis: fields.preis ?? existing?.preis ?? null,
    zimmer: fields.zimmer ?? existing?.zimmer ?? null,
    wohnflaeche: fields.wohnflaeche ?? existing?.wohnflaeche ?? null,
    stockwerk: fields.stockwerk ?? existing?.stockwerk ?? null,
    objektLink: fields.objektLink ?? existing?.objektLink ?? null,
    status: existing?.status ?? "vorbereitet",
    aktiv: existing?.aktiv ?? true,
    interessentLinks: mergeInteressentLinks(
      existing?.interessentLinks ?? [],
      interessent
    ),
    vorgangIds: uniqueStrings([
      ...(existing?.vorgangIds ?? []),
      bundle.liste.id,
    ]),
    besichtigungIds: existing?.besichtigungIds ?? [],
    dokumentIds: existing?.dokumentIds ?? [],
    images: existing?.images ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export {
  getObjektPath,
  getRealEstateObjectPath,
} from "@/features/portfolio/services/object-navigation";

export function prepareRealEstateObjectFromBundle(
  bundle: GmailVorgangBundle,
  options?: PrepareRealEstateObjectOptions
): RealEstateObject | null {
  if (shouldPrepareArchive(bundle.liste)) return null;

  const quelle =
    detectRealEstatePlatformSource(
      bundle.message.from,
      bundle.message.subject,
      bundle.message.snippet,
      bundle.liste.quelle
    ) ?? null;

  if (!quelle) return null;

  const fields = extractRealEstateObjectFields({
    from: bundle.message.from,
    subject: bundle.message.subject,
    snippet: bundle.message.snippet,
    quelle,
    detectedContext: bundle.liste.detectedContext,
  });

  if (!hasRecognizedObjectData(fields)) return null;

  const existing =
    findExistingRealEstateObject({
      objektLink: fields.objektLink,
      adresse: fields.adresse,
      titel: fields.titel,
      quelle,
    }) ?? peekRealEstateObjectByVorgangId(bundle.liste.id);

  const record = buildObjectRecord(bundle, quelle, existing);
  if (!record) return null;

  record.dokumentIds = ensureObjectDocuments(record, options);
  const saved = upsertRealEstateObject(record, {
    notifySubscribers: options?.notifySubscribers,
  });
  if (options?.notifySubscribers !== false) {
    processBackgroundMemoryEvent({
      type: "objekt-erkannt",
      objectId: saved.objectId,
      text: [saved.titel, saved.beschreibung, saved.adresse, saved.preis]
        .filter(Boolean)
        .join("\n"),
      vorgangId: bundle.liste.id,
    });
  }
  return saved;
}

export function prepareRealEstateObjectFromListe(
  liste: ListeVorgang,
  workspace: WorkspaceVorgang,
  options?: PrepareRealEstateObjectOptions
): RealEstateObject | null {
  if (shouldPrepareArchive(liste)) return null;
  if (!isPlatformRealEstateQuelle(liste.quelle ?? "")) return null;

  const quelle = detectRealEstatePlatformSource(
    liste.from ?? workspace.letzteEmail.absender,
    liste.titel,
    liste.snippet ?? workspace.letzteEmail.inhalt,
    liste.quelle
  );

  if (!quelle) return null;

  const fields = extractRealEstateObjectFields({
    from: liste.from ?? workspace.letzteEmail.absender,
    subject: liste.titel,
    snippet: liste.snippet ?? workspace.letzteEmail.inhalt,
    quelle,
    detectedContext: liste.detectedContext,
  });

  if (!hasRecognizedObjectData(fields)) return null;

  const existing =
    findExistingRealEstateObject({
      objektLink: fields.objektLink,
      adresse: fields.adresse,
      titel: fields.titel,
      quelle,
    }) ?? peekRealEstateObjectByVorgangId(liste.id);

  const syntheticBundle = {
    liste,
    workspace,
    message: {
      id: liste.sourceEventId ?? liste.id,
      threadId: liste.threadId ?? liste.id,
      subject: liste.titel,
      from: liste.from ?? workspace.letzteEmail.absender,
      snippet: liste.snippet ?? workspace.letzteEmail.inhalt,
      date: liste.receivedAt,
    },
    brain: {
      from: liste.from ?? workspace.letzteEmail.absender,
      summary: liste.summary ?? "",
      intent: liste.intentLabel ?? "Besichtigung",
    },
  } as GmailVorgangBundle;

  const record = buildObjectRecord(syntheticBundle, quelle, existing);
  if (!record) return null;

  record.dokumentIds = ensureObjectDocuments(record, options);
  const saved = upsertRealEstateObject(record, {
    notifySubscribers: options?.notifySubscribers,
  });
  if (options?.notifySubscribers !== false) {
    processBackgroundMemoryEvent({
      type: "objekt-erkannt",
      objectId: saved.objectId,
      text: [saved.titel, saved.beschreibung, saved.adresse, saved.preis]
        .filter(Boolean)
        .join("\n"),
      vorgangId: liste.id,
    });
  }
  return saved;
}

function prepareRealEstateObjectFromDirectMail(
  liste: ListeVorgang,
  workspace: WorkspaceVorgang,
  options?: PrepareRealEstateObjectOptions
): RealEstateObject | null {
  if (shouldPrepareArchive(liste)) return null;

  const quelle =
    detectRealEstatePlatformSource(
      liste.from ?? workspace.letzteEmail.absender,
      liste.titel,
      liste.snippet ?? workspace.letzteEmail.inhalt,
      liste.quelle
    ) ?? ("Website Anfrage" as RealEstateObjectSource);

  const fields = extractRealEstateObjectFields({
    from: liste.from ?? workspace.letzteEmail.absender,
    subject: liste.titel,
    snippet: liste.snippet ?? workspace.letzteEmail.inhalt,
    quelle,
    detectedContext: liste.detectedContext,
  });

  if (!hasRecognizedObjectData(fields)) return null;

  const existing =
    findExistingRealEstateObject({
      objektLink: fields.objektLink,
      adresse: fields.adresse,
      titel: fields.titel,
      quelle,
    }) ?? peekRealEstateObjectByVorgangId(liste.id);

  const syntheticBundle = {
    liste,
    workspace,
    message: {
      id: liste.sourceEventId ?? liste.id,
      threadId: liste.threadId ?? liste.id,
      subject: liste.titel,
      from: liste.from ?? workspace.letzteEmail.absender,
      snippet: liste.snippet ?? workspace.letzteEmail.inhalt,
      date: liste.receivedAt,
    },
    brain: {
      from: liste.from ?? workspace.letzteEmail.absender,
      summary: liste.summary ?? "",
      intent: liste.intentLabel ?? "Anfrage",
    },
  } as GmailVorgangBundle;

  const record = buildObjectRecord(syntheticBundle, quelle, existing);
  if (!record) return null;

  record.dokumentIds = ensureObjectDocuments(record, options);
  const saved = upsertRealEstateObject(record, {
    notifySubscribers: options?.notifySubscribers,
  });
  if (options?.notifySubscribers !== false) {
    processBackgroundMemoryEvent({
      type: "objekt-erkannt",
      objectId: saved.objectId,
      text: [saved.titel, saved.beschreibung, saved.adresse, saved.preis]
        .filter(Boolean)
        .join("\n"),
      vorgangId: liste.id,
    });
  }
  return saved;
}

/** Nutzer-bestätigte Objekt-Anlage aus Workspace-Kontext. */
export function confirmPrepareRealEstateObjectForVorgang(
  vorgangId: string
): RealEstateObject | null {
  const existing = peekRealEstateObjectByVorgangId(vorgangId);
  if (existing) return existing;

  const liste = getMailListeVorgang(vorgangId);
  const workspace = getMailWorkspaceVorgang(vorgangId);
  if (!liste || !workspace) return null;

  return (
    prepareRealEstateObjectFromListe(liste, workspace) ??
    prepareRealEstateObjectFromDirectMail(liste, workspace)
  );
}

export function seedRealEstateObjectsFromListeVorgaenge(
  vorgaenge: ListeVorgang[],
  workspaces: Record<string, WorkspaceVorgang>
): void {
  const seedOptions: PrepareRealEstateObjectOptions = { notifySubscribers: false };

  for (const liste of vorgaenge) {
    const workspace = workspaces[liste.id];
    if (!workspace) continue;
    prepareRealEstateObjectFromListe(liste, workspace, seedOptions);
  }
}

export function seedRealEstateObjectsFromBundles(
  bundles: GmailVorgangBundle[]
): void {
  const seedOptions: PrepareRealEstateObjectOptions = { notifySubscribers: false };

  for (const bundle of bundles) {
    prepareRealEstateObjectFromBundle(bundle, seedOptions);
  }
}

/** Verknüpft einen Besichtigungs-/Viewing-Eintrag mit dem Vorgangs-Objekt. */
export function linkViewingToObject(
  vorgangId: string,
  viewingId: string
): RealEstateObject | null {
  const object = peekRealEstateObjectByVorgangId(vorgangId);
  if (!object) return null;

  const updated: RealEstateObject = {
    ...object,
    besichtigungIds: uniqueStrings([...object.besichtigungIds, viewingId]),
    updatedAt: new Date().toISOString(),
  };

  const saved = upsertRealEstateObject(updated);
  invalidatePortfolioSummariesCache();
  return saved;
}

/** @deprecated Use linkViewingToObject */
export const linkBesichtigungToRealEstateObject = linkViewingToObject;

export function getRealEstateObjectSnapshot(
  vorgangId: string
): RealEstateObject | null {
  return peekRealEstateObjectByVorgangId(vorgangId);
}

const objectSnapshotCache = new Map<
  string,
  { cacheKey: string; value: RealEstateObject | null }
>();

export function getStableRealEstateObjectSnapshot(
  vorgangId: string
): RealEstateObject | null {
  const object = peekRealEstateObjectByVorgangId(vorgangId);
  const cacheKey = object
    ? `${object.objectId}:${object.updatedAt}:${object.besichtigungIds.join(",")}`
    : "none";
  const cached = objectSnapshotCache.get(vorgangId);

  if (cached?.cacheKey === cacheKey) {
    return cached.value;
  }

  const value = object ? { ...object } : null;
  objectSnapshotCache.set(vorgangId, { cacheKey, value });
  return value;
}

export const EMPTY_REAL_ESTATE_OBJECT_SNAPSHOT: RealEstateObject | null = null;

const objectByIdSnapshotCache = new Map<
  string,
  { fingerprint: string; value: RealEstateObject | null }
>();

/** Stabile Snapshot-Referenz für useSyncExternalStore (nach objectId). */
export function getStableRealEstateObjectByIdSnapshot(
  objectId: string
): RealEstateObject | null {
  const fingerprint = getRealEstateObjectStoreFingerprint(objectId) ?? "none";
  const cached = objectByIdSnapshotCache.get(objectId);

  if (cached?.fingerprint === fingerprint) {
    return cached.value;
  }

  const value =
    fingerprint === "none"
      ? EMPTY_REAL_ESTATE_OBJECT_SNAPSHOT
      : getRealEstateObjectById(objectId);

  objectByIdSnapshotCache.set(objectId, { fingerprint, value });
  return value;
}

export function getRealEstateObjectServerSnapshot(): RealEstateObject | null {
  return EMPTY_REAL_ESTATE_OBJECT_SNAPSHOT;
}

export function seedMockRealEstateObjects(): void {
  const now = new Date().toISOString();
  const sample: RealEstateObject = {
    objectId: "link-https-immoscout24-ch-expose-12345678",
    quelle: "ImmoScout24.ch",
    adresse: "Seestrasse 42",
    plz: "8002",
    ort: "Zürich",
    land: "Schweiz",
    titel: "3.5-Zi-Wohnung mit Seesicht",
    beschreibung: "Helle Wohnung in zentraler Lage, Balkon, Lift vorhanden.",
    transaktion: "Miete",
    preis: "3.200 CHF",
    zimmer: "3.5",
    wohnflaeche: "98 m²",
    stockwerk: "4. OG",
    objektLink: "https://www.immoscout24.ch/expose/12345678",
    status: "aktiv",
    aktiv: true,
    interessentLinks: [],
    vorgangIds: [],
    besichtigungIds: [],
    dokumentIds: [],
    images: [],
    createdAt: now,
    updatedAt: now,
  };

  if (!getRealEstateObjectById(sample.objectId)) {
    sample.dokumentIds = ensureObjectDocuments(sample);
    upsertRealEstateObject(sample);
  }
}

export { subscribeRealEstateObjects as subscribeRealEstateObject };
