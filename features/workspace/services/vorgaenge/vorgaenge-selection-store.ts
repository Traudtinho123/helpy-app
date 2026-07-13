const selectedIds = new Set<string>();
const listeners = new Set<() => void>();

/** Stabile Snapshot-Referenz für useSyncExternalStore. */
let cachedSnapshot: string[] = [];
let cachedSnapshotKey = "";

function buildSnapshotKey(): string {
  return [...selectedIds].sort().join("\0");
}

function refreshSnapshot(): void {
  const nextKey = buildSnapshotKey();
  if (nextKey === cachedSnapshotKey) return;
  cachedSnapshotKey = nextKey;
  cachedSnapshot = [...selectedIds];
}

function notify(): void {
  refreshSnapshot();
  listeners.forEach((listener) => listener());
}

export function subscribeVorgaengeSelection(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSelectedVorgangIds(): string[] {
  refreshSnapshot();
  return cachedSnapshot;
}

export function isVorgangSelected(vorgangId: string): boolean {
  return selectedIds.has(vorgangId);
}

export function toggleVorgangSelection(vorgangId: string): void {
  if (selectedIds.has(vorgangId)) {
    selectedIds.delete(vorgangId);
  } else {
    selectedIds.add(vorgangId);
  }
  notify();
}

export function setVorgangSelected(vorgangId: string, selected: boolean): void {
  if (selected) {
    selectedIds.add(vorgangId);
  } else {
    selectedIds.delete(vorgangId);
  }
  notify();
}

export function selectVorgangIds(ids: string[]): void {
  for (const id of ids) {
    selectedIds.add(id);
  }
  notify();
}

export function clearVorgangSelection(): void {
  if (selectedIds.size === 0) return;
  selectedIds.clear();
  notify();
}
