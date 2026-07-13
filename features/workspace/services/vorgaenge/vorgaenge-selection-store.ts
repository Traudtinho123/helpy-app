const selectedIds = new Set<string>();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeVorgaengeSelection(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSelectedVorgangIds(): string[] {
  return [...selectedIds];
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
