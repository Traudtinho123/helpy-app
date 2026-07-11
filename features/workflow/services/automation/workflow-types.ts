import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

/** Auslöser — verständlich für Nutzer, ohne Fachbegriffe. */
export type WorkflowTrigger =
  | "neue-email"
  | "neue-immoscout-anfrage"
  | "neues-kontaktformular"
  | "neue-offerte"
  | "neuer-termin"
  | "neue-whatsapp-nachricht"
  | "neue-frist";

export const WORKFLOW_TRIGGER_LABELS: Record<WorkflowTrigger, string> = {
  "neue-email": "Neue E-Mail",
  "neue-immoscout-anfrage": "Neue ImmoScout Anfrage",
  "neues-kontaktformular": "Neues Kontaktformular",
  "neue-offerte": "Neue Offerte",
  "neuer-termin": "Neuer Termin",
  "neue-whatsapp-nachricht": "Neue WhatsApp Nachricht",
  "neue-frist": "Neue Frist",
};

/** Status eines Schritts im Arbeitsablauf — Prüfen-und-Bestätigen-Modus. */
export type WorkflowStepStatus =
  | "erkannt"
  | "vorbereitet"
  | "in-pruefung"
  | "bestaetigt"
  | "erledigt";

export const WORKFLOW_STEP_STATUS_LABELS: Record<WorkflowStepStatus, string> = {
  erkannt: "Erkannt",
  vorbereitet: "Vorbereitet",
  "in-pruefung": "In Prüfung",
  bestaetigt: "Bestätigt",
  erledigt: "Erledigt",
};

/**
 * Vorbereitete Aktion — erweiterbar für Dokumente, Kalender, E-Mail, …
 * Später: echte Erzeugung über Connect / Document Engine.
 */
export type PreparedActionKind =
  | "dokument"
  | "kalender"
  | "email"
  | "angebot"
  | "rechnung"
  | "crm"
  | "allgemein";

export type WorkflowPreparedAction = {
  kind: PreparedActionKind;
  label: string;
  hint?: string;
};

export type WorkflowStepTemplate = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  dependsOn: string[];
  preparedAction: WorkflowPreparedAction;
  reviewLabel?: "pruefen" | "bestaetigen";
};

export type WorkflowStep = WorkflowStepTemplate & {
  status: WorkflowStepStatus;
  completed: boolean;
};

export type WorkflowTemplate = {
  id: string;
  name: string;
  skill: HelpySkill;
  trigger: WorkflowTrigger;
  steps: WorkflowStepTemplate[];
};

/** Laufender Arbeitsablauf zu einem Vorgang. */
export type WorkflowInstance = {
  id: string;
  templateId: string;
  name: string;
  skill: HelpySkill;
  trigger: WorkflowTrigger;
  vorgangId: string;
  steps: WorkflowStep[];
  createdAt: string;
};

export type WorkflowProgress = {
  preparedCount: number;
  totalCount: number;
  completedCount: number;
  nextStepTitle: string | null;
  nextStepDescription: string | null;
  progressLabel: string;
};

export type WorkflowPanelSummary = {
  intro: string;
  nextStep: string;
  progress: WorkflowProgress;
};

export type ResolveWorkflowInput = {
  vorgangId: string;
  skill: HelpySkill;
  intent?: string;
  typ?: string;
  sourceEventId?: string;
  titel?: string;
};

export type ConfirmStepResult = {
  success: boolean;
  helpyMessage: string;
  progress: WorkflowProgress;
};
