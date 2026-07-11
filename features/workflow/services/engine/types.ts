import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

/** Plattform-Eingänge über HELPY Connect. */
export type PlatformSource =
  | "gmail"
  | "outlook"
  | "immoscout24"
  | "website-formular"
  | "kalender"
  | "kontaktformular";

export type WorkflowTriggerType =
  | "immoscout-anfrage"
  | "offertanfrage"
  | "mandatsanfrage";

export type WorkflowStepId =
  | "interessent_erkennen"
  | "interessent_anlegen"
  | "besichtigung_erkennen"
  | "termin_vorbereiten"
  | "expose_vorbereiten"
  | "kunde_erkennen"
  | "kunde_anlegen"
  | "baustelle_anlegen"
  | "vor_ort_termin_vorbereiten"
  | "offerte_vorbereiten"
  | "materialliste_vorbereiten"
  | "mandant_erkennen"
  | "akte_anlegen"
  | "frist_erkennen"
  | "erstgespraech_vorbereiten"
  | "dokumente_sammeln"
  | "aufgabe_erstellen"
  | "workspace_vorbereiten";

export type WorkflowResultStatus =
  | "vorbereitet"
  | "in_bearbeitung"
  | "erledigt";

export type WorkflowEnginePhase =
  | "idle"
  | "connecting"
  | "analyzing"
  | "preparing"
  | "ready";

export type WorkflowTriggerEvent = {
  id: string;
  source: PlatformSource;
  triggerType: WorkflowTriggerType;
  skill: HelpySkill;
  receivedAt: string;
  absender: string;
  zusammenfassung: string;
  rawLabel: string;
};

export type WorkflowKunde = {
  name: string;
  ansprechpartner: string;
  email?: string;
  telefon?: string;
  status: "neu" | "bestehend" | "interessent";
};

export type WorkflowVorgangRef = {
  id: string;
  titel: string;
  href: string;
};

export type WorkflowPreparedAction = {
  id: string;
  label: string;
  beschreibung: string;
  erledigt: boolean;
};

export type WorkflowCreatedObject = {
  id: string;
  typ:
    | "interessent"
    | "kunde"
    | "baustelle"
    | "termin"
    | "expose"
    | "offerte"
    | "materialliste"
    | "mandant"
    | "akte"
    | "frist"
    | "dokument"
    | "aufgabe"
    | "workspace";
  label: string;
  detail?: string;
};

export type WorkflowResultActionType =
  | "vorgang_oeffnen"
  | "offerte_oeffnen"
  | "frist_pruefen"
  | "als_erledigt";

export type WorkflowResultAction = {
  id: string;
  label: string;
  type: WorkflowResultActionType;
  href?: string;
};

export type WorkflowResult = {
  workflowId: string;
  skill: HelpySkill;
  trigger: WorkflowTriggerEvent;
  kunde: WorkflowKunde;
  vorgang: WorkflowVorgangRef;
  vorbereiteteAktionen: WorkflowPreparedAction[];
  erstellteObjekte: WorkflowCreatedObject[];
  naechsterSchritt: string;
  helpyNachricht: string;
  status: WorkflowResultStatus;
  titel: string;
  emoji: string;
  zusammenfassung: string;
  actions: WorkflowResultAction[];
};

export type WorkflowDefinition = {
  id: string;
  skill: HelpySkill;
  triggerType: WorkflowTriggerType;
  label: string;
  steps: WorkflowStepId[];
  vorgangId: string;
  vorgangTitel: string;
  resultTitel: string;
  resultEmoji: string;
  resultZusammenfassung: string;
  helpyNachricht: string;
  naechsterSchritt: string;
  actions: WorkflowResultAction[];
};

export type WorkflowEngineState = {
  phase: WorkflowEnginePhase;
  visibleResultIds: string[];
  results: WorkflowResult[];
  currentStepLabel: string;
  panelMessage: string;
  panelRecommendation: string;
};

export type WorkflowRunnerOptions = {
  stepDelayMs?: number;
  resultRevealDelayMs?: number;
  onUpdate?: (state: WorkflowEngineState) => void;
};

export type WorkflowEngineOptions = WorkflowRunnerOptions & {
  skill?: HelpySkill;
};
