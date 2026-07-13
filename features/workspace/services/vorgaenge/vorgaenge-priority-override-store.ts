import type { VorgangPriority } from "@/features/workspace/services/vorgaenge/types";

const overrides = new Map<string, VorgangPriority>();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribePriorityOverrides(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPriorityOverride(vorgangId: string): VorgangPriority | null {
  return overrides.get(vorgangId) ?? null;
}

export function setPriorityOverride(
  vorgangId: string,
  priority: VorgangPriority
): void {
  overrides.set(vorgangId, priority);
  notify();
}

export function setBulkPriorityOverride(
  vorgangIds: string[],
  priority: VorgangPriority
): void {
  for (const id of vorgangIds) {
    overrides.set(id, priority);
  }
  notify();
}

export function applyPriorityOverride<T extends { id: string; prioritaet: VorgangPriority }>(
  vorgang: T
): T {
  const override = overrides.get(vorgang.id);
  if (!override) return vorgang;
  return { ...vorgang, prioritaet: override };
}
