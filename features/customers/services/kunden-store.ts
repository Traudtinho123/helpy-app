import type { Customer } from "@/features/customers/mock/mock-customers";
import { normalizeEmail, normalizePhone } from "@/features/crm/services/crm-merge";
import { getAllKundenakten } from "@/features/kundenakte/services/kundenakte-store";
import { kundenakteToCustomer } from "@/features/kundenakte/services/kundenakte-mapper";

const listeners = new Set<() => void>();

let dbCustomers: Customer[] = [];
let loaded = false;

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeDbKunden(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDbKundenCustomers(): Customer[] {
  return [...dbCustomers];
}

export function setDbKundenCustomers(customers: Customer[]): void {
  dbCustomers = [...customers];
  loaded = true;
  notify();
}

export function prependDbKundeCustomer(customer: Customer): void {
  dbCustomers = [
    customer,
    ...dbCustomers.filter((item) => item.id !== customer.id),
  ];
  loaded = true;
  notify();
}

export function isDbKundenLoaded(): boolean {
  return loaded;
}

export function findDbCustomerByPhone(phone?: string | null): Customer | null {
  const normalized = normalizePhone(phone ?? "");
  if (normalized.length < 6) return null;

  const fromDb = dbCustomers.find(
    (customer) => normalizePhone(customer.phone) === normalized
  );
  if (fromDb) return fromDb;

  const kundenakte = getAllKundenakten().find(
    (record) => normalizePhone(record.telefon) === normalized
  );
  return kundenakte ? kundenakteToCustomer(kundenakte) : null;
}

export function findDbCustomerByEmail(email?: string | null): Customer | null {
  const normalized = normalizeEmail(email ?? undefined);
  if (!normalized) return null;
  return (
    dbCustomers.find(
      (customer) => normalizeEmail(customer.email) === normalized
    ) ?? null
  );
}

export function mergeDbCustomersWithBase(
  baseCustomers: Customer[],
  dbItems: Customer[]
): Customer[] {
  if (dbItems.length === 0) return baseCustomers;

  const dbEmails = new Set(
    dbItems.map((item) => normalizeEmail(item.email)).filter(Boolean)
  );
  const dbPhones = new Set(
    dbItems.map((item) => normalizePhone(item.phone)).filter(Boolean)
  );

  const remaining = baseCustomers.filter((item) => {
    const email = normalizeEmail(item.email);
    const phone = normalizePhone(item.phone);
    if (email && dbEmails.has(email)) return false;
    if (phone.length >= 6 && dbPhones.has(phone)) return false;
    return true;
  });

  return [...dbItems, ...remaining];
}
