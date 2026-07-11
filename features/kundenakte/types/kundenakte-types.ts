import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type KundenakteStatus = "vorbereitet" | "bearbeitet" | "bestaetigt";

export type Kundenakte = {
  id: string;
  vorgangId: string;
  name: string;
  firma: string;
  email: string;
  telefon: string;
  adresse: string;
  quelle: string;
  skill: HelpySkill;
  skillLabel: string;
  letzterKontakt: string;
  letzterKontaktLabel: string;
  betreff: string;
  zusammenfassung: string;
  status: KundenakteStatus;
  statusLabel: string;
  isKnownCustomer: boolean;
  helpyHint: string;
};

export type KundenakteTimelineEntry = {
  id: string;
  kundenakteId: string;
  vorgangId: string;
  at: string;
  label: string;
  detail: string;
};

export const KUNDENAKTE_STATUS_LABELS: Record<KundenakteStatus, string> = {
  vorbereitet: "Von HELPY vorbereitet",
  bearbeitet: "Bearbeitet",
  bestaetigt: "Kundenakte bestätigt",
};
