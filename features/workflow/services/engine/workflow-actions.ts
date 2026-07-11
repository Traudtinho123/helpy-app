import type { WorkflowCreatedObject, WorkflowStepId } from "@/features/workflow/services/engine/types";

export type WorkflowStepDefinition = {
  id: WorkflowStepId;
  label: string;
  beschreibung: string;
  objectTyp?: string;
};

export const WORKFLOW_STEP_DEFINITIONS: Record<
  WorkflowStepId,
  WorkflowStepDefinition
> = {
  interessent_erkennen: {
    id: "interessent_erkennen",
    label: "Interessent erkennen",
    beschreibung: "Kontakt und Suchprofil aus dem Eingang extrahiert.",
  },
  interessent_anlegen: {
    id: "interessent_anlegen",
    label: "Interessent anlegen",
    beschreibung: "Neue Interessentenakte mit Kontaktdaten angelegt.",
    objectTyp: "interessent",
  },
  besichtigung_erkennen: {
    id: "besichtigung_erkennen",
    label: "Besichtigungswunsch erkennen",
    beschreibung: "Terminwunsch und Objektbezug identifiziert.",
  },
  termin_vorbereiten: {
    id: "termin_vorbereiten",
    label: "Termin vorbereiten",
    beschreibung: "Besichtigungstermin als Entwurf vorbereitet.",
    objectTyp: "termin",
  },
  expose_vorbereiten: {
    id: "expose_vorbereiten",
    label: "Exposé vorbereiten",
    beschreibung: "Passendes Exposé für das Objekt zusammengestellt.",
    objectTyp: "expose",
  },
  kunde_erkennen: {
    id: "kunde_erkennen",
    label: "Kunde erkennen",
    beschreibung: "Bestands- oder Neukunde im Eingang identifiziert.",
  },
  kunde_anlegen: {
    id: "kunde_anlegen",
    label: "Kunde anlegen",
    beschreibung: "Kundenstamm mit Ansprechpartner angelegt.",
    objectTyp: "kunde",
  },
  baustelle_anlegen: {
    id: "baustelle_anlegen",
    label: "Baustelle anlegen",
    beschreibung: "Baustellenakte mit Adresse und Projektstatus erstellt.",
    objectTyp: "baustelle",
  },
  vor_ort_termin_vorbereiten: {
    id: "vor_ort_termin_vorbereiten",
    label: "Vor-Ort-Termin vorbereiten",
    beschreibung: "Besichtigungstermin auf der Baustelle vorbereitet.",
    objectTyp: "termin",
  },
  offerte_vorbereiten: {
    id: "offerte_vorbereiten",
    label: "Offerte vorbereiten",
    beschreibung: "Offertentwurf mit Positionen vorbereitet.",
    objectTyp: "offerte",
  },
  materialliste_vorbereiten: {
    id: "materialliste_vorbereiten",
    label: "Materialliste vorbereiten",
    beschreibung: "Materialbedarf aus der Anfrage abgeleitet.",
    objectTyp: "materialliste",
  },
  mandant_erkennen: {
    id: "mandant_erkennen",
    label: "Mandant/Kunde erkennen",
    beschreibung: "Anfragender als Mandant oder Interessent erkannt.",
  },
  akte_anlegen: {
    id: "akte_anlegen",
    label: "Akte oder Projekt anlegen",
    beschreibung: "Mandats- oder Projektakte strukturiert angelegt.",
    objectTyp: "akte",
  },
  frist_erkennen: {
    id: "frist_erkennen",
    label: "Frist erkennen",
    beschreibung: "Relevante Fristen aus dem Eingang extrahiert.",
    objectTyp: "frist",
  },
  erstgespraech_vorbereiten: {
    id: "erstgespraech_vorbereiten",
    label: "Erstgespräch vorbereiten",
    beschreibung: "Terminvorschlag und Gesprächsagenda vorbereitet.",
    objectTyp: "termin",
  },
  dokumente_sammeln: {
    id: "dokumente_sammeln",
    label: "Dokumente sammeln",
    beschreibung: "Relevante Unterlagen dem Vorgang zugeordnet.",
    objectTyp: "dokument",
  },
  aufgabe_erstellen: {
    id: "aufgabe_erstellen",
    label: "Aufgabe erstellen",
    beschreibung: "Nächster Schritt als Aufgabe hinterlegt.",
    objectTyp: "aufgabe",
  },
  workspace_vorbereiten: {
    id: "workspace_vorbereiten",
    label: "Workspace vorbereiten",
    beschreibung: "Vorgangs-Workspace mit allen Daten geöffnet.",
    objectTyp: "workspace",
  },
};

export function getWorkflowStep(stepId: WorkflowStepId): WorkflowStepDefinition {
  return WORKFLOW_STEP_DEFINITIONS[stepId];
}

export function buildPreparedActions(stepIds: WorkflowStepId[]) {
  return stepIds.map((stepId) => {
    const step = WORKFLOW_STEP_DEFINITIONS[stepId];
    return {
      id: step.id,
      label: step.label,
      beschreibung: step.beschreibung,
      erledigt: true,
    };
  });
}

export function buildCreatedObjects(
  stepIds: WorkflowStepId[]
): WorkflowCreatedObject[] {
  return stepIds
    .map((stepId) => WORKFLOW_STEP_DEFINITIONS[stepId])
    .filter((step) => step.objectTyp)
    .map((step) => ({
      id: `obj-${step.id}`,
      typ: step.objectTyp as WorkflowCreatedObject["typ"],
      label: step.label,
      detail: step.beschreibung,
    }));
}
