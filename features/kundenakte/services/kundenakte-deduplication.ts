import {
  buildCrmCustomerId,
  normalizeEmail,
  normalizePhone,
  normalizeText,
} from "@/features/crm/services/crm-merge";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";

const EMPTY_VALUES = new Set(["—", "-", "unbekannt", ""]);

function isUsable(value?: string): boolean {
  const normalized = normalizeText(value);
  return normalized.length > 0 && !EMPTY_VALUES.has(normalized);
}

export function buildKundenakteMatchKey(input: {
  email?: string;
  firma?: string;
  name?: string;
}): string {
  return buildCrmCustomerId({
    email: input.email,
    firma: input.firma,
    ansprechpartner: input.name,
  });
}

export function findMatchingKundenakte(
  records: Kundenakte[],
  input: { email?: string; firma?: string; name?: string }
): Kundenakte | null {
  const email = normalizeEmail(input.email);
  const company = normalizeText(input.firma);
  const name = normalizeText(input.name);

  if (email) {
    const match = records.find(
      (record) => normalizeEmail(record.email) === email
    );
    if (match) return match;
  }

  if (isUsable(input.firma) && company.length >= 3) {
    const match = records.find(
      (record) => normalizeText(record.firma) === company
    );
    if (match) return match;
  }

  if (isUsable(input.name) && name.length >= 3) {
    const match = records.find(
      (record) => normalizeText(record.name) === name
    );
    if (match) return match;
  }

  const phone = normalizePhone(input.email);
  if (phone.length >= 6) {
    const match = records.find(
      (record) => normalizePhone(record.telefon) === phone
    );
    if (match) return match;
  }

  return null;
}

export function isSameKundenakteContact(
  left: Pick<Kundenakte, "email" | "firma" | "name">,
  right: Pick<Kundenakte, "email" | "firma" | "name">
): boolean {
  const leftEmail = normalizeEmail(left.email);
  const rightEmail = normalizeEmail(right.email);
  if (leftEmail && rightEmail && leftEmail === rightEmail) return true;

  const leftFirma = normalizeText(left.firma);
  const rightFirma = normalizeText(right.firma);
  if (leftFirma.length >= 3 && leftFirma === rightFirma) return true;

  const leftName = normalizeText(left.name);
  const rightName = normalizeText(right.name);
  return leftName.length >= 3 && leftName === rightName;
}
