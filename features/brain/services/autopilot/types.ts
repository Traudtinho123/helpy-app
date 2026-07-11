export type VorgangTyp =
  | "aufgabe"
  | "angebot"
  | "termin"
  | "rechnung"
  | "nachricht";

export type VorgangPrioritaet = "hoch" | "mittel" | "niedrig";

export type VorgangStatus =
  | "vorbereitet"
  | "in_bearbeitung"
  | "erledigt"
  | "geoeffnet";

export type AutopilotEmail = {
  id: string;
  absender: string;
  betreff: string;
  receivedAt: string;
  vorgangId?: string;
};

export type PreparedVorgang = {
  id: string;
  typ: VorgangTyp;
  absender: string;
  kunde: string;
  zusammenfassung: string;
  prioritaet: VorgangPrioritaet;
  status: VorgangStatus;
  helpyEmpfehlung: string;
  emailId: string;
};

export type VorgangSummary = {
  typ: VorgangTyp;
  label: string;
  count: number;
};

export type ActivityTimelineEntry = {
  id: string;
  time: string;
  label: string;
};

export type AutopilotRunStatus = "idle" | "running" | "completed";

export type AutopilotRunState = {
  status: AutopilotRunStatus;
  totalEmails: number;
  relevantVorgaenge: number;
  scannedCount: number;
  visibleVorgangIds: string[];
  vorgaenge: PreparedVorgang[];
  summary: VorgangSummary[];
  timeline: ActivityTimelineEntry[];
  panelMessage: string;
  panelRecommendation: string;
};

export type AutopilotRunOptions = {
  stepDelayMs?: number;
  onUpdate?: (state: AutopilotRunState) => void;
};

export type VorgangActionType =
  | "als_erledigt"
  | "zur_aufgabe"
  | "angebot_oeffnen"
  | "angebot_vorbereiten"
  | "termin_uebernehmen"
  | "kalender_oeffnen"
  | "rechnung_pruefen"
  | "antworten"
  | "archivieren";

export type AutopilotFeedback = {
  message: string;
  vorgangId?: string;
  type: "erledigt" | "oeffnen" | "info";
};
