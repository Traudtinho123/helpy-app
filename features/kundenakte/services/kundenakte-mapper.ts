import type { Customer } from "@/features/customers/mock/mock-customers";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";
import { normalizeEmail } from "@/features/crm/services/crm-merge";

function buildInitials(value: string): string {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const logoColors = [
  "bg-[#2563EB]",
  "bg-[#7C3AED]",
  "bg-[#059669]",
  "bg-[#DC2626]",
  "bg-[#D97706]",
];

function pickLogoColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) % logoColors.length;
  }
  return logoColors[hash] ?? logoColors[0];
}

export function kundenakteToCustomer(record: Kundenakte): Customer {
  return {
    id: record.id,
    company: record.firma,
    logoInitials: buildInitials(record.firma || record.name),
    logoColor: pickLogoColor(record.id),
    contactPerson: record.name,
    role: record.skillLabel.replace(/^HELPY\s+/i, ""),
    phone: record.telefon,
    email: record.email,
    address: record.adresse,
    notes: record.zusammenfassung,
    tags: [record.quelle, record.skillLabel],
    status: record.isKnownCustomer ? "bestandskunde" : "neu",
    lastActivity: record.letzterKontakt,
    lastActivityLabel: record.letzterKontaktLabel,
    timeline: [
      {
        id: `kundenakte-email-${record.id}`,
        type: "email",
        title: record.betreff,
        description: record.zusammenfassung,
        date: record.letzterKontaktLabel,
      },
      {
        id: `kundenakte-confirmed-${record.id}`,
        type: "email",
        title: "Kundenakte bestätigt",
        description: "Kundenakte wurde bestätigt.",
        date: record.letzterKontaktLabel,
      },
    ],
    helpy: {
      emailCount: 1,
      offerCount: 0,
      invoiceCount: 0,
      lastContactDays: 0,
      impression: record.isKnownCustomer
        ? "Bekannter Kunde aus Gmail-Vorgang."
        : "Neuer Kontakt aus Gmail-Vorgang.",
      recommendation: "Kundenakte prüfen und bei Bedarf ergänzen.",
    },
  };
}

export function mergeCustomersWithConfirmedKundenakten(
  mockCustomers: Customer[],
  confirmed: Kundenakte[]
): Customer[] {
  const confirmedCustomers = confirmed.map(kundenakteToCustomer);
  const confirmedEmails = new Set(
    confirmedCustomers
      .map((customer) => normalizeEmail(customer.email))
      .filter(Boolean)
  );

  const remainingMock = mockCustomers.filter(
    (customer) => !confirmedEmails.has(normalizeEmail(customer.email))
  );

  return [...confirmedCustomers, ...remainingMock];
}
