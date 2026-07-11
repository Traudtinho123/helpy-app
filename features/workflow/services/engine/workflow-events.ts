import type {
  PlatformSource,
  WorkflowTriggerEvent,
  WorkflowTriggerType,
} from "@/features/workflow/services/engine/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export const PLATFORM_LABELS: Record<PlatformSource, string> = {
  gmail: "Gmail",
  outlook: "Outlook",
  immoscout24: "ImmoScout24.ch",
  "website-formular": "Website-Formular",
  kalender: "Kalender",
  kontaktformular: "Kontaktformular",
};

export const TRIGGER_LABELS: Record<WorkflowTriggerType, string> = {
  "immoscout-anfrage": "Neue ImmoScout24.ch Anfrage",
  offertanfrage: "Neue Offertanfrage",
  mandatsanfrage: "Neue Mandats- oder Beratungsanfrage",
};

export type WorkflowEventInput = {
  id: string;
  source: PlatformSource;
  triggerType: WorkflowTriggerType;
  skill: HelpySkill;
  receivedAt: string;
  absender: string;
  zusammenfassung: string;
};

export function createWorkflowTriggerEvent(
  input: WorkflowEventInput
): WorkflowTriggerEvent {
  return {
    ...input,
    rawLabel: `${TRIGGER_LABELS[input.triggerType]} · ${PLATFORM_LABELS[input.source]}`,
  };
}

export function formatConnectPipeline(source: PlatformSource): string {
  return `${PLATFORM_LABELS[source]} → HELPY Connect → HELPY Brain → Workflow Engine`;
}
