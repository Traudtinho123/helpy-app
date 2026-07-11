import { createWorkflowTriggerEvent } from "@/features/workflow/services/engine/workflow-events";
import type { WorkflowTriggerEvent } from "@/features/workflow/services/engine/types";

export const MOCK_WORKFLOW_TRIGGERS: WorkflowTriggerEvent[] = [
  createWorkflowTriggerEvent({
    id: "trigger-immoscout-techstart",
    source: "immoscout24",
    triggerType: "immoscout-anfrage",
    skill: "real-estate",
    receivedAt: "09:12",
    absender: "Lisa Wagner · TechStart AG",
    zusammenfassung:
      "Besichtigungswunsch für Gewerbeobjekt Mediapark 8 — 250 m² Bürofläche.",
  }),
  createWorkflowTriggerEvent({
    id: "trigger-offerte-weber",
    source: "gmail",
    triggerType: "offertanfrage",
    skill: "construction",
    receivedAt: "09:14",
    absender: "Thomas Müller · Weber & Co. GmbH",
    zusammenfassung:
      "Offertanfrage für 45 Arbeitsplätze inkl. Lieferung und Montage.",
  }),
  createWorkflowTriggerEvent({
    id: "trigger-mandat-finanzamt",
    source: "website-formular",
    triggerType: "mandatsanfrage",
    skill: "consulting-legal",
    receivedAt: "09:16",
    absender: "Finanzamt München · Steuerbescheid 2024",
    zusammenfassung:
      "Beratungsanfrage mit Einspruchsfrist — Mandatsaufnahme und Fristenprüfung.",
  }),
];

export const WORKFLOW_PANEL_MESSAGE_READY =
  "Ich habe neue Eingänge geprüft und daraus vorbereitete Vorgänge erstellt.";

export const WORKFLOW_PANEL_RECOMMENDATION =
  "Du musst nur noch prüfen und bestätigen. Ich empfehle als nächsten Schritt, mit der Immobilienanfrage zu starten.";

export const WORKFLOW_FEEDBACK_MESSAGES = {
  vorgang_oeffnet: "Alles vorbereitet — bitte prüfen und bestätigen.",
  offerte_oeffnet: "Ich habe die Offerte im Workspace vorbereitet.",
  frist_geprueft: "Frist ist im Vorgang hinterlegt — bitte kurz bestätigen.",
  erledigt: "Erledigt — ich habe den Vorgang als abgeschlossen markiert.",
} as const;
