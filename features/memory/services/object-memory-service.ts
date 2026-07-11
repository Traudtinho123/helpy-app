import { MOCK_PORTFOLIO_ENRICHMENT } from "@/features/portfolio/mock/mock-portfolio-data";
import {
  MOCK_BACKGROUND_OBJECT_MEMORIES,
} from "@/features/memory/mock/memory-mock";
import type {
  BackgroundMemoryHint,
  BackgroundMemoryWorkspaceContext,
  ObjectMemoryRecord,
} from "@/features/memory/types/memory-types";
import { extractCustomerKnowledgeFromText } from "@/features/intelligence/knowledge-engine/knowledge-extractor";

const STORAGE_KEY = "helpy-object-background-memory-v1";

const records = new Map<string, ObjectMemoryRecord>();
const listeners = new Set<() => void>();
let hydrated = false;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      seedObjectBackgroundMemories();
      return;
    }
    const parsed = JSON.parse(raw) as ObjectMemoryRecord[];
    records.clear();
    for (const record of parsed) {
      records.set(record.objectId, record);
    }
    if (records.size === 0) {
      seedObjectBackgroundMemories();
    }
  } catch {
    records.clear();
    seedObjectBackgroundMemories();
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...records.values()]));
}

function buildEmptyRecord(objectId: string): ObjectMemoryRecord {
  return {
    objectId,
    frequentQuestions: [],
    desiredFeatures: [],
    inquiryIntensity: null,
    typicalViewingTimes: [],
    commonObjections: [],
    importantDocuments: [],
    openPoints: [],
    insights: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function seedObjectBackgroundMemories(): void {
  for (const [objectId, record] of Object.entries(MOCK_BACKGROUND_OBJECT_MEMORIES)) {
    if (!records.has(objectId)) {
      records.set(objectId, record);
    }
  }

  for (const [objectId, enrichment] of Object.entries(MOCK_PORTFOLIO_ENRICHMENT)) {
    if (records.has(objectId)) continue;
    records.set(objectId, {
      ...buildEmptyRecord(objectId),
      insights: [...enrichment.helpyWissen],
      lastUpdated: new Date().toISOString(),
    });
  }

  persist();
}

export function subscribeObjectBackgroundMemory(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getObjectMemoryRecord(objectId: string): ObjectMemoryRecord | null {
  hydrate();
  const stored = records.get(objectId);
  if (stored) return { ...stored };

  const mock = MOCK_BACKGROUND_OBJECT_MEMORIES[objectId];
  if (mock) return { ...mock };

  const enrichment = MOCK_PORTFOLIO_ENRICHMENT[objectId];
  if (!enrichment) return null;

  return {
    ...buildEmptyRecord(objectId),
    insights: [...enrichment.helpyWissen],
    lastUpdated: new Date().toISOString(),
  };
}

function upsertObjectRecord(record: ObjectMemoryRecord): ObjectMemoryRecord {
  hydrate();
  records.set(record.objectId, record);
  persist();
  notify();
  return { ...record };
}

function appendUnique(values: string[], next: string[]): string[] {
  const set = new Set(values);
  for (const item of next) {
    const trimmed = item.trim();
    if (trimmed) set.add(trimmed);
  }
  return [...set];
}

export function ingestObjectMemoryFromText(input: {
  objectId: string;
  text: string;
  source: string;
}): ObjectMemoryRecord | null {
  if (!input.objectId || !input.text.trim()) return null;

  hydrate();
  const existing = getObjectMemoryRecord(input.objectId) ?? buildEmptyRecord(input.objectId);
  const extracted = extractCustomerKnowledgeFromText(input.text);
  const normalized = input.text.toLowerCase();
  const insights = [...existing.insights];
  let changed = false;

  if (/garage|parkplatz|stellplatz/.test(normalized)) {
    const insight = "Viele Interessenten fragen bei diesem Objekt nach Parkplätzen.";
    if (!insights.includes(insight)) {
      insights.push(insight);
      changed = true;
    }
  }

  if (/expos[eé]|unterlagen|dokument/.test(normalized)) {
    const insight = "Das Exposé wurde häufig angefragt.";
    if (!insights.includes(insight)) {
      insights.push(insight);
      changed = true;
    }
  }

  if (/freitag|nachmittag|14:|15:|16:/.test(normalized)) {
    const insight = "Besichtigungen für dieses Objekt werden oft am Freitag gewünscht.";
    if (!insights.includes(insight)) {
      insights.push(insight);
      changed = true;
    }
  }

  const frequentQuestions = appendUnique(existing.frequentQuestions, extracted.preferences);
  const desiredFeatures = appendUnique(existing.desiredFeatures, extracted.preferences);

  if (
    !changed &&
    frequentQuestions.length === existing.frequentQuestions.length &&
    desiredFeatures.length === existing.desiredFeatures.length
  ) {
    return existing;
  }

  return upsertObjectRecord({
    ...existing,
    frequentQuestions,
    desiredFeatures,
    insights,
    inquiryIntensity: existing.inquiryIntensity ?? "mittel",
    lastUpdated: new Date().toISOString(),
  });
}

export function buildObjectBackgroundHints(
  objectId: string | null | undefined,
  context: BackgroundMemoryWorkspaceContext
): BackgroundMemoryHint[] {
  if (!objectId) return [];

  const record = getObjectMemoryRecord(objectId);
  if (!record) return [];

  const hints: BackgroundMemoryHint[] = [];

  for (const insight of record.insights.slice(0, 3)) {
    let relevance = 65;
    let tipText: string | undefined;

    if (/parkplatz|garage/i.test(insight)) {
      relevance = context.hasReplyDraft ? 95 : 80;
      tipText = "Ich würde die Parkplatzsituation direkt in der Antwort erwähnen.";
    } else if (/expos[eé]/i.test(insight)) {
      relevance = 70;
    } else if (/freitag|besichtigung/i.test(insight)) {
      relevance = context.hasAppointmentFlow ? 92 : 68;
      tipText = "Ich würde Termine am Freitagnachmittag bevorzugt vorschlagen.";
    }

    hints.push({
      id: `object-${objectId}-${insight.slice(0, 24)}`,
      rememberText: insight,
      tipText,
      relevance,
    });
  }

  return hints;
}
