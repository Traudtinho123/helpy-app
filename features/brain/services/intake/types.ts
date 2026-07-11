export type IntakeEventType =
  | "email"
  | "formular"
  | "termin"
  | "angebot"
  | "rechnung";

export type IntakePhase =
  | "monitoring"
  | "detecting"
  | "waiting"
  | "processing"
  | "ready";

export type IntakeVorgangTyp =
  | "aufgabe"
  | "angebot"
  | "termin"
  | "rechnung"
  | "formularanfrage";

export type IntakeVorgangStatus =
  | "vorbereitet"
  | "in_bearbeitung"
  | "erledigt"
  | "geoeffnet";

export type IntakeVorgangPrioritaet = "hoch" | "mittel" | "niedrig";

export type IntakeEvent = {
  id: string;
  type: IntakeEventType;
  label: string;
  source: string;
  detectedAt: string;
};

export type IntakeVorgang = {
  id: string;
  typ: IntakeVorgangTyp;
  absender: string;
  kunde: string;
  zusammenfassung: string;
  prioritaet: IntakeVorgangPrioritaet;
  status: IntakeVorgangStatus;
  helpyEmpfehlung: string;
  intakeEventId: string;
};

export type IntakeTimelineEntry = {
  id: string;
  time: string;
  label: string;
};

export type IntakeSummary = {
  typ: IntakeVorgangTyp;
  label: string;
  count: number;
};

export type IntakeVorgangActionType =
  | "als_erledigt"
  | "zur_aufgabe"
  | "angebot_oeffnen"
  | "angebot_vorbereiten"
  | "termin_uebernehmen"
  | "kalender_oeffnen"
  | "rechnung_pruefen"
  | "kundenanfrage_oeffnen"
  | "kunde_anlegen";

export type IntakeFeedback = {
  message: string;
  vorgangId?: string;
};

export type IntakeState = {
  phase: IntakePhase;
  visibleDetectionIds: string[];
  visibleVorgangIds: string[];
  detections: IntakeEvent[];
  vorgaenge: IntakeVorgang[];
  summary: IntakeSummary[];
  timeline: IntakeTimelineEntry[];
  panelTitle: string;
  panelMessage: string;
  panelRecommendation: string;
  currentDetectionLabel: string;
};

export type IntakeProcessorOptions = {
  detectionDelayMs?: number;
  waitBeforeVorgaengeMs?: number;
  vorgangRevealDelayMs?: number;
  onUpdate?: (state: IntakeState) => void;
};
