/** Fachliche Kategorie einer Integration. */
export type IntegrationCategory =
  | "email"
  | "kalender"
  | "immobilien"
  | "sozial-media"
  | "kommunikation"
  | "formulare"
  | "dokumente"
  | "buchhaltung"
  | "finanzen"
  | "sap";

/** Nutzer-sichtbarer Verbindungsstatus. */
export type IntegrationStatus =
  | "verbunden"
  | "nicht_verbunden"
  | "verbindung_pruefen"
  | "fehler"
  | "bald_verfuegbar";

/** Betriebszustand der Integration. */
export type IntegrationHealth = "online" | "warnung" | "offline";

/** Intern — Zugriffstoken (UI: „Zugriff gültig“). */
export type IntegrationTokenStatus = "gueltig" | "abgelaufen" | "fehlt";

export type IntegrationRecord = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: IntegrationCategory;
  provider: string;
  status: IntegrationStatus;
  connected: boolean;
  accountEmail: string | null;
  /** Anzeige-Label, z. B. „vor 2 Minuten“ */
  lastSync: string | null;
  tokenStatus: IntegrationTokenStatus;
  eventsToday: number;
  health: IntegrationHealth;
  errorMessage: string | null;
  enabledFeatures: string[];
  /** Intern — Event Bus aktiv */
  eventBusActive: boolean;
  /** Intern — HELPY-Verarbeitung aktiv */
  helpyProcessingActive: boolean;
  /** Optionaler Erkennungsmodus für E-Mail-basierte Plattformen */
  detectionStatusLabel?: string | null;
  /** Hinweistext zur Erkennung über verbundene E-Mails */
  detectionHint?: string | null;
};

export type IntegrationSummary = {
  connectedCount: number;
  eventsTodayTotal: number;
  warningCount: number;
  nextRecommended: IntegrationRecord | null;
};

export type IntegrationAction =
  | "connect"
  | "sync"
  | "check"
  | "reconnect"
  | "disconnect";
