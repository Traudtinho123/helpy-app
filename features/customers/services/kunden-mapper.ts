import type { Customer, CustomerStatus } from "@/features/customers/mock/mock-customers";
import type {
  CreateKundeInput,
  KundeDbStatus,
  KundeRecord,
} from "@/features/customers/types/kunden-db-types";

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
  "bg-[#6366F1]",
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

function mapDbStatusToCustomerStatus(status: KundeDbStatus): CustomerStatus {
  switch (status) {
    case "aktiv":
      return "aktiv";
    case "bestandskunde":
      return "bestandskunde";
    default:
      return "interessent";
  }
}

export function buildAnsprechpartner(input: CreateKundeInput): string {
  return `${input.vorname.trim()} ${input.nachname.trim()}`.trim();
}

export function buildFirmenname(input: CreateKundeInput): string {
  const firma = input.firma?.trim();
  if (firma) return firma;
  const name = buildAnsprechpartner(input);
  return name || "Privatkunde";
}

export function createKundeInputToDbPayload(
  input: CreateKundeInput,
  context: { userId: string; companyId: string }
): Omit<KundeRecord, "id" | "erstellt_am"> {
  return {
    user_id: context.userId,
    company_id: context.companyId,
    firmenname: buildFirmenname(input),
    ansprechpartner: buildAnsprechpartner(input),
    email: input.email?.trim() || null,
    telefon: input.telefon?.trim() || null,
    adresse: input.adresse?.trim() || null,
    notizen: input.notizen?.trim() || null,
    status: input.status ?? "interessent",
  };
}

export function kundeRecordToCustomer(record: KundeRecord): Customer {
  const contact =
    record.ansprechpartner?.trim() || record.firmenname.trim() || "Unbekannt";
  const createdLabel = new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(record.erstellt_am));

  return {
    id: record.id,
    company: record.firmenname,
    logoInitials: buildInitials(record.firmenname || contact),
    logoColor: pickLogoColor(record.id),
    contactPerson: contact,
    role: "Kontakt",
    phone: record.telefon ?? "—",
    email: record.email ?? "—",
    address: record.adresse ?? "—",
    notes: record.notizen ?? "",
    tags: ["Datenbank"],
    status: mapDbStatusToCustomerStatus(record.status),
    lastActivity: record.erstellt_am,
    lastActivityLabel: createdLabel,
    timeline: [],
    helpy: {
      emailCount: 0,
      offerCount: 0,
      invoiceCount: 0,
      lastContactDays: 0,
      impression: "Kunde im HELPY-Stamm angelegt.",
      recommendation: "Kontaktdaten prüfen und erste Aktivität dokumentieren.",
    },
  };
}
