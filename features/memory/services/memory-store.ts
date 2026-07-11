import type { MemoryEntry } from "@/features/memory/services/types";

let memoryEntries: MemoryEntry[] = [];

export function initMemoryStore(entries: MemoryEntry[]): void {
  memoryEntries = [...entries];
}

export function getAllMemories(): MemoryEntry[] {
  return [...memoryEntries];
}

export function getMemoriesByCustomer(customerId: string): MemoryEntry[] {
  return memoryEntries.filter(
    (entry) => entry.scope === "kunde" && entry.customerId === customerId
  );
}

export function getMemoriesBySkill(skill: MemoryEntry["skill"]): MemoryEntry[] {
  return memoryEntries.filter(
    (entry) => entry.scope === "branche" && entry.skill === skill
  );
}

export function getUserMemories(): MemoryEntry[] {
  return memoryEntries.filter((entry) => entry.scope === "nutzer");
}

export function forgetMemory(id: string): void {
  memoryEntries = memoryEntries.filter((entry) => entry.id !== id);
}

export function upsertMemory(entry: MemoryEntry): void {
  const index = memoryEntries.findIndex((item) => item.id === entry.id);
  if (index >= 0) {
    memoryEntries[index] = entry;
  } else {
    memoryEntries.push(entry);
  }
}
