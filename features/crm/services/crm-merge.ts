import type {
  CrmMatchInput,
  HelpyCrmCustomer,
} from "@/features/crm/types/crm-types";

const EMPTY_VALUES = new Set(["—", "-", "unbekannt", ""]);

export function normalizeEmail(email?: string): string {
  return (email ?? "").trim().toLowerCase();
}

export function normalizePhone(phone?: string): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function normalizeText(value?: string): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-zäöüß0-9\s&.-]/g, "");
}

function isUsable(value?: string): boolean {
  const normalized = normalizeText(value);
  return normalized.length > 0 && !EMPTY_VALUES.has(normalized);
}

export function buildCrmCustomerId(input: CrmMatchInput): string {
  const email = normalizeEmail(input.email);
  if (email) return `crm-${email}`;

  const phone = normalizePhone(input.telefon);
  if (phone.length >= 6) return `crm-phone-${phone}`;

  const company = normalizeText(input.firma).replace(/\s+/g, "-");
  if (company.length >= 2) return `crm-company-${company}`;

  const name = normalizeText(input.ansprechpartner).replace(/\s+/g, "-");
  if (name.length >= 2) return `crm-name-${name}`;

  return `crm-unknown-${Date.now()}`;
}

export function findMatchingCustomer(
  customers: HelpyCrmCustomer[],
  input: CrmMatchInput
): HelpyCrmCustomer | null {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.telefon);
  const company = normalizeText(input.firma);
  const name = normalizeText(input.ansprechpartner);

  if (email) {
    const match = customers.find(
      (customer) => normalizeEmail(customer.email) === email
    );
    if (match) return match;
  }

  if (phone.length >= 6) {
    const match = customers.find(
      (customer) => normalizePhone(customer.telefon) === phone
    );
    if (match) return match;
  }

  if (isUsable(input.firma) && company.length >= 3) {
    const match = customers.find(
      (customer) => normalizeText(customer.firma) === company
    );
    if (match) return match;
  }

  if (isUsable(input.ansprechpartner) && name.length >= 3) {
    const match = customers.find(
      (customer) => normalizeText(customer.ansprechpartner) === name
    );
    if (match) return match;
  }

  return null;
}

function mergeUniqueById<T extends { id: string }>(left: T[], right: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of [...left, ...right]) {
    map.set(item.id, item);
  }
  return [...map.values()];
}

function mergeNotes(left: string[], right: string[]): string[] {
  return [...new Set([...left, ...right].filter(Boolean))];
}

function preferValue(
  incoming: string,
  existing: string,
  emptyValues = EMPTY_VALUES
): string {
  const normalizedIncoming = incoming.trim();
  if (normalizedIncoming && !emptyValues.has(normalizedIncoming.toLowerCase())) {
    return normalizedIncoming;
  }
  return existing;
}

export function mergeCrmCustomers(
  existing: HelpyCrmCustomer,
  incoming: HelpyCrmCustomer
): HelpyCrmCustomer {
  const now = new Date().toISOString();

  return {
    ...existing,
    ansprechpartner: preferValue(incoming.ansprechpartner, existing.ansprechpartner),
    firma: preferValue(incoming.firma, existing.firma),
    email: preferValue(incoming.email, existing.email),
    telefon: preferValue(incoming.telefon, existing.telefon),
    adresse: preferValue(incoming.adresse, existing.adresse),
    branche: preferValue(incoming.branche, existing.branche),
    skill: incoming.skill || existing.skill,
    status:
      existing.status === "bestandskunde" || incoming.status === "bestandskunde"
        ? "bestandskunde"
        : "neu",
    notes: mergeNotes(existing.notes, incoming.notes),
    projects: mergeUniqueById(existing.projects, incoming.projects),
    offers: mergeUniqueById(existing.offers, incoming.offers),
    invoices: mergeUniqueById(existing.invoices, incoming.invoices),
    appointments: mergeUniqueById(existing.appointments, incoming.appointments),
    documents: mergeUniqueById(existing.documents, incoming.documents),
    timeline: mergeUniqueById(existing.timeline, incoming.timeline).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    vorgangIds: [
      ...new Set([...existing.vorgangIds, ...incoming.vorgangIds]),
    ],
    updatedAt: now,
    lastContactAt: now,
  };
}
