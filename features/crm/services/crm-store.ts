import {
  findMatchingCustomer,
  mergeCrmCustomers,
} from "@/features/crm/services/crm-merge";
import { invalidateCrmWorkspaceSnapshots } from "@/features/crm/services/crm-workspace-snapshot";
import { invalidateMemoryWorkspaceSnapshots } from "@/features/memory/services/memory-workspace-snapshot";
import type { HelpyCrmCustomer } from "@/features/crm/types/crm-types";

const STORAGE_KEY = "helpy-smart-crm-v1";

const listeners = new Set<() => void>();

let customers = new Map<string, HelpyCrmCustomer>();

function notify(): void {
  invalidateCrmWorkspaceSnapshots();
  invalidateMemoryWorkspaceSnapshots();
  listeners.forEach((listener) => listener());
}

function hydrateFromSession(): void {
  if (typeof window === "undefined" || customers.size > 0) return;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as HelpyCrmCustomer[];
    customers = new Map(parsed.map((customer) => [customer.id, customer]));
  } catch {
    customers = new Map();
  }
}

function persistToSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...customers.values()])
  );
}

export function subscribeCrm(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCrmCustomer(customerId: string): HelpyCrmCustomer | null {
  hydrateFromSession();
  const customer = customers.get(customerId);
  return customer ? structuredClone(customer) : null;
}

export function getAllCrmCustomers(): HelpyCrmCustomer[] {
  hydrateFromSession();
  return [...customers.values()].map((customer) => structuredClone(customer));
}

export function findCrmCustomerByMatch(
  input: Parameters<typeof findMatchingCustomer>[1]
): HelpyCrmCustomer | null {
  hydrateFromSession();
  const match = findMatchingCustomer([...customers.values()], input);
  return match ? structuredClone(match) : null;
}

/** Liefert stabile Referenz aus dem Store — nur für Snapshot-Reads. */
export function peekCrmCustomerByMatch(
  input: Parameters<typeof findMatchingCustomer>[1]
): HelpyCrmCustomer | null {
  hydrateFromSession();
  return findMatchingCustomer([...customers.values()], input) ?? null;
}

function crmCustomerFingerprint(customer: HelpyCrmCustomer): string {
  const { updatedAt, lastContactAt, ...rest } = customer;
  return JSON.stringify(rest);
}

export function upsertCrmCustomer(incoming: HelpyCrmCustomer): HelpyCrmCustomer {
  hydrateFromSession();

  const existing = findMatchingCustomer([...customers.values()], {
    email: incoming.email,
    telefon: incoming.telefon,
    firma: incoming.firma,
    ansprechpartner: incoming.ansprechpartner,
  });

  let merged: HelpyCrmCustomer;

  if (existing) {
    merged = mergeCrmCustomers(existing, {
      ...incoming,
      id: existing.id,
      createdAt: existing.createdAt,
      status: "bestandskunde",
    });

    if (existing.id !== incoming.id) {
      customers.delete(incoming.id);
    }

    if (crmCustomerFingerprint(existing) === crmCustomerFingerprint(merged)) {
      return structuredClone(existing);
    }
  } else {
    merged = structuredClone(incoming);
  }

  customers.set(merged.id, merged);
  persistToSession();
  notify();
  return structuredClone(merged);
}

export function clearCrmStore(): void {
  customers = new Map();
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
  notify();
}
