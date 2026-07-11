import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type DecisionPriority = "kritisch" | "hoch" | "mittel" | "niedrig";

export type DecisionKundenstatus =
  | "neu"
  | "bestehend"
  | "interessent"
  | "mandant"
  | "unbekannt";

export type DecisionSignalCategory =
  | "prioritaet"
  | "kundenstatus"
  | "skill"
  | "plattform"
  | "dokumente"
  | "fristen"
  | "kalender"
  | "bestehende-vorgaenge";

export type DecisionSignal = {
  category: DecisionSignalCategory;
  label: string;
  value: string;
  weight: number;
};

export type DecisionContext = {
  vorgangId: string;
  skill: HelpySkill;
  titel: string;
  kunde: string;
  plattform: string;
  prioritaet: DecisionPriority;
  kundenstatus: DecisionKundenstatus;
  intent?: string;
  sourceEventId?: string;
  hasDokumente: boolean;
  hasFrist: boolean;
  hasKalenderBezug: boolean;
  bestehendeVorgaenge: number;
  erkanntePunkte: string[];
  signals: DecisionSignal[];
};

export type DecisionAction = {
  id: string;
  label: string;
  beschreibung: string;
};

export type DecisionDocument = {
  id: string;
  name: string;
  typ: string;
  status: "vorbereitet" | "fehlt" | "vorhanden";
};

export type DecisionResult = {
  id: string;
  vorgangId: string;
  /** Kurztext für „Meine Entscheidung“ */
  entscheidungSummary: string;
  warum: string;
  erkannt: string[];
  workflowName: string;
  workflowTemplateId: string;
  focusStepId: string;
  focusStepTitle: string;
  dokumente: DecisionDocument[];
  aktionen: DecisionAction[];
  automatischVorbereiten: string[];
  benoetigtBestaetigung: string[];
  createdAt: string;
};

export type DecisionEvaluation = {
  context: DecisionContext;
  result: DecisionResult;
};
