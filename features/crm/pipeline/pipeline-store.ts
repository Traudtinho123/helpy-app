import type { CrmPipelineRecord } from "@/features/crm/pipeline/pipeline-types";

const STORAGE_KEY = "helpy-crm-pipeline-v1";

const records = new Map<string, CrmPipelineRecord>();
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
    if (!raw) return;
    const parsed = JSON.parse(raw) as CrmPipelineRecord[];
    records.clear();
    for (const record of parsed) {
      records.set(record.vorgangId, record);
    }
  } catch {
    records.clear();
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...records.values()]));
}

export function subscribeCrmPipeline(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAllCrmPipelineRecords(): CrmPipelineRecord[] {
  hydrate();
  return [...records.values()].map((record) => ({ ...record }));
}

export function getCrmPipelineRecord(vorgangId: string): CrmPipelineRecord | null {
  hydrate();
  const record = records.get(vorgangId);
  return record ? { ...record } : null;
}

export function upsertCrmPipelineRecord(record: CrmPipelineRecord): CrmPipelineRecord {
  hydrate();
  const existing = records.get(record.vorgangId);
  if (
    existing &&
    existing.currentStage === record.currentStage &&
    existing.recommendedStage === record.recommendedStage &&
    existing.recommendationText === record.recommendationText &&
    existing.manuallySet === record.manuallySet
  ) {
    return { ...existing };
  }

  records.set(record.vorgangId, record);
  persist();
  notify();
  return { ...record };
}

export function clearCrmPipelineStore(): void {
  records.clear();
  hydrated = false;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
  notify();
}
