export type BrainPrioritaet = "hoch" | "mittel" | "niedrig";

export type BrainEmailInput = {
  id?: string;
  betreff?: string;
  absender: string;
  absenderEmail?: string;
  empfaenger?: string;
  inhalt: string;
  erhaltenAm?: string;
};

export type ErkannteAufgabe = {
  beschreibung: string;
  prioritaet: BrainPrioritaet;
  quelle?: string;
};

export type ErkannteTermin = {
  titel: string;
  datum?: string;
  uhrzeit?: string;
  frist?: string;
  typ: "deadline" | "termin" | "besichtigung" | "telefonat";
};

export type ErkanntesAngebot = {
  titel: string;
  positionen: string[];
  menge?: number;
  deadline?: string;
  kategorie: "angebotsanfrage" | "nachfrage" | "bestellung";
};

export type EmailAnalysisResult = {
  zusammenfassung: string;
  prioritaet: BrainPrioritaet;
  erkannteAufgaben: ErkannteAufgabe[];
  erkannteTermine: ErkannteTermin[];
  erkannteAngebote: ErkanntesAngebot[];
  empfohleneAktion: string;
  antwortEntwurf: string;
  helpyNachricht: string;
  analysiertAm: string;
};

export type TaskDetectionResult = {
  aufgaben: ErkannteAufgabe[];
};

export type OfferDetectionResult = {
  angebote: ErkanntesAngebot[];
  istAngebotsanfrage: boolean;
};

export type CalendarDetectionResult = {
  termine: ErkannteTermin[];
  deadlines: ErkannteTermin[];
};

export type EmailAnalyzerContext = {
  aufgaben: ErkannteAufgabe[];
  angebote: ErkanntesAngebot[];
  termine: ErkannteTermin[];
  istAngebotsanfrage: boolean;
  deadlines: ErkannteTermin[];
};

// ---------------------------------------------------------------------------
// HELPY Brain v0.3 — Tagesplanung
// ---------------------------------------------------------------------------

export type WorkdayItemCategory =
  | "angebot"
  | "email"
  | "termin"
  | "aufgabe"
  | "behoerde"
  | "kunde";

export type Kundentyp =
  | "bestandskunde"
  | "interessent"
  | "neu"
  | "behoerde";

export type WorkdayPriorityLevel = "kritisch" | "hoch" | "mittel" | "niedrig";

export type WorkdayInputItem = {
  id: string;
  titel: string;
  kategorie: WorkdayItemCategory;
  kategorieLabel: string;
  deadline?: string;
  /** 0–100 — je höher, desto dringender die Frist */
  deadlineDringlichkeit: number;
  dringlichkeit: BrainPrioritaet;
  angebotswert?: number;
  kundentyp: Kundentyp;
  wartezeitTage: number;
  terminbezug?: string;
  empfohleneAktion: string;
  priorisierungsGrund: string;
  href?: string;
  absender?: string;
  prioritaet?: WorkdayPriorityLevel;
  prioritaetLabel?: string;
};

export type PrioritizedWorkdayItem = WorkdayInputItem & {
  rang: number;
};

export type PriorityScoreBreakdown = {
  item: WorkdayInputItem;
  score: number;
};

export type DailyPlanStatusMetric = {
  label: string;
  value: number;
};

export type DailyPlan = {
  greeting: string;
  summary: string;
  prioritizedItems: PrioritizedWorkdayItem[];
  wichtigsteAufgabe: PrioritizedWorkdayItem;
  helpyRecommendation: string;
  nextBestAction: string;
  statusMetrics: DailyPlanStatusMetric[];
  progressPercent: number;
  progressMessage: string;
  userName: string;
};

export type GenerateDailyPlanOptions = {
  userName?: string;
  /** Simulierte Verarbeitungszeit in ms (v0.3 Mock) */
  delayMs?: number;
};

