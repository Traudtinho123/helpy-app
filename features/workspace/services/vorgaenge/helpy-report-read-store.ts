const STORAGE_KEY = "helpy-report-read-at";

type ReadMap = Record<string, string>;

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function loadMap(): ReadMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ReadMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistMap(map: ReadMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getHelpyReportReadAt(vorgangId: string): string | null {
  return loadMap()[vorgangId] ?? null;
}

export function isHelpyReportUnread(vorgangId: string): boolean {
  return !getHelpyReportReadAt(vorgangId);
}

export function markHelpyReportRead(vorgangId: string): string {
  const readAt = new Date().toISOString();
  const map = loadMap();
  map[vorgangId] = readAt;
  persistMap(map);
  notify();
  return readAt;
}

export function subscribeHelpyReportReads(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function countUnreadHelpyReports(vorgangIds: string[]): number {
  const map = loadMap();
  return vorgangIds.filter((id) => !map[id]).length;
}
