import type { CustomerMemoryProfile } from "@/features/memory/types/customer-memory-types";

const STORAGE_KEY = "helpy-customer-memory-v2";

const listeners = new Set<() => void>();

let profiles = new Map<string, CustomerMemoryProfile>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function hydrateFromSession(): void {
  if (typeof window === "undefined" || profiles.size > 0) return;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as CustomerMemoryProfile[];
    profiles = new Map(parsed.map((profile) => [profile.contact.id, profile]));
  } catch {
    profiles = new Map();
  }
}

function persistToSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...profiles.values()])
  );
}

export function subscribeCustomerMemory(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCustomerProfile(customerId: string): CustomerMemoryProfile | null {
  hydrateFromSession();
  const profile = profiles.get(customerId);
  return profile ? structuredClone(profile) : null;
}

export function getCustomerProfileByEmail(email: string): CustomerMemoryProfile | null {
  if (!email.trim()) return null;
  return getCustomerProfile(buildCustomerIdFromEmail(email));
}

export function getAllCustomerProfiles(): CustomerMemoryProfile[] {
  hydrateFromSession();
  return [...profiles.values()].map((profile) => structuredClone(profile));
}

export function upsertCustomerProfile(profile: CustomerMemoryProfile): void {
  hydrateFromSession();
  profiles.set(profile.contact.id, structuredClone(profile));
  persistToSession();
  notify();
}

export function buildCustomerIdFromEmail(email: string): string {
  return `customer-${email.trim().toLowerCase()}`;
}

export function clearCustomerMemoryStore(): void {
  profiles = new Map();
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
  notify();
}
