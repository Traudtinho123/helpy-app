import { seedMockCustomerMemories } from "@/features/intelligence/customer-memory/mock-customer-memory";
import type { CustomerMemory } from "@/features/intelligence/types/intelligence-types";

const STORAGE_KEY = "helpy-intelligence-customer-memory-v1";

const profiles = new Map<string, CustomerMemory>();
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
      seedMockCustomerMemories();
      return;
    }
    const parsed = JSON.parse(raw) as CustomerMemory[];
    profiles.clear();
    for (const profile of parsed) {
      profiles.set(profile.customerId, profile);
    }
    if (profiles.size === 0) {
      seedMockCustomerMemories();
    }
  } catch {
    profiles.clear();
    seedMockCustomerMemories();
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...profiles.values()])
  );
}

export function subscribeIntelligenceCustomerMemory(
  listener: () => void
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function buildCustomerIdFromEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return normalized ? `customer-${normalized}` : "customer-unbekannt";
}

export function getIntelligenceCustomerMemory(
  customerId: string
): CustomerMemory | null {
  hydrate();
  const profile = profiles.get(customerId);
  return profile ? { ...profile } : null;
}

export function upsertIntelligenceCustomerMemory(
  memory: CustomerMemory
): CustomerMemory {
  hydrate();
  profiles.set(memory.customerId, memory);
  persist();
  notify();
  return { ...memory };
}

export function getAllIntelligenceCustomerMemories(): CustomerMemory[] {
  hydrate();
  return [...profiles.values()].map((profile) => ({ ...profile }));
}

export function clearIntelligenceCustomerMemoryStore(): void {
  profiles.clear();
  hydrated = true;
  persist();
  notify();
}
