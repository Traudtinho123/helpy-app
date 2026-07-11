import type { ConnectEvent } from "@/features/platforms/services/connect/connector-types";
import type { BrainIntent, PreparedWorkItem } from "@/features/brain/services/brain-v2/types";
import { staticTimeFromIso } from "@/features/workspace/services/status/time-utils";

const MOCK_TODAY = "2026-07-07";

/** Zusätzliche Mock-Anreicherungen pro Event-ID (später: OpenAI Ergebnisse) */
export const MOCK_BRAIN_ENRICHMENTS: Record<
  string,
  Partial<Pick<PreparedWorkItem, "href" | "kundenAkteId" | "status">>
> = {
  "evt-1": {
    href: "/vorgang/weber-angebot",
    kundenAkteId: "1",
    status: "vorbereitet",
  },
  "evt-2": {
    href: "/immoscout24",
    kundenAkteId: "3",
    status: "vorbereitet",
  },
  "evt-3": {
    href: "/vorgang/weber-angebot",
    kundenAkteId: "1",
    status: "vorbereitet",
  },
  "evt-4": {
    href: "/posteingang",
    status: "vorbereitet",
  },
  "evt-5": {
    href: "/angebote",
    kundenAkteId: "5",
    status: "vorbereitet",
  },
  "evt-6": {
    href: "/vorgang/weber-angebot",
    kundenAkteId: "1",
    status: "vorbereitet",
  },
  "evt-7": {
    href: "/immoscout24",
    status: "vorbereitet",
  },
  "evt-8": {
    href: "/vorgang/finanzamt-steuer",
    status: "vorbereitet",
  },
  "evt-9": {
    href: "/vorgang/weber-angebot",
    kundenAkteId: "1",
    status: "vorbereitet",
  },
  "evt-10": {
    href: "/kalender",
    kundenAkteId: "4",
    status: "vorbereitet",
  },
};

/** Skill-Zuordnung pro Intent für Mock-Fälle ohne Connector-Skill */
export const INTENT_SKILL_HINTS: Partial<
  Record<BrainIntent, "real-estate" | "construction" | "consulting-legal">
> = {
  immobilienanfrage: "real-estate",
  besichtigung: "real-estate",
  offertanfrage: "construction",
  mandatsanfrage: "consulting-legal",
  frist: "consulting-legal",
};

export function getMockEnrichment(
  eventId: string
): Partial<Pick<PreparedWorkItem, "href" | "kundenAkteId" | "status">> {
  return MOCK_BRAIN_ENRICHMENTS[eventId] ?? { status: "vorbereitet" };
}

export function formatReceivedLabel(iso: string): string {
  const dateMatch = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  const datePart = dateMatch?.[1] ?? MOCK_TODAY;
  const time = staticTimeFromIso(iso);

  if (datePart === MOCK_TODAY) return `Heute, ${time}`;

  const parts = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return time;

  return `${parts[3]}.${parts[2]}., ${time}`;
}

export function resolvePlatformName(
  connectorId: ConnectEvent["connector"],
  connectors: { id: string; name: string }[]
): string {
  return connectors.find((c) => c.id === connectorId)?.name ?? connectorId;
}
