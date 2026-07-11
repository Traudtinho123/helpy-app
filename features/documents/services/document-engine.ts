import { MOCK_DOCUMENTS } from "@/features/documents/services/mock-documents";
import { MOCK_TEMPLATES } from "@/features/documents/services/mock-templates";
import {
  getAllTemplates,
  getDocumentTypeLabel,
  getTemplatesForSkill,
  registerTemplates,
} from "@/features/documents/services/template-registry";
import {
  applyDocumentLinks,
  matchesDocumentToCustomer,
  matchesDocumentToObject,
} from "@/features/documents/services/document-link-engine";
import { appendDocumentIdToObject } from "@/features/real-estate/object/object-link-sync";
import type {
  DocumentCounts,
  DocumentFilterTab,
  DocumentTemplate,
  PreparedDocument,
} from "@/features/documents/services/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

let documentsCache: PreparedDocument[] = [];
let initialized = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeDocuments(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function ensureInitialized(): void {
  if (initialized) return;
  registerTemplates(MOCK_TEMPLATES);
  documentsCache = MOCK_DOCUMENTS.map((document) => applyDocumentLinks(document));
  initialized = true;
}

export function getAllDocuments(): PreparedDocument[] {
  ensureInitialized();
  return [...documentsCache];
}

export function getDocumentById(id: string): PreparedDocument | undefined {
  ensureInitialized();
  return documentsCache.find((doc) => doc.id === id);
}

export function findDocumentByDedupeKey(
  dedupeKey: string
): PreparedDocument | undefined {
  ensureInitialized();
  return documentsCache.find(
    (doc) => doc.attachmentMeta?.dedupeKey === dedupeKey
  );
}

export function upsertPreparedDocument(
  document: PreparedDocument,
  options?: { notifySubscribers?: boolean }
): PreparedDocument {
  ensureInitialized();

  const dedupeKey = document.attachmentMeta?.dedupeKey;
  if (dedupeKey) {
    const existing = findDocumentByDedupeKey(dedupeKey);
    if (existing) {
      const merged = applyDocumentLinks({
        ...existing,
        ...document,
        id: existing.id,
        links: {
          ...existing.links,
          ...document.links,
        },
      });
      const index = documentsCache.findIndex((doc) => doc.id === existing.id);
      documentsCache[index] = merged;
      if (options?.notifySubscribers !== false) {
        notify();
      }
      return merged;
    }
  }

  const linked = applyDocumentLinks(document);
  const index = documentsCache.findIndex((doc) => doc.id === linked.id);
  if (index >= 0) {
    documentsCache[index] = linked;
  } else {
    documentsCache.unshift(linked);
  }

  if (linked.objectId) {
    appendDocumentIdToObject(linked.objectId, linked.id, {
      notifySubscribers: options?.notifySubscribers,
    });
  }

  if (options?.notifySubscribers !== false) {
    notify();
  }
  return linked;
}

export function getDocumentsForVorgang(vorgangId: string): PreparedDocument[] {
  ensureInitialized();
  return dedupeDocumentsByAttachment(
    documentsCache.filter((document) => document.vorgangId === vorgangId)
  );
}

export function getPreparedDocumentForVorgang(
  vorgangId: string,
  typeId: PreparedDocument["typeId"] = "expose"
): PreparedDocument | undefined {
  ensureInitialized();
  return documentsCache.find(
    (doc) => doc.vorgangId === vorgangId && doc.typeId === typeId
  );
}

export function getDocumentsForCustomer(input: {
  vorgangId?: string;
  email?: string;
  customerId?: string;
}): PreparedDocument[] {
  ensureInitialized();
  const matched = documentsCache.filter((document) =>
    matchesDocumentToCustomer(document, input)
  );
  return dedupeDocumentsByAttachment(matched);
}

export function getDocumentsForObject(objectId: string): PreparedDocument[] {
  ensureInitialized();
  const matched = documentsCache.filter((document) =>
    matchesDocumentToObject(document, objectId)
  );
  return dedupeDocumentsByAttachment(matched);
}

function dedupeDocumentsByAttachment(
  documents: PreparedDocument[]
): PreparedDocument[] {
  const seen = new Set<string>();
  const result: PreparedDocument[] = [];

  for (const document of documents) {
    const key =
      document.attachmentMeta?.dedupeKey ??
      `${document.id}:${document.title.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(document);
  }

  return result;
}

function templateAsDocument(template: DocumentTemplate): PreparedDocument {
  return {
    id: template.id,
    typeId: template.typeId,
    skill: template.skill,
    typeLabel: template.label,
    title: `Vorlage: ${template.label}`,
    customer: "—",
    status: "entwurf",
    category: "vorlage",
    lastEdited: "Vorlage",
    helpyHint: template.description,
    preparedByHelpy: false,
    previewSections: [
      {
        heading: "Vorlagenbeschreibung",
        content: template.description,
      },
      {
        heading: "Verwendung",
        content:
          "Diese Vorlage kann für neue Dokumente verwendet werden. HELPY füllt relevante Felder aus dem Vorgang vor — bitte prüfen und bestätigen.",
      },
    ],
  };
}

export function getDocumentsForTab(
  tab: DocumentFilterTab,
  skill?: HelpySkill
): PreparedDocument[] {
  ensureInitialized();

  if (tab === "vorlagen") {
    const templates = skill ? getTemplatesForSkill(skill) : getAllTemplates();
    return templates.map(templateAsDocument);
  }

  let docs = documentsCache.filter((doc) => doc.category !== "vorlage");

  if (tab === "entwuerfe") {
    docs = docs.filter((doc) => doc.category === "entwurf");
  } else if (tab === "fertige") {
    docs = docs.filter((doc) => doc.category === "fertig");
  } else if (tab === "helpy-vorbereitet") {
    docs = docs.filter(
      (doc) => doc.category === "helpy-vorbereitet" || doc.preparedByHelpy
    );
  }

  if (skill) {
    docs = docs.filter((doc) => doc.skill === skill);
  }

  return docs;
}

export function getDocumentCounts(skill?: HelpySkill): DocumentCounts {
  ensureInitialized();

  return {
    alle: getDocumentsForTab("alle", skill).length,
    vorlagen: getDocumentsForTab("vorlagen", skill).length,
    entwuerfe: getDocumentsForTab("entwuerfe", skill).length,
    fertige: getDocumentsForTab("fertige", skill).length,
    "helpy-vorbereitet": getDocumentsForTab("helpy-vorbereitet", skill).length,
  };
}

export function getHelpyPreparedCount(skill?: HelpySkill): number {
  return getDocumentCounts(skill)["helpy-vorbereitet"];
}

export function getDocumentPreviewTitle(doc: PreparedDocument): string {
  return `${getDocumentTypeLabel(doc.typeId)} · ${doc.title}`;
}

export function searchDocuments(
  query: string,
  tab: DocumentFilterTab,
  skill?: HelpySkill
): PreparedDocument[] {
  const normalized = query.trim().toLowerCase();
  const docs = getDocumentsForTab(tab, skill);

  if (!normalized) return docs;

  return docs.filter(
    (doc) =>
      doc.title.toLowerCase().includes(normalized) ||
      doc.customer.toLowerCase().includes(normalized) ||
      doc.typeLabel.toLowerCase().includes(normalized) ||
      doc.vorgangTitle?.toLowerCase().includes(normalized) ||
      doc.attachmentMeta?.fileName.toLowerCase().includes(normalized)
  );
}
