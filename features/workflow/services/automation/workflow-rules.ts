import type { ConnectEventType } from "@/features/platforms/services/connect/connector-types";
import { MOCK_CONNECT_EVENTS } from "@/features/platforms/services/connect/mock-events";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { WORKFLOW_TEMPLATES } from "@/features/workflow/services/automation/mock-workflows";
import type {
  ResolveWorkflowInput,
  WorkflowTemplate,
  WorkflowTrigger,
} from "@/features/workflow/services/automation/workflow-types";

const EVENT_TO_TRIGGER: Partial<Record<ConnectEventType, WorkflowTrigger>> = {
  "neue-email": "neue-email",
  "neue-immobilienanfrage": "neue-immoscout-anfrage",
  "neues-kontaktformular": "neues-kontaktformular",
  "neue-offertanfrage": "neue-offerte",
  "neuer-kalendereintrag": "neuer-termin",
  terminaenderung: "neuer-termin",
  "neue-whatsapp-nachricht": "neue-whatsapp-nachricht",
  "frist-erkannt": "neue-frist",
};

const INTENT_TRIGGER_BY_SKILL: Record<
  HelpySkill,
  Partial<Record<string, WorkflowTrigger>>
> = {
  "real-estate": {
    anfrage: "neue-immoscout-anfrage",
    immobilienanfrage: "neue-immoscout-anfrage",
    interessentenanfrage: "neue-immoscout-anfrage",
    besichtigung: "neue-immoscout-anfrage",
    terminwunsch: "neuer-termin",
    normale_nachricht: "neue-email",
  },
  construction: {
    anfrage: "neue-offerte",
    angebotsanfrage: "neue-offerte",
    offertanfrage: "neue-offerte",
    vor_ort_termin: "neuer-termin",
    materialanfrage: "neue-offerte",
    auftragsanfrage: "neue-offerte",
    rueckruf: "neue-whatsapp-nachricht",
    normale_nachricht: "neue-email",
  },
  "consulting-legal": {
    anfrage: "neues-kontaktformular",
    mandatsanfrage: "neues-kontaktformular",
    erstgespraech: "neuer-termin",
    frist: "neue-frist",
    terminwunsch: "neuer-termin",
    normale_nachricht: "neue-email",
  },
};

const DEFAULT_TRIGGER_BY_SKILL: Record<HelpySkill, WorkflowTrigger> = {
  "real-estate": "neue-immoscout-anfrage",
  construction: "neue-offerte",
  "consulting-legal": "neues-kontaktformular",
};

const PRIMARY_TEMPLATE_BY_SKILL: Record<HelpySkill, string> = {
  "real-estate": "wf-re-immobilienanfrage",
  construction: "wf-hw-offertanfrage",
  "consulting-legal": "wf-cl-mandatsanfrage",
};

export function resolveTriggerFromEventType(
  eventType: ConnectEventType
): WorkflowTrigger | null {
  return EVENT_TO_TRIGGER[eventType] ?? null;
}

export function resolveTriggerFromInput(input: ResolveWorkflowInput): WorkflowTrigger {
  if (input.sourceEventId) {
    const event = MOCK_CONNECT_EVENTS.find((item) => item.id === input.sourceEventId);
    if (event) {
      const trigger = resolveTriggerFromEventType(event.type);
      if (trigger) return trigger;
    }
  }

  const intent = input.intent ?? input.typ;
  if (intent) {
    const byIntent = INTENT_TRIGGER_BY_SKILL[input.skill][intent];
    if (byIntent) return byIntent;
  }

  return DEFAULT_TRIGGER_BY_SKILL[input.skill];
}

export function selectWorkflowTemplate(
  input: ResolveWorkflowInput
): WorkflowTemplate {
  const trigger = resolveTriggerFromInput(input);

  const exact = WORKFLOW_TEMPLATES.find(
    (template) => template.skill === input.skill && template.trigger === trigger
  );
  if (exact) return exact;

  const primaryId = PRIMARY_TEMPLATE_BY_SKILL[input.skill];
  const primary = WORKFLOW_TEMPLATES.find((template) => template.id === primaryId);
  if (primary) return primary;

  return WORKFLOW_TEMPLATES[0];
}

export function getPrimaryTemplateForSkill(skill: HelpySkill): WorkflowTemplate {
  const id = PRIMARY_TEMPLATE_BY_SKILL[skill];
  return (
    WORKFLOW_TEMPLATES.find((template) => template.id === id) ??
    WORKFLOW_TEMPLATES[0]
  );
}
