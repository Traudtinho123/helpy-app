import type {
  TimelineEntryStatus,
  TimelineEntryType,
  TimelineFilter,
} from "@/features/customers/services/timeline/types";

export const TIMELINE_TYPE_CONFIG: Record<
  TimelineEntryType,
  { emoji: string; label: string; accent: string; bg: string }
> = {
  mail: { emoji: "📧", label: "Mail", accent: "text-[#2563EB]", bg: "bg-[#EFF6FF]" },
  termin: { emoji: "📅", label: "Termin", accent: "text-[#7C3AED]", bg: "bg-[#FAF5FF]" },
  angebot: { emoji: "📄", label: "Angebot", accent: "text-[#B45309]", bg: "bg-[#FFFBEB]" },
  dokument: { emoji: "📁", label: "Dokument", accent: "text-[#475569]", bg: "bg-[#F1F5F9]" },
  whatsapp: { emoji: "💬", label: "WhatsApp", accent: "text-[#047857]", bg: "bg-[#ECFDF5]" },
  immoscout24: { emoji: "🏡", label: "ImmoScout24.ch", accent: "text-[#DC2626]", bg: "bg-[#FEF2F2]" },
  website: { emoji: "🌐", label: "Website", accent: "text-[#2563EB]", bg: "bg-[#EFF6FF]" },
  telefon: { emoji: "📞", label: "Telefon", accent: "text-[#047857]", bg: "bg-[#ECFDF5]" },
  helpy: { emoji: "🤖", label: "HELPY Aktion", accent: "text-[#2563EB]", bg: "bg-[#EFF6FF]" },
  vertrag: { emoji: "✍️", label: "Vertrag", accent: "text-[#7C3AED]", bg: "bg-[#FAF5FF]" },
  rechnung: { emoji: "💰", label: "Rechnung", accent: "text-[#64748B]", bg: "bg-[#F8FAFC]" },
};

export const TIMELINE_FILTER_LABELS: Record<TimelineFilter, string> = {
  alle: "Alle",
  kommunikation: "Kommunikation",
  dokumente: "Dokumente",
  angebote: "Angebote",
  termine: "Termine",
  helpy: "HELPY",
};

export const TIMELINE_FILTERS: TimelineFilter[] = [
  "alle",
  "kommunikation",
  "dokumente",
  "angebote",
  "termine",
  "helpy",
];

export const TIMELINE_STATUS_LABELS: Record<TimelineEntryStatus, string> = {
  neu: "Neu",
  offen: "Offen",
  erledigt: "Erledigt",
  versendet: "Versendet",
  bestaetigt: "Bestätigt",
};

const KOMMUNIKATION_TYPES: TimelineEntryType[] = [
  "mail",
  "whatsapp",
  "telefon",
  "immoscout24",
  "website",
];

const DOKUMENTE_TYPES: TimelineEntryType[] = ["dokument", "vertrag"];

export function matchesTimelineFilter(
  type: TimelineEntryType,
  filter: TimelineFilter
): boolean {
  switch (filter) {
    case "alle":
      return true;
    case "kommunikation":
      return KOMMUNIKATION_TYPES.includes(type);
    case "dokumente":
      return DOKUMENTE_TYPES.includes(type);
    case "angebote":
      return type === "angebot";
    case "termine":
      return type === "termin";
    case "helpy":
      return type === "helpy";
    default:
      return true;
  }
}
