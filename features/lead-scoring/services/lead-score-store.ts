import type { LeadScoreRecord } from "@/features/lead-scoring/types/lead-scoring-types";

const STORAGE_KEY = "helpy-lead-scores-v1";

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function loadMap(): Record<string, LeadScoreRecord> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LeadScoreRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistMap(map: Record<string, LeadScoreRecord>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function subscribeLeadScores(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLeadScoreRecord(customerKey: string): LeadScoreRecord | null {
  return loadMap()[customerKey] ?? null;
}

export function getAllLeadScoreRecords(): LeadScoreRecord[] {
  return Object.values(loadMap());
}

export function upsertLeadScoreRecords(records: LeadScoreRecord[]): void {
  if (records.length === 0) return;

  const map = loadMap();
  for (const record of records) {
    map[record.customerKey] = record;
  }
  persistMap(map);
  notify();
}

export function getLeadScoreForCustomer(customerKey: string): number | null {
  return getLeadScoreRecord(customerKey)?.score ?? null;
}

export function isLeadScoreStale(
  record: LeadScoreRecord | null,
  staleMs: number
): boolean {
  if (!record) return true;
  const updated = Date.parse(record.updatedAt);
  if (Number.isNaN(updated)) return true;
  return Date.now() - updated > staleMs;
}

export function areAnyLeadScoresStale(
  customerKeys: string[],
  staleMs: number
): boolean {
  return customerKeys.some((key) =>
    isLeadScoreStale(getLeadScoreRecord(key), staleMs)
  );
}
